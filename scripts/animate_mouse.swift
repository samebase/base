import AppKit
import CoreGraphics
import Foundation

enum MouseAnimationError: Error, CustomStringConvertible {
    case invalidArguments(String)
    case noActions
    case safetyCheckFailed(String)

    var description: String {
        switch self {
        case .invalidArguments(let message):
            return message
        case .noActions:
            return "Provide at least one action with --actions or --points."
        case .safetyCheckFailed(let message):
            return message
        }
    }
}

enum MouseAction {
    case move(CGPoint)
    case click(CGPoint)
    case doubleClick(CGPoint)
    case rightClick(CGPoint)
    case mouseDown(CGPoint)
    case mouseUp(CGPoint)
    case drag(from: CGPoint, to: CGPoint)
    case scroll(deltaX: Int32, deltaY: Int32)
    case wait(TimeInterval)
}

struct MouseAnimationOptions {
    let actions: [MouseAction]
    let moveDuration: TimeInterval
    let dragDuration: TimeInterval
    let pauseBeforeClick: TimeInterval
    let pauseAfterClick: TimeInterval
    let doubleClickInterval: TimeInterval
    let mouseDownPause: TimeInterval
    let scrollStepPause: TimeInterval
    let requireFrontmostBundle: String?
    let requireWindowOwner: String?

    init(arguments: [String]) throws {
        var values: [String: String] = [:]
        var index = 0

        while index < arguments.count {
            let key = arguments[index]
            guard key.hasPrefix("--") else {
                throw MouseAnimationError.invalidArguments("Unexpected argument: \(key)")
            }

            guard index + 1 < arguments.count else {
                throw MouseAnimationError.invalidArguments("Missing value for \(key)")
            }

            values[String(key.dropFirst(2))] = arguments[index + 1]
            index += 2
        }

        let parsedActions: [MouseAction]

        if let rawActions = values["actions"] {
            parsedActions = try Self.parseActions(rawActions)
        } else if let rawPoints = values["points"] {
            parsedActions = try Self.parsePoints(rawPoints).map(MouseAction.click)
        } else {
            throw MouseAnimationError.invalidArguments("Missing required --actions or --points")
        }

        guard !parsedActions.isEmpty else {
            throw MouseAnimationError.noActions
        }

        self.actions = parsedActions
        self.moveDuration = TimeInterval(values["move-duration"] ?? "0.7") ?? 0.7
        self.dragDuration = TimeInterval(values["drag-duration"] ?? "0.7") ?? 0.7
        self.pauseBeforeClick = TimeInterval(values["pause-before-click"] ?? "0.12") ?? 0.12
        self.pauseAfterClick = TimeInterval(values["pause-after-click"] ?? "0.55") ?? 0.55
        self.doubleClickInterval = TimeInterval(values["double-click-interval"] ?? "0.12") ?? 0.12
        self.mouseDownPause = TimeInterval(values["mouse-down-pause"] ?? "0.08") ?? 0.08
        self.scrollStepPause = TimeInterval(values["scroll-step-pause"] ?? "0.015") ?? 0.015
        self.requireFrontmostBundle = values["require-frontmost-bundle"]
        self.requireWindowOwner = values["require-window-owner"]
    }

    private static func parseActions(_ rawActions: String) throws -> [MouseAction] {
        try rawActions.split(separator: ";").map { rawAction in
            let pieces = rawAction.split(separator: ":", maxSplits: 1)
            guard pieces.count == 2 else {
                throw MouseAnimationError.invalidArguments("Invalid action: \(rawAction)")
            }

            let verb = pieces[0].trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            let value = pieces[1].trimmingCharacters(in: .whitespacesAndNewlines)

            switch verb {
            case "move":
                return .move(try parsePoint(value))
            case "click", "left":
                return .click(try parsePoint(value))
            case "double", "double-click", "doubleclick":
                return .doubleClick(try parsePoint(value))
            case "right", "right-click", "rightclick":
                return .rightClick(try parsePoint(value))
            case "down", "mouse-down", "mousedown":
                return .mouseDown(try parsePoint(value))
            case "up", "mouse-up", "mouseup":
                return .mouseUp(try parsePoint(value))
            case "drag":
                let dragPoints = value.split(separator: ">", maxSplits: 1)
                guard dragPoints.count == 2 else {
                    throw MouseAnimationError.invalidArguments("Invalid drag action: \(rawAction)")
                }

                return .drag(
                    from: try parsePoint(String(dragPoints[0])),
                    to: try parsePoint(String(dragPoints[1]))
                )
            case "scroll":
                return try parseScrollAction(value)
            case "wait", "pause":
                guard let seconds = TimeInterval(value) else {
                    throw MouseAnimationError.invalidArguments("Invalid wait duration: \(rawAction)")
                }
                return .wait(seconds)
            default:
                throw MouseAnimationError.invalidArguments("Unknown action verb: \(verb)")
            }
        }
    }

