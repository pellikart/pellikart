// Supabase Edge Function: razorpay-checkout
//
// Serves the Razorpay Checkout page. The app opens this URL in a browser session
// (expo-web-browser); on payment it redirects back to the app's deep link with
// the result. Using the hosted checkout.js widget this way means no native
// Razorpay module — the flow runs in a dev build AND in the web preview.
//
// The KEY ID is public (Razorpay intends it for the frontend); the secret is
// never here — order creation and signature verification are separate functions.
//
// Deploy (must be public — the browser loads it without the app's JWT):
//   supabase functions deploy razorpay-checkout --no-verify-jwt
//
// Query params: orderId, keyId, amount (paise), currency, redirect, description
// On success →  {redirect}?status=success&payment_id=…&order_id=…&signature=…
// On dismiss →  {redirect}?status=cancelled

Deno.serve((req: Request) => {
  const url = new URL(req.url)
  const q = (k: string) => url.searchParams.get(k) ?? ''
  const orderId = q('orderId')
  const keyId = q('keyId')
  const amount = q('amount')
  const currency = q('currency') || 'INR'
  const redirect = q('redirect')
  const description = q('description') || 'Booking amount'

  if (!orderId || !keyId || !redirect) {
    return new Response('Missing parameters', { status: 400 })
  }

  // JSON.stringify each value so it lands safely inside the JS string literals.
  const j = (s: string) => JSON.stringify(s)

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pellikart · Secure payment</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; background: #fafafa; color: #1A1A2E;
           display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { text-align: center; }
    .spinner { width: 28px; height: 28px; border: 3px solid #FDE7F1; border-top-color: #E91E78;
               border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <p>Opening secure payment…</p>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    var redirect = ${j(redirect)};
    function go(params) {
      var sep = redirect.indexOf('?') === -1 ? '?' : '&';
      window.location.href = redirect + sep + params;
    }
    var options = {
      key: ${j(keyId)},
      order_id: ${j(orderId)},
      amount: ${j(amount)},
      currency: ${j(currency)},
      name: 'Pellikart',
      description: ${j(description)},
      theme: { color: '#E91E78' },
      handler: function (r) {
        go('status=success'
          + '&payment_id=' + encodeURIComponent(r.razorpay_payment_id)
          + '&order_id=' + encodeURIComponent(r.razorpay_order_id)
          + '&signature=' + encodeURIComponent(r.razorpay_signature));
      },
      modal: { ondismiss: function () { go('status=cancelled'); } }
    };
    try {
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function () { go('status=failed'); });
      rzp.open();
    } catch (e) {
      go('status=failed');
    }
  </script>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
})
