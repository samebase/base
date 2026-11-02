import { useSignInAnonymously } from "@convex-dev/auth/methods/anonymous/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "#components/ui/button";

/** Starts a guest session. The page follows the session, so it needs no load. */
export function GuestSignIn() {
  const { signIn } = useSignInAnonymously(api.auth);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const continueAsGuest = () => {
    setError("");
    setIsPending(true);
    void signIn()
      .catch((signInError: unknown) => {
        setError(signInError instanceof Error ? signInError.message : "Could not start session");
      })
      .finally(() => setIsPending(false));
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={continueAsGuest}
        className="h-10"
      >
        {isPending ? "Starting" : "Continue as guest"}
      </Button>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
