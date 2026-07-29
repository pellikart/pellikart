// Supabase Edge Function: verify-razorpay-payment
//
// Verifies a completed Razorpay payment (Razorpay signs `order_id|payment_id`
// with the KEY SECRET; a genuine payment's signature matches). Only after this
// returns { verified: true } does the app record the booking.
//
// It also records the Route transfers created for this payment into
// vendor_payouts (as 'held'), so release-vendor-transfer can later release each
// vendor's share when a milestone completes.
//
// Deploy:
//   supabase functions deploy verify-razorpay-payment
//   (uses RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET + SB_URL / SB_SERVICE_ROLE_KEY)
//
// Body:    { orderId, paymentId, signature }
// Returns: { verified: boolean }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RZP = 'https://api.razorpay.com/v1'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keySecret) return json({ error: 'Razorpay not configured' }, 500)

    const { orderId, paymentId, signature } = await req.json()
    if (!orderId || !paymentId || !signature) return json({ verified: false, error: 'Missing fields' }, 400)

    const expected = await hmacSha256Hex(keySecret, `${orderId}|${paymentId}`)
    const verified = expected === String(signature).toLowerCase()
    if (!verified) return json({ verified: false }, 400)

    // Record any Route transfers for this payment (best-effort; never blocks the
    // verification result — a booking that isn't split still succeeds).
    if (keyId) recordPayouts(keyId, keySecret, orderId, paymentId).catch((e) => console.warn('[verify] payout record skipped:', e))

    return json({ verified: true }, 200)
  } catch (e) {
    console.error('[verify-razorpay-payment] error:', e)
    return json({ verified: false, error: String(e) }, 500)
  }
})

async function recordPayouts(keyId: string, keySecret: string, orderId: string, paymentId: string) {
  const url = Deno.env.get('SB_URL')
  const serviceKey = Deno.env.get('SB_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return

  const auth = 'Basic ' + btoa(`${keyId}:${keySecret}`)
  const res = await fetch(`${RZP}/payments/${paymentId}/transfers`, { headers: { Authorization: auth } })
  const data = await res.json()
  const items: Array<{ id: string; recipient: string; amount: number; on_hold: boolean }> = data?.items ?? []
  if (items.length === 0) return

  const admin = createClient(url, serviceKey)
  const recipients = [...new Set(items.map((t) => t.recipient))]
  const { data: accounts } = await admin
    .from('vendor_payout_accounts')
    .select('vendor_id, razorpay_account_id')
    .in('razorpay_account_id', recipients)
  const vendorByAccount = new Map((accounts ?? []).map((a) => [a.razorpay_account_id, a.vendor_id]))

  const rows = items
    .map((t) => ({
      vendor_id: vendorByAccount.get(t.recipient),
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_transfer_id: t.id,
      amount: t.amount,
      status: t.on_hold ? 'held' : 'released',
    }))
    .filter((r) => r.vendor_id)

  if (rows.length > 0) {
    await admin.from('vendor_payouts').upsert(rows, { onConflict: 'razorpay_transfer_id' })
  }
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}
