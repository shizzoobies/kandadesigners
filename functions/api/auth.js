export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response("Missing GITHUB_CLIENT_ID env var", { status: 500 });
  }

  // Redirect back to /api/callback on the same origin
  const redirectUri = `${url.origin}/api/callback`;

  // Optional: allow limiting org, etc. Not required.
  const scope = "repo,user:email";

  const state = crypto.randomUUID();

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);

  return Response.redirect(authUrl.toString(), 302);
}
