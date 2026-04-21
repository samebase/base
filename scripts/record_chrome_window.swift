import AppKit
import AVFoundation
import CoreMedia
import CoreGraphics
import CoreVideo
import Dispatch
import Foundation
import ScreenCaptureKit

enum RecorderError: Error, CustomStringConvertible {
    case invalidArguments(String)
    case windowNotFound(String)
    case recordingFailed(String)
    case fileWasNotWritten(String)

    var description: String {
        switch self {
        case .invalidArguments(let message),
             .windowNotFound(let message),
             .recordingFailed(let message),
             .fileWasNotWritten(let message):
            return message
        }
    }
}

struct RecorderOptions {
    let bundleID: String
    let titleSubstring: String
    let outputPath: String
    let duration: TimeInterval
    let fps: Int32
    let cursorVisible: Bool
    let clickHighlights: Bool

    init(arguments: [String]) throws {
        var values: [String: String] = [:]
        var index = 0

        while index < arguments.count {
            let key = arguments[index]
            guard key.hasPrefix("--") else {
                throw RecorderError.invalidArguments("Unexpected argument: \(key)")
            }

            guard index + 1 < arguments.count else {
                throw RecorderError.invalidArguments("Missing value for \(key)")
            }

            values[String(key.dropFirst(2))] = arguments[index + 1]
            index += 2
        }

        guard let bundleID = values["bundle-id"], !bundleID.isEmpty else {
            throw RecorderError.invalidArguments("Missing required --bundle-id")
        }

        guard let titleSubstring = values["title-substring"], !titleSubstring.isEmpty else {
            throw RecorderError.invalidArguments("Missing required --title-substring")
        }

        guard let outputPath = values["output"], !outputPath.isEmpty else {
            throw RecorderError.invalidArguments("Missing required --output")
        }

        let duration = TimeInterval(values["duration"] ?? "4") ?? 4
        let fps = Int32(values["fps"] ?? "30") ?? 30
        let cursorVisible = (values["cursor"] ?? "true") == "true"
        let clickHighlights = (values["click-highlights"] ?? "true") == "true"

        self.bundleID = bundleID
        self.titleSubstring = titleSubstring
        self.outputPath = outputPath
        self.duration = duration
        self.fps = fps
        self.cursorVisible = cursorVisible
        self.clickHighlights = clickHighlights
    }
}

final class RecordingDelegate: NSObject, SCRecordingOutputDelegate {
    private(set) var failure: Error?

    func recordingOutput(_ recordingOutput: SCRecordingOutput, didFailWithError error: Error) {
        failure = error
    }
}

@MainActor
final class ChromeWindowRecorder {
    private var stream: SCStream?
    private var recordingOutput: SCRecordingOutput?
    private var recordingDelegate: RecordingDelegate?

    func record(options: RecorderOptions) async throws {
        let outputURL = URL(fileURLWithPath: options.outputPath)
        try FileManager.default.createDirectory(
            at: outputURL.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )

        if FileManager.default.fileExists(atPath: options.outputPath) {
            try FileManager.default.removeItem(at: outputURL)
        }

        let window = try await waitForWindow(
            bundleID: options.bundleID,
            titleSubstring: options.titleSubstring,
            timeout: 15
        )

        let filter = SCContentFilter(desktopIndependentWindow: window)
        let contentInfo = SCShareableContent.info(for: filter)
        let scale = max(CGFloat(contentInfo.pointPixelScale), 1)

        let configuration = SCStreamConfiguration()
        configuration.width = Int(window.frame.width * scale)
        configuration.height = Int(window.frame.height * scale)
        configuration.minimumFrameInterval = CMTime(value: 1, timescale: options.fps)
        configuration.pixelFormat = kCVPixelFormatType_32BGRA
        configuration.showsCursor = options.cursorVisible
        if #available(macOS 15.0, *), options.clickHighlights {
            configuration.showMouseClicks = true
        }
        configuration.scalesToFit = true

        let stream = SCStream(filter: filter, configuration: configuration, delegate: nil)
        self.stream = stream

        let recordingConfiguration = SCRecordingOutputConfiguration()
        recordingConfiguration.outputURL = outputURL
        recordingConfiguration.videoCodecType = .h264
        recordingConfiguration.outputFileType = .mp4

        let recordingDelegate = RecordingDelegate()
        let recordingOutput = SCRecordingOutput(
            configuration: recordingConfiguration,
            delegate: recordingDelegate
        )
        self.recordingDelegate = recordingDelegate
        self.recordingOutput = recordingOutput

        try stream.addRecordingOutput(recordingOutput)

        try await stream.startCapture()
        try await Task.sleep(for: .seconds(0.8))
        try await Task.sleep(for: .seconds(options.duration))
        do {
            try await stream.stopCapture()
        } catch {
            let nsError = error as NSError
            let alreadyStopped =
                nsError.domain == "com.apple.ScreenCaptureKit.SCStreamErrorDomain" &&
                nsError.code == -3808

            if !alreadyStopped {
                throw error
            }
        }
        try await Task.sleep(for: .seconds(1.2))

        if let failure = recordingDelegate.failure {
            throw RecorderError.recordingFailed(failure.localizedDescription)
        }

        guard FileManager.default.fileExists(atPath: options.outputPath) else {
            throw RecorderError.fileWasNotWritten(
                "ScreenCaptureKit finished without writing \(options.outputPath)."
            )
        }
    }

    private func waitForWindow(
        bundleID: String,
        titleSubstring: String,
        timeout: TimeInterval
    ) async throws -> SCWindow {
        let deadline = Date().addingTimeInterval(timeout)

        while Date() < deadline {
            let content = try await SCShareableContent.excludingDesktopWindows(
                false,
                onScreenWindowsOnly: true
            )

            if let window = content.windows.first(where: {
                guard
                    let owningApplication = $0.owningApplication,
                    owningApplication.bundleIdentifier == bundleID,
                    let title = $0.title
                else {
                    return false
                }
                return title.contains(titleSubstring)
            }) {
                return window
            }

            try await Task.sleep(for: .milliseconds(250))
        }

        throw RecorderError.windowNotFound(
            "Could not find an on-screen window for \(bundleID) matching title substring '\(titleSubstring)'."
        )
    }
}

@main
@MainActor
enum RecorderCLI {
    static func main() async {
        do {
            _ = NSApplication.shared
            let options = try RecorderOptions(arguments: Array(CommandLine.arguments.dropFirst()))
            let recorder = ChromeWindowRecorder()
            try await recorder.record(options: options)
            print(options.outputPath)
        } catch {
            fputs("record_chrome_window.swift failed: \(error)\n", stderr)
            exit(1)
        }
    }
}
