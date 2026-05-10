export async function register() {
  // Node 25 ships a built-in `localStorage` global that is non-functional
  // unless the process is started with `--localstorage-file=<path>`. Supabase's
  // auth client detects `globalThis.localStorage` and calls `.getItem()` on it,
  // which throws "localStorage.getItem is not a function" during SSR. We never
  // want Supabase to use Node's localStorage on the server — `@supabase/ssr`
  // already configures cookie-based storage — so we strip the global on the
  // Node runtime to force the fallback path.
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    typeof globalThis.localStorage !== 'undefined'
  ) {
    // @ts-expect-error - intentionally removing the Node 25 built-in
    delete globalThis.localStorage
  }
}
