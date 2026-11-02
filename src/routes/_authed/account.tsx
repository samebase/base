import { convexQuery } from "@convex-dev/react-query";
import { useSignOutSession } from "@samebase/convex-auth-tanstack-start";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Button } from "#components/ui/button";

export const Route = createFileRoute("/_authed/account")({
  // On the server, the query runs with the token of the session cookie.
  loader: async ({ context }) => {
    // @ts-expect-error convexQuery always sets queryFn, but its type allows undefined there, which `query` rejects under exactOptionalPropertyTypes.
    await context.queryClient.query(convexQuery(api.guests.viewer, {}));
  },
  component: AccountPage,
});

function AccountPage() {
  const { data: viewer } = useSuspenseQuery(convexQuery(api.guests.viewer, {}));
  const signOut = useSignOutSession("/auth/signout", "/");
  const deleteAccount = useMutation(api.account.deleteAccount);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  const onSignOut = async () => {
    setSignOutFailed(false);
    setIsSigningOut(true);
    // A successful sign-out reloads the page, so only a failure comes back here.
    if (!(await signOut())) {
      setSignOutFailed(true);
      setIsSigningOut(false);
    }
  };

  const onDelete = async () => {
    setDeleteFailed(false);
    setIsDeleting(true);
    try {
      await deleteAccount({});
    } catch {
      setDeleteFailed(true);
      setIsDeleting(false);
      return;
    }
    // The session is gone. Signing out clears its cookie and reloads the page.
    if (!(await signOut())) {
      window.location.assign("/");
    }
  };

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-3 p-4">
      <h1 className="text-lg">Account</h1>
      {viewer ? <p>Signed in as {viewer.name}</p> : null}
      <Button type="button" variant="outline" disabled={isSigningOut} onClick={onSignOut}>
        {isSigningOut ? "Signing out" : "Sign out"}
      </Button>
      {signOutFailed ? (
        <p className="text-destructive text-sm" role="alert">
          Sign-out failed. Try again.
        </p>
      ) : null}
      {isConfirmingDelete ? (
        <>
          <p>This deletes your account and your to-dos. You cannot undo it.</p>
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={onDelete}>
            {isDeleting ? "Deleting account" : "Delete my account"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => setIsConfirmingDelete(false)}
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button type="button" variant="destructive" onClick={() => setIsConfirmingDelete(true)}>
          Delete account
        </Button>
      )}
      {deleteFailed ? (
        <p className="text-destructive text-sm" role="alert">
          Could not delete your account. Try again.
        </p>
      ) : null}
    </main>
  );
}
