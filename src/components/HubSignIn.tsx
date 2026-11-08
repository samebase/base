import { useOauth, useOauthSignIn } from "@convex-dev/auth/methods/oauth/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "#components/ui/button";

/**
 * Starts sign-in through the identity hub. The button names no provider: its first stop is the hub's
 * page, which names this app and offers Google and GitHub. The hub sends the browser back to this
 * page, which the server renders without a session, and the provider finishes the sign-in there. A
 * gated page cannot be the way back: its server redirect drops the code.
 */
export function HubSignIn() {
  const { signIn } = useOauthSignIn({
    providerName: "hub",
    startSignIn: api.auth.startSignInWithIdentityHub,
    completeSignIn: api.auth.completeSignInWithIdentityHub,
  });
  const { flowError } = useOauth();
  const [isPending, setIsPending] = useState(false);
  const [startFailed, setStartFailed] = useState(false);

  const startSignIn = () => {
    setStartFailed(false);
    setIsPending(true);
    void signIn().then((result) => {
      // After a good start the browser is leaving the page.
      if (result.status === "error") {
        setStartFailed(true);
        setIsPending(false);
      }
    });
  };

  return (
    <>
      <Button type="button" disabled={isPending} onClick={startSignIn}>
        Sign in
      </Button>
      {flowError || startFailed ? (
        <p className="text-destructive text-sm" role="alert">
          Could not sign in
        </p>
      ) : null}
    </>
  );
}
