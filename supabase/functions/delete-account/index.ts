// Supabase Edge Function: delete-account
//
// Permanently deletes the calling user's account. Apple REQUIRES apps that
// support account creation to offer in-app account deletion (not just a link),
// so this is a hard store-review gate.
//
// Deleting the auth.users row cascades through the schema: profiles →
// couples / vendors → listings / availability / bookings / milestones /
// notifications / reviews / earnings / push_tokens / vendor_payout_accounts /
// vendor_payouts (all `on delete cascade`). Deleting the auth user needs admin
// rights, which the client's anon key can't do — hence this service-role
// function.
//
// Not auto-removed (documented for the operator):
//   • Storage objects (vendor photos) — not FK-linked; purge on a schedule if
//     needed.
//   • Razorpay linked accounts — managed on Razorpay; deactivate there.
//
// Deploy:
//   supabase functions deploy delete-account
//   (uses SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Identify the caller from their JWT — a user can only delete themselves.
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    const userId = userData?.user?.id
    if (userErr || !userId) return json({ error: 'Not authenticated' }, 401)

    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return json({ error: error.message }, 500)

    return json({ deleted: true }, 200)
  } catch (e) {
    console.error('[delete-account] error:', e)
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}