    private static func parsePoints(_ rawPoints: String) throws -> [CGPoint] {
        try rawPoints.split(separator: ";").map { pointString in
            try parsePoint(String(pointString))
        }
    }

    private static func parseScrollAction(_ rawValue: String) throws -> MouseAction {
        let components = rawValue.split(separator: ",").map {
            $0.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        switch components.count {
        case 1:
            guard let deltaY = Int32(components[0]) else {
                throw MouseAnimationError.invalidArguments("Invalid scroll value: \(rawValue)")
            }
            return .scroll(deltaX: 0, deltaY: deltaY)
        case 2:
            guard
                let deltaX = Int32(components[0]),
                let deltaY = Int32(components[1])
            else {
                throw MouseAnimationError.invalidArguments("Invalid scroll value: \(rawValue)")
            }
            return .scroll(deltaX: deltaX, deltaY: deltaY)
        default:
            throw MouseAnimationError.invalidArguments("Invalid scroll value: \(rawValue)")
        }
    }

    private static func parsePoint(_ rawPoint: String) throws -> CGPoint {
        let components = rawPoint.split(separator: ",")
        guard
            components.count == 2,
            let x = Double(components[0]),
            let y = Double(components[1])
        else {
            throw MouseAnimationError.invalidArguments("Invalid point: \(rawPoint)")
        }

        return CGPoint(x: x, y: y)
    }
}

func currentMouseLocation() -> CGPoint {
    if let event = CGEvent(source: nil) {
        return event.location
    }

    return NSEvent.mouseLocation
}

func sleepSeconds(_ duration: TimeInterval) {
    usleep(useconds_t(duration * 1_000_000))
}

func frontmostBundleIdentifier() -> String? {
    NSWorkspace.shared.frontmostApplication?.bundleIdentifier
}

func frontmostWindowFrame(ownerName: String) -> CGRect? {
    guard
        let infoList = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID)
            as? [[String: Any]]
    else {
        return nil
    }

    for info in infoList {
        guard
            let owner = info[kCGWindowOwnerName as String] as? String,
            owner == ownerName,
            let layer = info[kCGWindowLayer as String] as? Int,
            layer == 0,
            let bounds = info[kCGWindowBounds as String] as? [String: Any],
            let rect = CGRect(dictionaryRepresentation: bounds as CFDictionary),
            rect.width > 160,
            rect.height > 160
        else {
            continue
        }

        return rect
    }

    return nil
}

func verifyFrontmostBundle(_ expectedBundle: String?) throws {
    guard let expectedBundle else {
        return
    }

    guard frontmostBundleIdentifier() == expectedBundle else {
        let actual = frontmostBundleIdentifier() ?? "<none>"
        throw MouseAnimationError.safetyCheckFailed(
            "Aborted mouse automation because the frontmost app was \(actual), not \(expectedBundle)."
        )
    }
}

func verifyPoint(_ point: CGPoint, insideWindowOwner ownerName: String?) throws {
    guard let ownerName else {
        return
    }

    guard let frame = frontmostWindowFrame(ownerName: ownerName) else {
        throw MouseAnimationError.safetyCheckFailed(
            "Aborted mouse automation because no visible \(ownerName) window could be found."
        )
    }

    let insetFrame = frame.insetBy(dx: 2, dy: 2)
    guard insetFrame.contains(point) else {
        throw MouseAnimationError.safetyCheckFailed(
            "Aborted mouse automation because target point \(Int(point.x)),\(Int(point.y)) was outside the visible \(ownerName) window frame \(NSStringFromRect(insetFrame))."
        )
    }
}

