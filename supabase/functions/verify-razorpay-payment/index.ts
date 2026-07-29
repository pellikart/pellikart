// Supabase Edge Function: verify-razorpay-payment
//
// Verifies a completed Razorpay payment. Razorpay signs `order_id|payment_id`
// with the KEY SECRET (HMAC-SHA256); a genuine payment's razorpay_signature
// matches. Doing this server-side is what makes the payment trustworthy — a
// client could otherwise claim success. Only after this returns { verified:
// true } does the app record the booking.
//
// Deploy:
//   supabase functions deploy verify-razorpay-payment
//   (uses the same RAZORPAY_KEY_SECRET secret as create-razorpay-order)
//
// Body:    { orderId, paymentId, signature }
// Returns: { verified: boolean }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keySecret) return json({ error: 'Razorpay not configured' }, 500)

    const { orderId, paymentId, signature } = await req.json()
    if (!orderId || !paymentId || !signature) {
      return json({ verified: false, error: 'Missing fields' }, 400)
    }

    const expected = await hmacSha256Hex(keySecret, `${orderId}|${paymentId}`)
    // Constant-time-ish compare (lengths are fixed hex, so a plain compare is fine here).
    const verified = expected === String(signature).toLowerCase()

    return json({ verified }, verified ? 200 : 400)
  } catch (e) {
    console.error('[verify-razorpay-payment] error:', e)
    return json({ verified: false, error: String(e) }, 500)
  }
})

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
