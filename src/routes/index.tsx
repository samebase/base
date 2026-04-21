import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

type NodeId =
  | "github"
  | "cloudflare"
  | "browser"
  | "tanstack"
  | "convex-client"
  | "convex-backend"
  | "convex-db";

type DiagramNode = {
  id: NodeId;
  title: string;
  layer: "Platform" | "Frontend" | "Backend";
  summary: string;
  details: string[];
};

type DiagramEdge = {
  from: NodeId;
  to: NodeId;
  label: string;
};

const DIAGRAM_NODES: DiagramNode[] = [
  {
    id: "github",
    title: "GitHub",
    layer: "Platform",
    summary: "Source control + PR workflow.",
    details: [
      "Every incremental commit is visible in pull request history.",
      "Cloudflare Pages watches branches and creates preview deploys.",
      "Use small commits so each change has one clear purpose.",
    ],
  },
  {
    id: "cloudflare",
    title: "Cloudflare Pages",
    layer: "Platform",
    summary: "Builds and serves your frontend.",
    details: [
      "Runs build commands from package.json.",
      "Creates per-branch preview URLs.",
      "Publishes production from main branch.",
    ],
  },
  {
    id: "browser",
    title: "React App",
    layer: "Frontend",
    summary: "UI that users interact with.",
    details: [
      "Rendered with React + TanStack Router.",
      "Calls Convex queries and mutations through generated API bindings.",
      "Subscribes to backend updates for live UI refresh.",
    ],
  },
  {
    id: "tanstack",
    title: "TanStack Router",
    layer: "Frontend",
    summary: "File-based routing for pages.",
    details: [
      "src/routes/*.tsx defines route modules.",
      "routeTree.gen.ts is generated router wiring.",
      "Gives typed route navigation and parameters.",
    ],
  },
  {
    id: "convex-client",
    title: "Convex React Client",
    layer: "Frontend",
    summary: "Transport layer for queries and mutations.",
    details: [
      "useQuery keeps UI synced with backend state.",
      "useMutation sends writes to backend functions.",
      "Types come from convex/_generated/api.",
    ],
  },
  {
    id: "convex-backend",
    title: "Convex Functions",
    layer: "Backend",
    summary: "Business logic for reads and writes.",
    details: [
      "Functions are defined in convex/*.ts modules.",
      "Schema controls data shape and validation.",
      "Convex deploy updates backend independently from frontend.",
    ],
  },
  {
    id: "convex-db",
    title: "Convex Database",
    layer: "Backend",
    summary: "Persistent real-time document store.",
    details: [
      "Stores todo documents and any future app entities.",
      "Query subscriptions re-run when relevant docs change.",
      "Designed for low operational overhead.",
    ],
  },
];

const DIAGRAM_EDGES: DiagramEdge[] = [
  { from: "github", to: "cloudflare", label: "push branch" },
  { from: "cloudflare", to: "browser", label: "serve preview" },
  { from: "tanstack", to: "browser", label: "route UI" },
  { from: "browser", to: "convex-client", label: "hooks" },
  { from: "convex-client", to: "convex-backend", label: "query/mutation" },
  { from: "convex-backend", to: "convex-db", label: "read/write docs" },
  { from: "convex-db", to: "browser", label: "live updates" },
];

const IMPLEMENTATION_STEPS = [
  {
    id: "step-1",
    title: "Build a visual architecture map",
    description:
      "Replace the starter todo page with a clear map of frontend, backend, and deploy flow.",
  },
  {
    id: "step-2",
    title: "Make the map interactive",
    description:
      "Allow clicking each node to see responsibilities, key files, and next learning steps.",
  },
  {
    id: "step-3",
    title: "Add code-level traceability",
    description: "Connect every node to concrete files so the app doubles as a repo tour.",
  },
  {
    id: "step-4",
    title: "Polish for preview demos",
    description:
      "Refine visual hierarchy, labels, and spacing so every preview build is easy to follow.",
  },
];

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [selectedNode, setSelectedNode] = useState<NodeId>("browser");
  const [activeStep, setActiveStep] = useState(0);

  const selected = useMemo(
    () => DIAGRAM_NODES.find((node) => node.id === selectedNode) ?? DIAGRAM_NODES[0],
    [selectedNode],
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 p-5 md:p-8">
      <header className="space-y-3">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Interactive repo guide
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Convex + Cloudflare Pages System Diagram
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          This app turns your repository into a visual walkthrough. Click a system node to inspect
          what it does and how it fits into the full stack.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Architecture map
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            {(["Platform", "Frontend", "Backend"] as const).map((layer) => (
              <div key={layer} className="space-y-3">
                <h3 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  {layer}
                </h3>
                <div className="space-y-2">
                  {DIAGRAM_NODES.filter((node) => node.layer === layer).map((node) => {
                    const isActive = node.id === selectedNode;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedNode(node.id)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          isActive
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background hover:border-foreground/40"
                        }`}
                      >
                        <p className="text-sm font-medium">{node.title}</p>
                        <p
                          className={`text-xs ${isActive ? "text-background/80" : "text-muted-foreground"}`}
                        >
                          {node.summary}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-dashed p-3">
            <h3 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Data and deployment flow
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {DIAGRAM_EDGES.map((edge) => (
                <li
                  key={`${edge.from}-${edge.to}`}
                >{`• ${labelFor(edge.from)} → ${labelFor(edge.to)} (${edge.label})`}</li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="rounded-2xl border bg-card p-4 md:p-6">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Selected node
          </h2>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{selected.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{selected.summary}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {selected.details.map((detail) => (
              <li key={detail} className="rounded-lg border bg-background px-3 py-2">
                {detail}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="rounded-2xl border bg-card p-4 md:p-6">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Implementation plan
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We will keep the preview link understandable at every commit by shipping in small visual
          milestones.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {IMPLEMENTATION_STEPS.map((step, index) => {
            const isActive = index === activeStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`rounded-xl border p-4 text-left transition ${
                  isActive
                    ? "border-foreground bg-secondary"
                    : "bg-background hover:border-foreground/30"
                }`}
              >
                <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  Step {index + 1}
                </p>
                <p className="mt-1 font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function labelFor(nodeId: NodeId) {
  return DIAGRAM_NODES.find((node) => node.id === nodeId)?.title ?? nodeId;
}