func verifyCurrentPointerInsideWindow(ownerName: String?) throws {
    guard let ownerName else {
        return
    }

    try verifyPoint(currentMouseLocation(), insideWindowOwner: ownerName)
}

func moveCursor(from start: CGPoint, to end: CGPoint, duration: TimeInterval) {
    let steps = max(Int(duration * 120), 1)

    for step in 1...steps {
        let progress = Double(step) / Double(steps)
        let eased = 1 - pow(1 - progress, 3)
        let point = CGPoint(
            x: start.x + (end.x - start.x) * eased,
            y: start.y + (end.y - start.y) * eased
        )
        CGWarpMouseCursorPosition(point)
        sleepSeconds(duration / Double(steps))
    }
}

func makeMouseEvent(
    type: CGEventType,
    point: CGPoint,
    button: CGMouseButton,
    clickCount: Int64 = 1
) -> CGEvent? {
    let event = CGEvent(
        mouseEventSource: nil,
        mouseType: type,
        mouseCursorPosition: point,
        mouseButton: button
    )
    event?.setIntegerValueField(.mouseEventClickState, value: clickCount)
    return event
}

func eventType(for button: CGMouseButton, isDown: Bool) -> CGEventType {
    switch (button, isDown) {
    case (.left, true):
        return .leftMouseDown
    case (.left, false):
        return .leftMouseUp
    case (.right, true):
        return .rightMouseDown
    case (.right, false):
        return .rightMouseUp
    default:
        return isDown ? .otherMouseDown : .otherMouseUp
    }
}

func click(at point: CGPoint, button: CGMouseButton = .left, clickCount: Int64 = 1) {
    guard
        let mouseDown = makeMouseEvent(
            type: eventType(for: button, isDown: true),
            point: point,
            button: button,
            clickCount: clickCount
        ),
        let mouseUp = makeMouseEvent(
            type: eventType(for: button, isDown: false),
            point: point,
            button: button,
            clickCount: clickCount
        )
    else {
        return
    }

    mouseDown.post(tap: .cghidEventTap)
    sleepSeconds(0.08)
    mouseUp.post(tap: .cghidEventTap)
}

func doubleClick(at point: CGPoint, interval: TimeInterval) {
    click(at: point, button: .left, clickCount: 1)
    sleepSeconds(interval)
    click(at: point, button: .left, clickCount: 2)
}

func mouseDown(at point: CGPoint, button: CGMouseButton = .left, clickCount: Int64 = 1) {
    makeMouseEvent(
        type: eventType(for: button, isDown: true),
        point: point,
        button: button,
        clickCount: clickCount
    )?.post(tap: .cghidEventTap)
}

func mouseUp(at point: CGPoint, button: CGMouseButton = .left, clickCount: Int64 = 1) {
    makeMouseEvent(
        type: eventType(for: button, isDown: false),
        point: point,
        button: button,
        clickCount: clickCount
    )?.post(tap: .cghidEventTap)
}

func dragCursor(from start: CGPoint, to end: CGPoint, duration: TimeInterval) {
    let steps = max(Int(duration * 120), 1)

    for step in 1...steps {
        let progress = Double(step) / Double(steps)
        let eased = 1 - pow(1 - progress, 3)
        let point = CGPoint(
            x: start.x + (end.x - start.x) * eased,
            y: start.y + (end.y - start.y) * eased
        )
        CGWarpMouseCursorPosition(point)
        makeMouseEvent(
            type: .leftMouseDragged,
            point: point,
            button: .left
        )?.post(tap: .cghidEventTap)
        sleepSeconds(duration / Double(steps))
    }
}

func scroll(deltaX: Int32, deltaY: Int32, stepPause: TimeInterval) {
    let maxMagnitude = max(abs(deltaX), abs(deltaY))
    let stepCount = max(Int(ceil(Double(maxMagnitude) / 12.0)), 1)

    var sentX: Int32 = 0
    var sentY: Int32 = 0

    for step in 1...stepCount {
        let progress = Double(step) / Double(stepCount)
        let targetX = Int32((Double(deltaX) * progress).rounded())
        let targetY = Int32((Double(deltaY) * progress).rounded())
        let eventDeltaX = targetX - sentX
        let eventDeltaY = targetY - sentY

        sentX = targetX
        sentY = targetY

        guard eventDeltaX != 0 || eventDeltaY != 0 else {
            continue
        }

        let event = CGEvent(
            scrollWheelEvent2Source: nil,
            units: .pixel,
            wheelCount: 2,
            wheel1: eventDeltaY,
            wheel2: eventDeltaX,
            wheel3: 0
        )
        event?.post(tap: .cghidEventTap)
        sleepSeconds(stepPause)
    }
}

