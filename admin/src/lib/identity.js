// Decides where an identity may come from. Deliberately the only file that
// knows about the dev bypass, so that policy has exactly one home and one set
// of tests. Everything here fails closed: the function returns null rather than
// throwing, and the caller treats null as 403.

import { verifyAccessJwt } from './access.js';

function readToken(request) {
  const header = request.headers.get('Cf-Access-Jwt-Assertion');
  if (header) return header;

  // Browsers also carry the token as a cookie. Match the name exactly rather
  // than by substring, so NOT_CF_Authorization cannot impersonate it.
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  for (const part of cookie.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === 'CF_Authorization') {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

export async function resolveEmail({ request, env, verify = verifyAccessJwt }) {
  const token = readToken(request);

  if (token) {
    try {
      const { email } = await verify(token, {
        teamDomain: env.ACCESS_TEAM_DOMAIN,
        aud: env.ACCESS_AUD,
      });
      return { email, source: 'access' };
    } catch {
      // A present-but-invalid token is never allowed to fall through to the dev
      // bypass. Failing closed here is the point of this whole module.
      return null;
    }
  }

  // Exact string match, and DEV_EMAIL must also be set. Anything else is
  // production, where the only way in is a valid Access token.
  if (env.ENVIRONMENT === 'development' && env.DEV_EMAIL) {
    return { email: String(env.DEV_EMAIL).toLowerCase(), source: 'dev' };
  }

  return null;
}
