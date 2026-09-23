// Open work from GitHub: open pull requests, plus branches ahead of the default
// branch that have no pull request (a branch with a PR would be listed twice).
// Read-only; the token needs Metadata, Contents and Pull requests read access.
// reconcileGithub is pure so the checker's writes are decided in one testable place.

const API = 'https://api.github.com';

// Branch names can contain "/", which GitHub expects unencoded in compare paths.
const encodeRef = (ref) => ref.split('/').map(encodeURIComponent).join('/');

async function gh(path, token, fetchImpl) {
  const res = await fetchImpl(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ka-sites-checker',
    },
  });
  if (!res.ok) throw new Error(`github_${res.status}`);
  return res.json();
}

export async function fetchOpenWork(repo, token, fetchImpl = fetch) {
  const [info, pulls, branches] = await Promise.all([
    gh(`/repos/${repo}`, token, fetchImpl),
    gh(`/repos/${repo}/pulls?state=open&per_page=100`, token, fetchImpl),
    gh(`/repos/${repo}/branches?per_page=100`, token, fetchImpl),
  ]);

  const items = pulls.map((p) => ({
    github_key: `pr:${p.number}`,
    text: `Pull request #${p.number}: ${p.title}`,
    url: p.html_url,
  }));

  const prHeads = new Set(pulls.map((p) => p.head?.ref));
  for (const branch of branches) {
    if (branch.name === info.default_branch || prHeads.has(branch.name)) continue;
    const cmp = await gh(`/repos/${repo}/compare/${encodeRef(info.default_branch)}...${encodeRef(branch.name)}`, token, fetchImpl);
    if (cmp.ahead_by > 0) {
      items.push({
        github_key: `branch:${branch.name}`,
        text: `Branch ${branch.name}: ${cmp.ahead_by} ${cmp.ahead_by === 1 ? 'commit' : 'commits'} not merged`,
        url: `https://github.com/${repo}/tree/${encodeRef(branch.name)}`,
      });
    }
  }
  return items;
}

export function reconcileGithub(existing, fetched) {
  const byKey = new Map(existing.map((e) => [e.github_key, e]));
  const seen = new Set();
  const inserts = [];
  const updates = [];
  for (const f of fetched) {
    seen.add(f.github_key);
    const e = byKey.get(f.github_key);
    if (!e) inserts.push(f);
    else if (e.done_at || e.text !== f.text || e.url !== f.url) updates.push({ id: e.id, text: f.text, url: f.url });
  }
  const closes = existing.filter((e) => !e.done_at && !seen.has(e.github_key)).map((e) => e.id);
  return { inserts, updates, closes };
}
