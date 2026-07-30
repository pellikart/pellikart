// Supabase Edge Function: create-linked-account
//
// Onboards a vendor to Razorpay Route: creates a LINKED ACCOUNT from their KYC +
// bank details so their split of the booking payment can settle to them. Called
// authenticated (the vendor's JWT); we resolve the vendor from that and store
// the resulting account id in vendor_payout_accounts.
//
// Razorpay Route account onboarding is multi-step:
//   1. POST /v2/accounts                         → linked account (acc_XXX)
//   2. POST /v2/accounts/:id/products            → request the "route" product
//   3. PATCH /v2/accounts/:id/products/:prod     → settlement bank details
// Steps 2–3 are best-effort here; a failure there still stores the account id
// with status 'needs_action' so the vendor can finish activation later.
//
// Deploy:
//   supabase functions deploy create-linked-account
//   (uses RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET + SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)
//
// Body: { email, phone, legalBusinessName, businessType, contactName, pan,
//         bankAccountNumber, ifsc, beneficiaryName, category?, subcategory? }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RZP = 'https://api.razorpay.com/v2'

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
    if (!keyId || !keySecret) return json({ error: 'Razorpay not configured' }, 500)
    const auth = 'Basic ' + btoa(`${keyId}:${keySecret}`)

    // Resolve the calling vendor from their JWT.
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: userData } = await admin.auth.getUser(jwt)
    const userId = userData?.user?.id
    if (!userId) return json({ error: 'Not authenticated' }, 401)
    const { data: vendor } = await admin.from('vendors').select('id').eq('user_id', userId).maybeSingle()
    if (!vendor) return json({ error: 'Vendor not found' }, 404)

    const b = await req.json()

    // 1. Create the linked account.
    const acctRes = await fetch(`${RZP}/accounts`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: b.email,
        phone: b.phone,
        type: 'route',
        reference_id: vendor.id,
        legal_business_name: b.legalBusinessName,
        business_type: b.businessType || 'individual',
        contact_name: b.contactName,
        profile: { category: b.category || 'others', subcategory: b.subcategory || 'others' },
        legal_info: b.pan ? { pan: b.pan } : undefined,
      }),
    })
    const account = await acctRes.json()
    if (!acctRes.ok || !account?.id) {
      return json({ error: 'Linked account creation failed', detail: account }, 502)
    }

    // 2–3. Request the route product and attach settlement bank details.
    let status = 'activation_pending'
    try {
      const prodRes = await fetch(`${RZP}/accounts/${account.id}/products`, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: 'route', tnc_accepted: true }),
      })
      const product = await prodRes.json()
      if (prodRes.ok && product?.id && b.bankAccountNumber && b.ifsc) {
        await fetch(`${RZP}/accounts/${account.id}/products/${product.id}`, {
          method: 'PATCH',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settlements: {
              account_number: b.bankAccountNumber,
              ifsc_code: b.ifsc,
              beneficiary_name: b.beneficiaryName || b.contactName,
            },
            tnc_accepted: true,
          }),
        })
      } else {
        status = 'needs_action'
      }
    } catch (_) {
      status = 'needs_action'
    }

    const last4 = String(b.bankAccountNumber || '').slice(-4)
    await admin.from('vendor_payout_accounts').upsert(
      {
        vendor_id: vendor.id,
        razorpay_account_id: account.id,
        status,
        beneficiary_name: b.beneficiaryName || b.contactName,
        bank_last4: last4 || null,
      },
      { onConflict: 'vendor_id' }
    )

    return json({ accountId: account.id, status }, 200)
  } catch (e) {
    console.error('[create-linked-account] error:', e)
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}
