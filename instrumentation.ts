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
