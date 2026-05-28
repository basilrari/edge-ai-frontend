/** Read at request time on the server (no rebuild needed after editing `.env`). */
export function getMaptilerApiKey(): string | undefined {
  const raw =
    process.env.MAPTILER_API_KEY ??
    process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  const key = raw?.trim();
  return key || undefined;
}
