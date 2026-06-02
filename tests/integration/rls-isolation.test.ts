import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

// Node < 22 has no native WebSocket, so supabase-js's RealtimeClient (built inside
// createClient) throws on construction. We never use realtime here, but the client
// still initialises it — supply `ws` as the transport to keep construction happy.
const realtime = { transport: ws as unknown as typeof WebSocket };

/**
 * RLS TENANT-ISOLATION SUITE (§20.2 — "non-negotiable").
 *
 * Proves the database itself refuses cross-tenant reads: a user of School A,
 * querying through the anon key + their own JWT,
 * can never see School B's rows — even with a query that omits the filter on
 * school_id (exactly as the browser does). This is the backstop the whole
 * multi-tenant model rests on.
 *
 * Not part of `npm test` (the unit `include` excludes tests/integration). Run it
 * against a REAL Postgres with the schema applied (Supabase local preferred):
 *
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   RLS_TEST=1 npx vitest run tests/integration/rls-isolation.test.ts
 *
 * It provisions two ephemeral schools + admins, asserts isolation, then deletes
 * them. NEVER point it at production.
 */

const URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const enabled = process.env.RLS_TEST === "1" && Boolean(URL && ANON && SRK);

interface Tenant {
  schoolId: string;
  email: string;
  studentId: string;
  client: SupabaseClient;
}

async function provisionTenant(admin: SupabaseClient, tag: string): Promise<Tenant> {
  const stamp = `${Date.now().toString(36)}-${tag}`;
  const { data: school } = await admin
    .from("schools")
    .insert({ name: `RLS ${stamp}`, slug: `rls-${stamp}`, status: "active" })
    .select("id")
    .single();
  const schoolId = school!.id as string;
  await admin.from("school_settings").insert({ school_id: schoolId });

  const email = `rls.${stamp}@demo.test`;
  const password = "RlsTest#12345";
  const { data: created } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { school_id: schoolId, roles: ["school_admin"] },
    user_metadata: { full_name: "RLS Admin", school_id: schoolId },
  });
  await admin.from("users").upsert({ id: created!.user!.id, school_id: schoolId, email, full_name: "RLS Admin" });

  const { data: student } = await admin
    .from("students")
    .insert({ school_id: schoolId, admission_no: "001", first_name: "Test", last_name: tag, status: "active" })
    .select("id")
    .single();

  // A client carrying THIS user's JWT — the same surface the browser uses (anon key + user JWT).
  const client = createClient(URL!, ANON!, { realtime });
  await client.auth.signInWithPassword({ email, password });
  return { schoolId, email, studentId: student!.id as string, client };
}

describe.skipIf(!enabled)("RLS tenant isolation", () => {
  // Constructed in beforeAll, NOT at collection time: the describe body runs even
  // when the suite is skipped, and createClient throws on the missing env vars
  // ("supabaseUrl is required") when RLS_TEST isn't set. Deferring keeps the file
  // safe to run anywhere, as its docstring promises.
  let admin: SupabaseClient;
  let a: Tenant;
  let b: Tenant;

  beforeAll(async () => {
    admin = createClient(URL!, SRK!, { auth: { persistSession: false }, realtime });
    a = await provisionTenant(admin, "A");
    b = await provisionTenant(admin, "B");
  }, 30_000);

  afterAll(async () => {
    for (const t of [a, b]) {
      if (!t) continue;
      await admin.from("schools").delete().eq("id", t.schoolId);
      const { data } = await admin.auth.admin.listUsers();
      const u = data?.users.find((x) => x.email === t.email);
      if (u) await admin.auth.admin.deleteUser(u.id);
    }
  }, 30_000);

  it("a user sees only their own school's students", async () => {
    const { data } = await a.client.from("students").select("id, school_id");
    expect(data?.length).toBe(1);
    expect(data?.every((r) => r.school_id === a.schoolId)).toBe(true);
  });

  it("cannot read another school's student even by explicit id", async () => {
    const { data } = await a.client.from("students").select("id").eq("id", b.studentId);
    expect(data ?? []).toHaveLength(0);
  });

  it("cannot write into another tenant (WITH CHECK blocks it)", async () => {
    const { error } = await a.client
      .from("students")
      .insert({ school_id: b.schoolId, admission_no: "x", first_name: "Mal", last_name: "Icious", status: "active" });
    expect(error).not.toBeNull(); // RLS WITH CHECK rejects cross-tenant insert
  });

  // The enforce_student_quota trigger is the authoritative backstop for the
  // per-student cap — independent of the app's pre-insert check. Tenant A already
  // has exactly 1 active student from provisioning.
  it("the DB trigger blocks inserts beyond students_paid_for", async () => {
    // Cap the school at 1 paid slot — it already has 1 student, so it's full.
    await admin.from("subscriptions").upsert(
      { school_id: a.schoolId, plan: "term", status: "active", students_paid_for: 1 },
      { onConflict: "school_id" },
    );
    const blocked = await admin
      .from("students")
      .insert({ school_id: a.schoolId, admission_no: "Q-2", first_name: "Over", last_name: "Quota", status: "active" });
    expect(blocked.error).not.toBeNull();
    expect(blocked.error?.message ?? "").toContain("STUDENT_QUOTA_EXCEEDED");

    // Raising the cap lets the next insert through — proving it's a real cap, not a hard block.
    await admin.from("subscriptions").upsert(
      { school_id: a.schoolId, plan: "term", status: "active", students_paid_for: 2 },
      { onConflict: "school_id" },
    );
    const allowed = await admin
      .from("students")
      .insert({ school_id: a.schoolId, admission_no: "Q-2", first_name: "Under", last_name: "Quota", status: "active" })
      .select("id")
      .single();
    expect(allowed.error).toBeNull();
    // Restore A to a single student so this test leaves no residue.
    if (allowed.data?.id) await admin.from("students").delete().eq("id", allowed.data.id as string);
  });
});
