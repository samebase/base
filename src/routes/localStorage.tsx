import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceLayoutV2 } from "@/components/workspace-layout-v2/WorkspaceLayoutV2";
import {
  readBrowserLocalStorageSnapshot,
  type LocalStorageEntry,
  type LocalStorageSnapshot as BrowserLocalStorageSnapshot,
} from "@/lib/read-local-storage-snapshot";

export const Route = createFileRoute("/localStorage")({
  component: LocalStoragePage,
});

type LocalStorageRouteSnapshot =
  | {
      status: "loading";
    }
  | BrowserLocalStorageSnapshot;

function LocalStoragePage() {
  const [snapshot, setSnapshot] = useState<LocalStorageRouteSnapshot>({
    status: "loading",
  });

  const refresh = useCallback(() => {
    setSnapshot(readBrowserLocalStorageSnapshot());
  }, []);

  useEffect(() => {
    refresh();

    const refreshWhenVisible = () => {
      if (!document.hidden) {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh]);

  return (
    <WorkspaceLayoutV2
      sidebar={<StorageSidebar />}
      main={<LocalStorageView snapshot={snapshot} onRefresh={refresh} />}
    />
  );
}

function StorageSidebar() {
  return (
    <nav className="p-2">
      <Button asChild variant="ghost" className="w-full justify-start">
        <Link to="/localStorage" aria-current="page">
          <FileText data-icon="inline-start" />
          localStorage
        </Link>
      </Button>
    </nav>
  );
}

function LocalStorageView({
  snapshot,
  onRefresh,
}: {
  snapshot: LocalStorageRouteSnapshot;
  onRefresh: () => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-medium">localStorage</h1>
        <Button type="button" variant="outline" onClick={onRefresh}>
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      <StorageSnapshotContent snapshot={snapshot} />
    </section>
  );
}

function StorageSnapshotContent({ snapshot }: { snapshot: LocalStorageRouteSnapshot }) {
  if (snapshot.status === "loading") {
    return <StatusMessage>Loading</StatusMessage>;
  }

  if (snapshot.status === "error") {
    return <StatusMessage>{snapshot.message}</StatusMessage>;
  }

  if (snapshot.entries.length === 0) {
    return <StatusMessage>No values</StatusMessage>;
  }

  return (
    <div className="overflow-hidden border">
      <div className="hidden grid-cols-[minmax(10rem,16rem)_minmax(0,1fr)] border-b bg-muted px-3 py-2 text-sm font-medium md:grid">
        <div>Key</div>
        <div>Value</div>
      </div>
      <div className="divide-y">
        {snapshot.entries.map((entry) => (
          <StorageEntryRow key={entry.key} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function StorageEntryRow({ entry }: { entry: LocalStorageEntry }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(10rem,16rem)_minmax(0,1fr)]">
      <div className="border-b bg-muted/40 px-3 py-2 font-mono text-sm break-all md:border-r md:border-b-0">
        {entry.key}
      </div>
      <pre className="min-h-9 overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-all">
        {entry.value}
      </pre>
    </div>
  );
}

function StatusMessage({ children }: { children: ReactNode }) {
  return <div className="border px-3 py-6 text-sm text-muted-foreground">{children}</div>;
}
