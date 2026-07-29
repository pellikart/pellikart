// Supabase Edge Function: create-razorpay-order
//
// Creates a Razorpay order server-side for the 10% booking amount (the KEY
// SECRET never touches the app). When `splits` are supplied, it also attaches
// Razorpay Route TRANSFERS so each vendor's share settles to their linked
// account — held (on_hold) until a milestone releases it. Pellikart keeps the
// platform commission (the part of the order NOT transferred).
//
//   vendor share (paise) = booking amount × (1 − PLATFORM_COMMISSION_PCT/100)
//
// Deploy:
//   supabase functions deploy create-razorpay-order
//   supabase secrets set RAZORPAY_KEY_ID=… RAZORPAY_KEY_SECRET=… \
//     PLATFORM_COMMISSION_PCT=20 SB_URL=… SB_SERVICE_ROLE_KEY=…
//
// Body:    { amount, receipt?, splits?: [{ vendorId, amount }] }  (amounts in ₹)
// Returns: { orderId, keyId, amount, currency }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Split {
  vendorId: string
  amount: number
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) return json({ error: 'Razorpay not configured' }, 500)

    const { amount, receipt, splits } = await req.json()
    const paise = Math.round(Number(amount) * 100)
    if (!Number.isFinite(paise) || paise <= 0) return json({ error: 'Invalid amount' }, 400)

    // Build Route transfers from the splits, if any.
    const transfers = await buildTransfers(splits)

    const auth = btoa(`${keyId}:${keySecret}`)
    const res = await fetch(RAZORPAY_ORDERS_URL, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: paise,
        currency: 'INR',
        receipt: receipt || `booking_${Date.now()}`,
        payment_capture: 1,
        ...(transfers.length > 0 ? { transfers } : {}),
      }),
    })
    const order = await res.json()
    if (!res.ok || !order?.id) return json({ error: 'Order creation failed', detail: order }, 502)

    return json({ orderId: order.id, keyId, amount: paise, currency: 'INR' }, 200)
  } catch (e) {
    console.error('[create-razorpay-order] error:', e)
    return json({ error: String(e) }, 500)
  }
})

async function buildTransfers(splits: Split[] | undefined) {
  if (!Array.isArray(splits) || splits.length === 0) return []
  const url = Deno.env.get('SB_URL')
  const serviceKey = Deno.env.get('SB_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return [] // can't look up accounts → settle all to platform

  const commissionPct = Number(Deno.env.get('PLATFORM_COMMISSION_PCT') ?? '20')
  const admin = createClient(url, serviceKey)

  const vendorIds = [...new Set(splits.map((s) => s.vendorId).filter(Boolean))]
  const { data: accounts } = await admin
    .from('vendor_payout_accounts')
    .select('vendor_id, razorpay_account_id, status')
    .in('vendor_id', vendorIds)
  const accountByVendor = new Map<string, string>()
  for (const a of accounts ?? []) {
    // Only route to accounts that can receive (activated / activation_pending).
    if (a.razorpay_account_id && a.status !== 'needs_action') {
      accountByVendor.set(a.vendor_id, a.razorpay_account_id)
    }
  }

  const transfers = []
  for (const s of splits) {
    const account = accountByVendor.get(s.vendorId)
    if (!account) continue // no linked account → that share stays with the platform
    const vendorSharePaise = Math.round(Number(s.amount) * 100 * (1 - commissionPct / 100))
    if (vendorSharePaise <= 0) continue
    transfers.push({
      account,
      amount: vendorSharePaise,
      currency: 'INR',
      // Held until a milestone releases it (release-vendor-transfer).
      on_hold: 1,
      notes: { vendor_id: s.vendorId },
    })
  }
  return transfers
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}
