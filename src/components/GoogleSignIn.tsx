import { useOauth, useOauthSignIn } from "@convex-dev/auth/methods/oauth/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "#components/ui/button";

/**
 * Starts Google sign-in through the identity hub. The hub sends the browser back to this page, which
 * the server renders without a session, and the provider finishes the sign-in there. A gated page
 * cannot be the way back: its server redirect drops the code.
 */
export function GoogleSignIn() {
  const { signIn } = useOauthSignIn({
    providerName: "hub",
    startSignIn: api.auth.startSignInWithHub,
    completeSignIn: api.auth.completeSignInWithHub,
  });
  const { flowError } = useOauth();
  const [isPending, setIsPending] = useState(false);
  const [startFailed, setStartFailed] = useState(false);

  const continueWithGoogle = () => {
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
      {/* The light theme of Google's branding guidelines, which its verification of an app checks. */}
      <Button
        type="button"
        disabled={isPending}
        onClick={continueWithGoogle}
        className="h-10 gap-2.5 border-[#747775] bg-white px-3 font-['Google_Sans',sans-serif] text-[#1f1f1f] hover:bg-[#f2f2f2]"
      >
        <GoogleLogo />
        Sign in with Google
      </Button>
      {flowError || startFailed ? (
        <p className="text-destructive text-sm" role="alert">
          Could not sign in with Google
        </p>
      ) : null}
    </>
  );
}

/** Google's standard G, from the sample buttons of its branding guidelines. */
function GoogleLogo() {
  return (
    <svg viewBox="10 10 20 20" aria-hidden="true" className="size-5">
      <path
        fill="#4285F4"
        d="M29.6 20.2273C29.6 19.5182 29.5364 18.8364 29.4182 18.1818H20V22.05H25.3818C25.15 23.3 24.4455 24.3591 23.3864 25.0682V27.5773H26.6182C28.5091 25.8364 29.6 23.2727 29.6 20.2273Z"
      />
      <path
        fill="#34A853"
        d="M20 30C22.7 30 24.9636 29.1045 26.6181 27.5773L23.3863 25.0682C22.4909 25.6682 21.3454 26.0227 20 26.0227C17.3954 26.0227 15.1909 24.2636 14.4045 21.9H11.0636V24.4909C12.7091 27.7591 16.0909 30 20 30Z"
      />
      <path
        fill="#FBBC04"
        d="M14.4045 21.9C14.2045 21.3 14.0909 20.6591 14.0909 20C14.0909 19.3409 14.2045 18.7 14.4045 18.1V15.5091H11.0636C10.3864 16.8591 10 18.3864 10 20C10 21.6136 10.3864 23.1409 11.0636 24.4909L14.4045 21.9Z"
      />
      <path
        fill="#E94235"
        d="M20 13.9773C21.4681 13.9773 22.7863 14.4818 23.8227 15.4727L26.6909 12.6045C24.9591 10.9909 22.6954 10 20 10C16.0909 10 12.7091 12.2409 11.0636 15.5091L14.4045 18.1C15.1909 15.7364 17.3954 13.9773 20 13.9773Z"
      />
    </svg>
  );
}
