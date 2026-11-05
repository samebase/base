/**
 * The answer at /samebase-verification.json: `{ "repository": "<id>" }`, the numeric GitHub id of
 * the repository, else 404. Samebase's identity hub reads it on an https site before it registers a
 * client on that site (RFC 129 and 133): the id proves that the site belongs to the repository that
 * asks. The deploy sets SAMEBASE_REPOSITORY_ID from GITHUB_REPOSITORY_ID, and `pnpm run dev` sets it
 * on a development deployment with an https site. A laptop with a loopback address needs no file:
 * the token is its proof. No answer may be cached: the hub must see the current value.
 */
export function samebaseVerification(repository: string | undefined) {
  if (!repository) {
    return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  }
  return new Response(JSON.stringify({ repository }), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
