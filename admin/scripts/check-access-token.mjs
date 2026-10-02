// Checks the token meant for ACCESS_GROUPS_TOKEN without storing or printing it.
//   node scripts/check-access-token.mjs --clipboard   (reads the copied token; most reliable)
//   node scripts/check-access-token.mjs               (paste at a hidden prompt)
// Prints only yes/no facts and Cloudflare's own error codes: never the token.
import readline from 'node:readline';
import { execFileSync } from 'node:child_process';

const ACCOUNT = 'c8f0f7697e2801ba2acabb700b5da793';

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

// Pasting into a hidden prompt does not work in every terminal, so the clipboard is the default way.
const raw = process.argv.includes('--clipboard')
  ? execFileSync('powershell', ['-NoProfile', '-Command', 'Get-Clipboard -Raw'], { encoding: 'utf8' })
  : await askHidden('Paste the token and press Enter (nothing will show): ');
const token = raw.trim();
console.log(`Length ${token.length} characters.`);
console.log(`Had spaces or line breaks around it: ${raw !== token ? 'yes' : 'no'}.`);
console.log(`Has spaces or odd characters inside: ${/[^A-Za-z0-9_-]/.test(token) ? 'yes (this would break it)' : 'no'}.`);

const H = { Authorization: `Bearer ${token}` };
const show = (j) => (j?.errors ?? []).map((e) => `${e.code} ${e.message}`).join('; ') || 'none';

const v = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers: H });
const vj = await v.json().catch(() => null);
console.log(`Token valid: ${vj?.success ? `yes (${vj.result?.status})` : `no (HTTP ${v.status}, errors: ${show(vj)})`}`);

const g = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/access/groups`, { headers: H });
const gj = await g.json().catch(() => null);
console.log(`Can read Access groups: ${gj?.success ? `yes (${(gj.result || []).length} groups: ${(gj.result || []).map((x) => x.name).join(', ') || 'none'})` : `no (HTTP ${g.status}, errors: ${show(gj)})`}`);
