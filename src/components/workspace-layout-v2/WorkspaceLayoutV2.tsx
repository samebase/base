import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type WorkspaceLayoutV2Props = {
  sidebar: ReactNode;
  main: ReactNode;
  className?: string;
  sidebarClassName?: string;
  mainClassName?: string;
};

export function WorkspaceLayoutV2({
  sidebar,
  main,
  className,
  sidebarClassName,
  mainClassName,
}: WorkspaceLayoutV2Props) {
  return (
    <div
      className={cn(
        "grid min-h-[calc(100vh-2.5rem)] grid-cols-1 content-start overflow-hidden border-t bg-background md:grid-cols-[16rem_minmax(0,1fr)] md:content-stretch",
        className,
      )}
    >
      <aside
        className={cn(
          "border-b bg-sidebar text-sidebar-foreground md:border-r md:border-b-0",
          sidebarClassName,
        )}
      >
        {sidebar}
      </aside>
      <main className={cn("min-w-0 overflow-auto", mainClassName)}>{main}</main>
    </div>
  );
}
