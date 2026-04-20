import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  // Preserve the exact active URL so scans work for local previews, branch deploys, and production.
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      {shareUrl ? (
        <QRCodeSVG
          value={shareUrl}
          size={640}
          level="M"
          marginSize={4}
          title="Share this app"
          className="h-auto w-full max-w-[32rem]"
        />
      ) : (
        <div className="aspect-square w-full max-w-[32rem] bg-muted" />
      )}
    </main>
  );
}
