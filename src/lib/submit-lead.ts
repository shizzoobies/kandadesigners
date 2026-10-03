// Retrying the same payload reuses the provider idempotency key, including after a timeout.
const attempts = new Map<string, string>();

export function submitLead(formType: string, data: Record<string, string>) {
  const payload = { ...data, form_type: formType };
  const fingerprint = JSON.stringify(payload);
  let requestId = attempts.get(fingerprint);
  if (!requestId) {
    requestId = crypto.randomUUID();
    if (attempts.size >= 10) attempts.delete(attempts.keys().next().value!);
    attempts.set(fingerprint, requestId);
  }
  return fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...payload, request_id: requestId }),
  });
}
