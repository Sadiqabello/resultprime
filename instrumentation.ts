/**
 * Next.js startup hook. The Supabase JS client eagerly constructs a Realtime
 * client that needs a global `WebSocket`, which Node < 22 lacks — so any
 * server-side Supabase call (login, server actions, the service-role client)
 * would throw at runtime on Node 20. The edge runtime already provides a global
 * WebSocket, so we only polyfill for the Node server.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && !globalThis.WebSocket) {
    const { WebSocket } = await import("ws");
    (globalThis as unknown as { WebSocket: unknown }).WebSocket = WebSocket;
  }
}

/**
 * Server-side error sink (Next 15). Fires for uncaught errors in Server
 * Components, Route Handlers, and Server Actions — the catch-all our typed
 * `Result` flow doesn't cover. Routes everything through one swappable sink
 * (lib/logger#captureException) so an error tracker can be wired in one place.
 */
export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string; renderSource?: string },
) {
  const { captureException } = await import("@/lib/logger");
  captureException(error, {
    action: "request_error",
    path: request?.path,
    method: request?.method,
    routerKind: context?.routerKind,
    routePath: context?.routePath,
    renderSource: context?.renderSource,
  });
}
