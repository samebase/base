import { convexQuery } from "@convex-dev/react-query";
import { SignedIn, SignedOut } from "@samebase/convex-auth-tanstack-start";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { QRCodeSVG } from "qrcode.react";
import { type FormEvent, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { GoogleSignIn } from "#components/GoogleSignIn";
import { GuestSignIn } from "#components/GuestSignIn";
import { Button } from "#components/ui/button";
import { Checkbox } from "#components/ui/checkbox";
import { Input } from "#components/ui/input";

const TODO_LIMIT = 50;
const TODO_TEXT_LIMIT = 280;

type VisibleTodo = {
  _id: Id<"todos">;
  creatorName: string;
  text: string;
  done: boolean;
  viewerCanToggle: boolean;
};

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      // @ts-expect-error convexQuery always sets queryFn, but its type allows undefined there, which `query` rejects under exactOptionalPropertyTypes.
      context.queryClient.query(convexQuery(api.todos.list, {})),
      // @ts-expect-error The same as above.
      context.queryClient.query(convexQuery(api.hub.googleSignInEnabled, {})),
    ]);
  },
  component: TodoPage,
});

function TodoPage() {
  const [shareUrl, setShareUrl] = useState("");
  // The loader fetched the list as the session of the request, so the server renders it. The
  // browser keeps it live.
  const {
    data: { todos, viewerTodoCount },
  } = useSuspenseQuery(convexQuery(api.todos.list, {}));
  const { data: googleSignInEnabled } = useSuspenseQuery(
    convexQuery(api.hub.googleSignInEnabled, {}),
  );
  const todoLimitReached = viewerTodoCount !== null && viewerTodoCount >= TODO_LIMIT;

  useEffect(() => {
    // The server has no browser URL, and the first browser render must match the server HTML. The
    // origin, because the URL still holds the sign-in code when Google sends the browser back.
    setShareUrl(window.location.origin);
  }, []);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-4">
      <div className="mx-auto aspect-square w-full max-w-sm">
        {shareUrl ? (
          <QRCodeSVG
            value={shareUrl}
            size={384}
            level="M"
            marginSize={4}
            title="Share this app"
            className="size-full"
          />
        ) : null}
      </div>

      <section className="flex flex-col gap-3">
        <h1 className="text-lg">Todo list</h1>
        <SignedOut>
          {googleSignInEnabled ? <GoogleSignIn /> : null}
          <GuestSignIn />
        </SignedOut>
        <SignedIn>
          <TodoForm todoLimitReached={todoLimitReached} />
        </SignedIn>
      </section>
      <TodoList todos={todos} />
    </main>
  );
}

function TodoForm({ todoLimitReached }: { todoLimitReached: boolean }) {
  const [draft, setDraft] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const text = draft.trim();
  const createTodo = useMutation(api.todos.create);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!text || isCreating || todoLimitReached) {
      return;
    }

    setCreateError("");
    setIsCreating(true);
    try {
      await createTodo({ text });
      setDraft("");
    } catch (error: unknown) {
      setCreateError(error instanceof Error ? error.message : "Could not add todo");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <form className="flex gap-2" onSubmit={onSubmit}>
        <Input
          placeholder="New todo"
          value={draft}
          maxLength={TODO_TEXT_LIMIT}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" disabled={!text || isCreating || todoLimitReached}>
          {isCreating ? "Adding" : "Add"}
        </Button>
      </form>
      {todoLimitReached ? (
        <p className="text-muted-foreground text-sm">Todo limit reached</p>
      ) : null}
      {createError ? (
        <p className="text-destructive text-sm" role="alert">
          {createError}
        </p>
      ) : null}
    </>
  );
}

function TodoList({ todos }: { todos: VisibleTodo[] }) {
  const toggleTodo = useMutation(api.todos.toggle);

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <li key={todo._id}>
          <label
            htmlFor={`todo-${todo._id}`}
            className={
              todo.viewerCanToggle
                ? "flex cursor-pointer items-center gap-3 border p-2"
                : "flex items-center gap-3 border p-2"
            }
          >
            <Checkbox
              id={`todo-${todo._id}`}
              checked={todo.done}
              disabled={!todo.viewerCanToggle}
              onCheckedChange={() => {
                if (!todo.viewerCanToggle) {
                  return;
                }
                void toggleTodo({ id: todo._id });
              }}
            />

            <span className="flex min-w-0 flex-col">
              <span className={todo.done ? "text-muted-foreground line-through" : ""}>
                {todo.text}
              </span>
              <span className="text-muted-foreground text-xs">Created by {todo.creatorName}</span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
