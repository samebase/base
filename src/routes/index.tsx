import { useMutation, useQuery } from "convex/react";
import { type FormEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [draft, setDraft] = useState("");
  const text = draft.trim();
  // Preserve the exact active URL so scans work for local previews, branch deploys, and production.
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;

  const todos = useQuery(api.todos.list, {});
  const createTodo = useMutation(api.todos.create);
  const toggleTodo = useMutation(api.todos.toggle);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!text) {
      return;
    }

    await createTodo({ text });
    setDraft("");
  };

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-6">
      <div className="mx-auto w-full max-w-sm">
        {shareUrl ? (
          <QRCodeSVG
            value={shareUrl}
            size={640}
            level="M"
            marginSize={4}
            title="Share this app"
            bgColor="#ffffff"
            className="h-auto w-full"
          />
        ) : (
          <div className="aspect-square w-full bg-muted" />
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h1 className="text-lg">Todo list</h1>

        <form className="flex gap-2" onSubmit={onSubmit}>
          <Input
            placeholder="New todo"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" disabled={!text}>
            Add
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
      </section>
    </main>
  );
}
