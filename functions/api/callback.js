async function exchangeCodeForToken(code, env) {
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET env vars");
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "kandadesigners-cms"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  });

  const data = await res.json();
  if (!data.access_token) {
    const msg = data.error_description || data.error || "No access_token returned";
    throw new Error(msg);
  }
  return data.access_token;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  try {
    const token = await exchangeCodeForToken(code, env);

    // Decap CMS expects the callback page to pass the token back to the opener window.
    // This script is compatible with Decap's GitHub backend.
    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body>
<script>
  (function() {
    var token = ${json.dumps(token)};
    var message = 'authorization:github:success:' + JSON.stringify({ token: token, provider: 'github' });
    if (window.opener) {
      window.opener.postMessage(message, '*');
      window.close();
    } else {
      // fallback
      document.body.innerText = 'Login complete. You can close this window.';
    }
  })();
</script>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (err) {
    return new Response(`OAuth error: ${err?.message || err}`, { status: 500 });
  }
}
