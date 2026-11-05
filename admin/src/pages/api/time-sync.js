import { importTime, TimeError } from '../../lib/time.js';
import { readLimited } from '../../lib/time-sync.js';

export async function POST({request,locals}) {
  if (!locals.timeSyncUser) return new Response('Not authorized.',{status:403});
  try {
    if (request.headers.get('content-type') !== 'application/json') throw new TimeError('Expected application/json.',415);
    const rows = JSON.parse(await readLimited(request));
    const inserted = await importTime(locals.runtime.env.DB,locals.timeSyncUser,rows);
    return Response.json({ok:true,inserted},{headers:{'Cache-Control':'no-store'}});
  } catch (e) {
    if (e instanceof TimeError || e instanceof SyntaxError) return Response.json({error:e instanceof SyntaxError ? 'Invalid JSON.' : e.message},{status:e.status ?? 400});
    console.error('time.sync.failed');
    return Response.json({error:'Could not save activity. Retry later.'},{status:503});
  }
}
