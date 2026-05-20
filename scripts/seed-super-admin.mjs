// Seed (or update) a platform Super Admin via the Supabase Auth Admin + REST
// endpoints (raw fetch — no SDK, so it runs on Node 20 without a WebSocket).
//
//   node --env-file=.env.local scripts/seed-super-admin.mjs
//   npm run seed:superadmin
//
// Idempotent: if the email already exists, it resets the password + claims
// rather than failing. The essential bit is app_metadata — the JWT claim RLS
// and the app's authz read (school_id: null + roles: ['super_admin']).
//
// Override defaults with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@resultprime.xyz";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || "DefaultPass#123";

if (!url || !serviceKey) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("  Run with:  node --env-file=.env.local scripts/seed-super-admin.mjs");
  process.exit(1);
}

const authHeaders = {
  "Content-Type": "application/json",
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
};
const appMetadata = { school_id: null, roles: ["super_admin"] };

async function findUserByEmail(email) {
  const res = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`, { headers: authHeaders });
  if (!res.ok) throw new Error(`list users failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  const users = Array.isArray(body) ? body : (body.users ?? []);
  return users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function main() {
  console.log(`→ Target project: ${url}`);
  let userId;

  const createRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: { full_name: "Super Admin" },
    }),
  });

  if (createRes.ok) {
    const user = await createRes.json();
    userId = user.id;
    console.log(`✓ Created super admin: ${EMAIL}`);
  } else {
    const errText = await createRes.text();
    console.log(`• Create returned ${createRes.status} — updating existing user…`);
    const existing = await findUserByEmail(EMAIL);
    if (!existing) {
      console.error(`✗ Could not create or locate ${EMAIL}. Last error: ${errText}`);
      process.exit(1);
    }
    userId = existing.id;
    const updRes = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ password: PASSWORD, email_confirm: true, app_metadata: appMetadata }),
    });
    if (!updRes.ok) {
      console.error(`✗ Update failed: ${updRes.status} ${await updRes.text()}`);
      process.exit(1);
    }
    console.log(`✓ Updated existing user to super admin: ${EMAIL}`);
  }

  // Best-effort: record the role in user_roles (no-op if the schema isn't applied).
  try {
    const restHeaders = { ...authHeaders };
    const roleRes = await fetch(
      `${url}/rest/v1/roles?select=id&school_id=is.null&key=eq.super_admin`,
      { headers: restHeaders },
    );
    const roles = roleRes.ok ? await roleRes.json() : [];
    if (roles.length > 0) {
      const upsertRes = await fetch(`${url}/rest/v1/user_roles`, {
        method: "POST",
        headers: { ...restHeaders, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ user_id: userId, role_id: roles[0].id, school_id: null }),
      });
      if (upsertRes.ok) console.log("✓ Linked super_admin role in user_roles.");
      else console.log(`• Skipped user_roles link: ${upsertRes.status} ${await upsertRes.text()}`);
    } else {
      console.log("• No 'super_admin' role row found — skipping user_roles (claims still set).");
    }
  } catch (e) {
    console.log(`• Skipped user_roles link (schema not applied?): ${e.message}`);
  }

  console.log(`\n✅ Done. User id: ${userId}`);
  console.log(`   Sign in at /login with ${EMAIL}`);
  console.log("   ⚠ Change this password after first login.");
}

main().catch((e) => {
  console.error("✗ Unexpected error:", e.message);
  process.exit(1);
});
