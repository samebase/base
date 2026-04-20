import { useMutation, useQuery } from "convex/react";
import { type FormEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
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

  const todos = useQuery(api.todos.list, {});
  const createTodo = useMutation(api.todos.create);
  const toggleTodo = useMutation(api.todos.toggle);
  const moveTodo = useMutation(api.todos.move);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!text) {
      return;
    }

    await createTodo({ text });
    setDraft("");
  };

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <h1 className="bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-500 bg-clip-text text-xl font-semibold text-transparent">
        Todo list
      </h1>

      <form className="flex gap-2" onSubmit={onSubmit}>
        <Input
          placeholder="New todo"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="border-primary/30 bg-card/70 shadow-sm shadow-primary/20"
        />
        <Button
          type="submit"
          disabled={!text}
          className="bg-primary shadow-md shadow-primary/40 hover:bg-primary/90"
        >
          Add
        </Button>
      </form>

      <ul className="space-y-2">
        {todos?.map((todo, index) => (
          <li key={todo._id}>
            <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-card/80 p-2 shadow-sm shadow-primary/10">
              <label
                htmlFor={`todo-${todo._id}`}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
              >
                <Checkbox
                  id={`todo-${todo._id}`}
                  checked={todo.done}
                  onCheckedChange={() => {
                    void toggleTodo({ id: todo._id });
                  }}
                />

                <span
                  className={todo.done ? "truncate text-muted-foreground line-through" : "truncate"}
                >
                  {todo.text}
                </span>
              </label>

              <div className="flex items-center gap-1">
                <Button
                  size="icon-xs"
                  variant="outline"
                  aria-label="Move todo up"
                  disabled={index === 0}
                  onClick={() => {
                    void moveTodo({ id: todo._id, direction: "up" });
                  }}
                >
                  <ArrowUp />
                </Button>
                <Button
                  size="icon-xs"
                  variant="outline"
                  aria-label="Move todo down"
                  disabled={index === todos.length - 1}
                  onClick={() => {
                    void moveTodo({ id: todo._id, direction: "down" });
                  }}
                >
                  <ArrowDown />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
