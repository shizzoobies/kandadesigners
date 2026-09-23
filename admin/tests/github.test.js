import { describe, it, expect } from 'vitest';
import { fetchOpenWork, reconcileGithub } from '../src/lib/github.js';

function fakeGitHub() {
  const calls = [];
  const routes = {
    '/repos/o/r': { default_branch: 'main' },
    '/repos/o/r/pulls?state=open&per_page=100': [{ number: 7, title: 'Credit link', html_url: 'https://github.com/o/r/pull/7', head: { ref: 'credit' } }],
    '/repos/o/r/branches?per_page=100': [{ name: 'main' }, { name: 'credit' }, { name: 'site-fixes' }, { name: 'feature/old' }],
    '/repos/o/r/compare/main...site-fixes': { ahead_by: 2 },
    '/repos/o/r/compare/main...feature/old': { ahead_by: 0 },
  };
  const fetchImpl = async (url, init) => {
    const path = url.replace('https://api.github.com', '');
    calls.push({ path, auth: init.headers.Authorization, ua: init.headers['User-Agent'] });
    if (!(path in routes)) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify(routes[path]), { status: 200 });
  };
  return { fetchImpl, calls };
}

describe('fetchOpenWork', () => {
  it('lists open pull requests and unmerged branches that have no pull request', async () => {
    const { fetchImpl, calls } = fakeGitHub();
    const items = await fetchOpenWork('o/r', 'tok', fetchImpl);
    expect(items).toEqual([
      { github_key: 'pr:7', text: 'Pull request #7: Credit link', url: 'https://github.com/o/r/pull/7' },
      { github_key: 'branch:site-fixes', text: 'Branch site-fixes: 2 commits not merged', url: 'https://github.com/o/r/tree/site-fixes' },
    ]);
    expect(calls.every((c) => c.auth === 'Bearer tok' && c.ua)).toBe(true);
  });

  it('throws when GitHub refuses', async () => {
    const fetchImpl = async () => new Response('{}', { status: 401 });
    await expect(fetchOpenWork('o/r', 'bad', fetchImpl)).rejects.toThrow('github_401');
  });
});

describe('reconcileGithub', () => {
  it('inserts new, updates changed or reopened, closes missing, leaves the rest', () => {
    const existing = [
      { id: 1, github_key: 'pr:7', text: 'Pull request #7: Credit link', url: 'u7', done_at: null },
      { id: 2, github_key: 'pr:8', text: 'Pull request #8: Old title', url: 'u8', done_at: null },
      { id: 3, github_key: 'branch:x', text: 'Branch x: 1 commit not merged', url: 'ux', done_at: '2026-09-01' },
      { id: 4, github_key: 'branch:gone', text: 'Branch gone', url: 'ug', done_at: null },
      { id: 5, github_key: 'branch:closed', text: 'Branch closed', url: 'uc', done_at: '2026-09-01' },
    ];
    const fetched = [
      { github_key: 'pr:7', text: 'Pull request #7: Credit link', url: 'u7' },
      { github_key: 'pr:8', text: 'Pull request #8: New title', url: 'u8' },
      { github_key: 'branch:x', text: 'Branch x: 1 commit not merged', url: 'ux' },
      { github_key: 'pr:9', text: 'Pull request #9: New', url: 'u9' },
    ];
    expect(reconcileGithub(existing, fetched)).toEqual({
      inserts: [{ github_key: 'pr:9', text: 'Pull request #9: New', url: 'u9' }],
      updates: [{ id: 2, text: 'Pull request #8: New title', url: 'u8' }, { id: 3, text: 'Branch x: 1 commit not merged', url: 'ux' }],
      closes: [4],
    });
  });
});
