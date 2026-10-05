// A fetch double. handler(url, n) returns { status?, body, headers? }; a body
// that is not a string is sent as JSON. Every call is kept in fn.calls.
export function fakeFetch(handler) {
  const calls = [];
  const fn = async (input, init = {}) => {
    const url = new URL(String(input));
    calls.push({ url, init });
    const r = (await handler(url, calls.length)) ?? {};
    const body = typeof r.body === 'string' ? r.body : JSON.stringify(r.body ?? {});
    return new Response(body, { status: r.status ?? 200, headers: r.headers ?? {} });
  };
  fn.calls = calls;
  return fn;
}
