import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { QRCodeSVG } from "qrcode.react";
import { type FormEvent, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "#components/ui/button";
import { Checkbox } from "#components/ui/checkbox";
import { Input } from "#components/ui/input";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    // Read the browser URL after mount so prerendered HTML stays stable.
    setShareUrl(window.location.href);
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

      <AuthLoading>
        <section className="flex flex-col gap-3">
          <h1 className="text-lg">Todo list</h1>
        </section>
      </AuthLoading>
      <Unauthenticated>
        <GuestSignIn />
      </Unauthenticated>
      <Authenticated>
        <TodoWorkspace />
      </Authenticated>
    </main>
  );
}

function GuestSignIn() {
  const { signIn } = useAuthActions();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const continueAsGuest = () => {
    setError("");
    setIsPending(true);
    void signIn("anonymous")
      .catch((signInError: unknown) => {
        setError(signInError instanceof Error ? signInError.message : "Could not start session");
      })
      .finally(() => setIsPending(false));
  };

  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-lg">Todo list</h1>
      <Button type="button" disabled={isPending} onClick={continueAsGuest}>
        {isPending ? "Starting" : "Continue as guest"}
      </Button>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function TodoWorkspace() {
  const { signOut } = useAuthActions();
  const [draft, setDraft] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const text = draft.trim();

  const todos = useQuery(api.todos.list, {});
  const createTodo = useMutation(api.todos.create);
  const toggleTodo = useMutation(api.todos.toggle);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!text || isCreating) {
      return;
    }

    setIsCreating(true);
    try {
      await createTodo({ text });
      setDraft("");
    } finally {
      setIsCreating(false);
    }
  };

  const onSignOut = () => {
    setIsSigningOut(true);
    void signOut().finally(() => setIsSigningOut(false));
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg">Todo list</h1>
        <Button type="button" variant="outline" disabled={isSigningOut} onClick={onSignOut}>
          {isSigningOut ? "Signing out" : "Sign out"}
        </Button>
      </div>

      <form className="flex gap-2" onSubmit={onSubmit}>
        <Input
          placeholder="New todo"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" disabled={!text || isCreating}>
          {isCreating ? "Adding" : "Add"}
        </Button>
      </form>

      <ul className="space-y-2">
        {todos?.map((todo) => (
          <li key={todo._id}>
            <label
              htmlFor={`todo-${todo._id}`}
              className="flex cursor-pointer items-center gap-3 border p-2"
            >
              <Checkbox
                id={`todo-${todo._id}`}
                checked={todo.done}
                onCheckedChange={() => {
                  void toggleTodo({ id: todo._id });
                }}
              />

              <span className={todo.done ? "text-muted-foreground line-through" : ""}>
                {todo.text}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </>
  );
}
