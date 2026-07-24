/* =============================================
   K & A PERFORMANCE | Google Reviews API
   Cloudflare Pages Function: /api/reviews
   Pulls live reviews via the Places API (New) and caches for 6 hours.

   Required Cloudflare env:
   - GOOGLE_MAPS_API_KEY  (secret; Places API (New) enabled)
   - GOOGLE_PLACE_ID      (plain var; the Business Profile place id)

   Notes: Google's Places API returns at most 5 reviews per place. The
   response includes the Maps URL so the UI can link to the full set.
   ============================================= */

const CACHE_SECONDS = 21600; // 6 hours

export async function onRequestGet(context) {
  const { request, env } = context;

  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, s-maxage=${CACHE_SECONDS}`,
      },
    });

  // ?debug=1 reports which stage fails without exposing any secret values.
  const debug = new URL(request.url).searchParams.get('debug') === '1';

  if (!env.GOOGLE_MAPS_API_KEY || !env.GOOGLE_PLACE_ID) {
    return json(
      debug
        ? { reviews: [], stage: 'missing-env', hasKey: Boolean(env.GOOGLE_MAPS_API_KEY), hasPlaceId: Boolean(env.GOOGLE_PLACE_ID) }
        : { reviews: [] },
    );
  }

  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).origin + '/api/reviews');
  if (!debug) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${env.GOOGLE_PLACE_ID}`,
      {
        headers: {
          'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews',
        },
      },
    );
    if (!res.ok) {
      if (debug) {
        const errBody = (await res.text()).slice(0, 400);
        return json({ reviews: [], stage: 'upstream-error', upstreamStatus: res.status, upstreamBody: errBody });
      }
      return json({ reviews: [] });
    }

    const data = await res.json();
    const out = json({
      rating: data.rating ?? null,
      count: data.userRatingCount ?? 0,
      url: data.googleMapsUri ?? null,
      reviews: (data.reviews || [])
        .filter((r) => r.text?.text)
        .map((r) => ({
          name: r.authorAttribution?.displayName || 'Google user',
          photo: r.authorAttribution?.photoUri || null,
          rating: r.rating ?? 5,
          when: r.relativePublishTimeDescription || '',
          text: r.text.text,
        })),
    });
    await cache.put(cacheKey, out.clone());
    return out;
  } catch {
    return json({ reviews: [] });
  }
}
