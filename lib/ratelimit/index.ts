/**
 * Sliding-window rate limiter (§9.3). Edge-compatible. In-memory by default —
 * fine for a single instance; for serverless/multi-instance set
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to share state across nodes.
 * No code change needed to switch.
 */
export interface LimitResult {
  ok: boolean;
  remaining: number;
  retryAfter: number; // seconds
}
export interface LimitOptions {
  max: number;
  windowMs: number;
}

const buckets = new Map<string, number[]>(); // key → request timestamps (ms)

function memoryLimit(key: string, { max, windowMs }: LimitOptions): LimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= max) {
    buckets.set(key, hits);
    const retryAfter = Math.max(1, Math.ceil((hits[0]! + windowMs - now) / 1000));
    return { ok: false, remaining: 0, retryAfter };
  }
  hits.push(now);
  buckets.set(key, hits);

  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => t <= cutoff)) buckets.delete(k);
  }
  return { ok: true, remaining: max - hits.length, retryAfter: 0 };
}

async function upstashLimit(key: string, { max, windowMs }: LimitOptions): Promise<LimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const windowSec = Math.ceil(windowMs / 1000);
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
      ]),
    });
    const data = (await res.json()) as Array<{ result?: number }>;
    const count = Number(data?.[0]?.result ?? 0);
    if (count > max) return { ok: false, remaining: 0, retryAfter: windowSec };
    return { ok: true, remaining: Math.max(0, max - count), retryAfter: 0 };
  } catch {
    return { ok: true, remaining: max, retryAfter: 0 }; // fail-open on limiter error
  }
}

let warnedMemoryInProd = false;

export async function rateLimit(key: string, opts: LimitOptions): Promise<LimitResult> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return upstashLimit(key, opts);
  }
  // The in-memory limiter only holds within one instance. On serverless or any
  // multi-replica deployment that silently weakens brute-force + abuse limits —
  // warn loudly once so it can't be missed in prod. Set UPSTASH_* to fix.
  const multiInstance =
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV;
  if (!warnedMemoryInProd && (multiInstance || process.env.NODE_ENV === "production")) {
    warnedMemoryInProd = true;
    console.warn(
      JSON.stringify({
        level: "warn",
        message: "rate-limit: using in-memory limiter in a multi-instance/production context; set UPSTASH_REDIS_REST_URL/TOKEN for global limits",
        ts: new Date().toISOString(),
      }),
    );
  }
  return memoryLimit(key, opts);
}
