// Supabase Edge Function: create-razorpay-order
//
// Creates a Razorpay order server-side for the 10% booking amount. The order is
// what the app's checkout is bound to — creating it here means the Razorpay
// KEY SECRET never touches the app (plan §3: our own UPI gateway in-app, no
// store commission).
//
// The client calls this authenticated via supabase.functions.invoke(), so
// req carries the user's JWT. We only trust the amount for the order value; the
// booking itself is recorded after verify-razorpay-payment confirms the
// signature.
//
// Deploy:
//   supabase functions deploy create-razorpay-order
//   supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxx RAZORPAY_KEY_SECRET=xxx
//
// Returns: { orderId, keyId, amount, currency }  (amount echoed in paise)

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders'

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
    if (!keyId || !keySecret) {
      return json({ error: 'Razorpay not configured' }, 500)
    }

    const { amount, receipt } = await req.json()
    // amount arrives in rupees; Razorpay works in paise.
    const paise = Math.round(Number(amount) * 100)
    if (!Number.isFinite(paise) || paise <= 0) {
      return json({ error: 'Invalid amount' }, 400)
    }

    const auth = btoa(`${keyId}:${keySecret}`)
    const res = await fetch(RAZORPAY_ORDERS_URL, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: paise,
        currency: 'INR',
        receipt: receipt || `booking_${Date.now()}`,
        // Auto-capture so a successful payment settles without a second call.
        payment_capture: 1,
      }),
    })
    const order = await res.json()
    if (!res.ok || !order?.id) {
      return json({ error: 'Order creation failed', detail: order }, 502)
    }

    return json({ orderId: order.id, keyId, amount: paise, currency: 'INR' }, 200)
  } catch (e) {
    console.error('[create-razorpay-order] error:', e)
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