@main
enum MouseAnimationCLI {
    static func main() {
        do {
            let options = try MouseAnimationOptions(arguments: Array(CommandLine.arguments.dropFirst()))
            var currentPoint = currentMouseLocation()

            for action in options.actions {
                switch action {
                case .move(let point):
                    moveCursor(from: currentPoint, to: point, duration: options.moveDuration)
                    currentPoint = point
                case .click(let point):
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(point, insideWindowOwner: options.requireWindowOwner)
                    moveCursor(from: currentPoint, to: point, duration: options.moveDuration)
                    sleepSeconds(options.pauseBeforeClick)
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(point, insideWindowOwner: options.requireWindowOwner)
                    click(at: point)
                    sleepSeconds(options.pauseAfterClick)
                    currentPoint = point
                case .doubleClick(let point):
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(point, insideWindowOwner: options.requireWindowOwner)
                    moveCursor(from: currentPoint, to: point, duration: options.moveDuration)
                    sleepSeconds(options.pauseBeforeClick)
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(point, insideWindowOwner: options.requireWindowOwner)
                    doubleClick(at: point, interval: options.doubleClickInterval)
                    sleepSeconds(options.pauseAfterClick)
                    currentPoint = point
                case .rightClick(let point):
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(point, insideWindowOwner: options.requireWindowOwner)
                    moveCursor(from: currentPoint, to: point, duration: options.moveDuration)
                    sleepSeconds(options.pauseBeforeClick)
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(point, insideWindowOwner: options.requireWindowOwner)
                    click(at: point, button: .right)
                    sleepSeconds(options.pauseAfterClick)
                    currentPoint = point
                case .mouseDown(let point):
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(point, insideWindowOwner: options.requireWindowOwner)
                    moveCursor(from: currentPoint, to: point, duration: options.moveDuration)
                    sleepSeconds(options.pauseBeforeClick)
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(point, insideWindowOwner: options.requireWindowOwner)
                    mouseDown(at: point)
                    sleepSeconds(options.mouseDownPause)
                    currentPoint = point
                case .mouseUp(let point):
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(point, insideWindowOwner: options.requireWindowOwner)
                    moveCursor(from: currentPoint, to: point, duration: options.moveDuration)
                    sleepSeconds(options.pauseBeforeClick)
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(point, insideWindowOwner: options.requireWindowOwner)
                    mouseUp(at: point)
                    sleepSeconds(options.pauseAfterClick)
                    currentPoint = point
                case .drag(let start, let end):
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(start, insideWindowOwner: options.requireWindowOwner)
                    try verifyPoint(end, insideWindowOwner: options.requireWindowOwner)
                    moveCursor(from: currentPoint, to: start, duration: options.moveDuration)
                    sleepSeconds(options.pauseBeforeClick)
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(start, insideWindowOwner: options.requireWindowOwner)
                    mouseDown(at: start)
                    sleepSeconds(options.mouseDownPause)
                    dragCursor(from: start, to: end, duration: options.dragDuration)
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyPoint(end, insideWindowOwner: options.requireWindowOwner)
                    mouseUp(at: end)
                    sleepSeconds(options.pauseAfterClick)
                    currentPoint = end
                case .scroll(let deltaX, let deltaY):
                    try verifyFrontmostBundle(options.requireFrontmostBundle)
                    try verifyCurrentPointerInsideWindow(ownerName: options.requireWindowOwner)
                    scroll(deltaX: deltaX, deltaY: deltaY, stepPause: options.scrollStepPause)
                    sleepSeconds(options.pauseAfterClick)
                case .wait(let duration):
                    sleepSeconds(duration)
                }
            }
        } catch {
            fputs("animate_mouse.swift failed: \(error)\n", stderr)
            exit(1)
        }
    }
}
