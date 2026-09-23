// Uploaded logos live in R2 under a content-hashed key, so replacing a logo
// never serves a stale cached copy under the old name.

export async function storeLogo(bucket, slug, file, ext) {
  const bytes = await file.arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const hash = [...digest.slice(0, 4)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const key = `logos/${slug}-${hash}.${ext}`;
  await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } });
  return key;
}
