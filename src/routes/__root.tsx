import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <nav className="mx-auto flex w-full max-w-2xl pt-2">
        <Button asChild variant="link">
          <Link to="/" activeOptions={{ exact: true }}>
            Home
          </Link>
        </Button>
        <Button asChild variant="link">
          <Link to="/about">About</Link>
        </Button>
        <Button asChild variant="link">
          <Link to="/localStorage">localStorage</Link>
        </Button>
      </nav>
      <Outlet />
    </>
  );
}
