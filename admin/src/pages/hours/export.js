import { csv } from '../../lib/time.js';
export async function GET({locals}) {
  if (locals.user?.role !== 'owner') return new Response('Not authorized.',{status:403});
  const {results} = await locals.runtime.env.DB.prepare(`SELECT t.*,p.name AS site_name FROM time_entries t LEFT JOIN sites p ON p.id=t.site_id
    WHERE t.user_id=? AND t.status='approved' ORDER BY t.started_at`).bind(locals.user.id).all();
  return new Response('\uFEFF'+csv(results ?? []),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="aec-approved-hours.csv"','Cache-Control':'no-store'}});
}
