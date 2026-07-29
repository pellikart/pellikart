// Supabase Edge Function: send-sms-otp  (Auth "Send SMS" hook)
//
// Supabase generates and validates the OTP; this hook just DELIVERS it, via
// MSG91 — WhatsApp first (cheaper, better delivery in India per the plan), SMS
// as fallback. Register it under Auth → Hooks → "Send SMS hook", and enable
// Phone auth. Supabase then calls this with { user, sms: { otp } } on every
// phone sign-in; the app calls supabase.auth.signInWithOtp({ phone }) /
// verifyOtp({ phone, token }).
//
// The request is signed with the Standard Webhooks scheme; we verify it with the
// hook secret so only Supabase can trigger sends.
//
// Deploy:
//   supabase functions deploy send-sms-otp --no-verify-jwt
//   supabase secrets set \
//     SEND_SMS_HOOK_SECRET=v1,whsec_...        # shown when you create the hook
//     MSG91_AUTHKEY=...                         # MSG91 account auth key
//     MSG91_WHATSAPP_TEMPLATE=pellikart_otp     # approved WhatsApp template name
//     MSG91_WHATSAPP_NUMBER=91XXXXXXXXXX        # your MSG91 WhatsApp sender
//     MSG91_SMS_TEMPLATE_ID=...                 # DLT-approved SMS template id
// Both channels expect a single OTP variable in the template.

const MSG91 = 'https://control.msg91.com/api/v5'

Deno.serve(async (req: Request) => {
  try {
    const raw = await req.text()

    // Verify the Standard Webhooks signature from Supabase.
    const secret = Deno.env.get('SEND_SMS_HOOK_SECRET')
    if (secret) {
      const ok = await verifyStandardWebhook(secret, req.headers, raw)
      if (!ok) return new Response(JSON.stringify({ error: 'bad signature' }), { status: 401 })
    }

    const payload = JSON.parse(raw)
    const phone: string = payload?.user?.phone ?? ''       // E.164, e.g. +9198...
    const otp: string = payload?.sms?.otp ?? ''
    if (!phone || !otp) return json({ error: 'missing phone/otp' }, 400)

    const mobile = phone.replace(/^\+/, '') // MSG91 wants no leading +

    const delivered = (await sendWhatsApp(mobile, otp)) || (await sendSms(mobile, otp))
    if (!delivered) return json({ error: 'delivery failed' }, 502)

    return json({}, 200)
  } catch (e) {
    console.error('[send-sms-otp] error:', e)
    return json({ error: String(e) }, 500)
  }
})

async function sendWhatsApp(mobile: string, otp: string): Promise<boolean> {
  const authkey = Deno.env.get('MSG91_AUTHKEY')
  const template = Deno.env.get('MSG91_WHATSAPP_TEMPLATE')
  const from = Deno.env.get('MSG91_WHATSAPP_NUMBER')
  if (!authkey || !template || !from) return false
  try {
    const res = await fetch(`${MSG91}/whatsapp/whatsapp-outbound-message/bulk/`, {
      method: 'POST',
      headers: { authkey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        integrated_number: from,
        content_type: 'template',
        payload: {
          to: mobile,
          type: 'template',
          template: {
            name: template,
            language: { code: 'en', policy: 'deterministic' },
            components: { body_1: { type: 'text', value: otp } },
          },
        },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

async function sendSms(mobile: string, otp: string): Promise<boolean> {
  const authkey = Deno.env.get('MSG91_AUTHKEY')
  const templateId = Deno.env.get('MSG91_SMS_TEMPLATE_ID')
  if (!authkey || !templateId) return false
  try {
    const res = await fetch(`${MSG91}/flow/`, {
      method: 'POST',
      headers: { authkey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        recipients: [{ mobiles: mobile, otp }],
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// Standard Webhooks HMAC-SHA256 verification.
async function verifyStandardWebhook(secret: string, headers: Headers, body: string): Promise<boolean> {
  const id = headers.get('webhook-id')
  const timestamp = headers.get('webhook-timestamp')
  const sigHeader = headers.get('webhook-signature')
  if (!id || !timestamp || !sigHeader) return false

  const base64Secret = secret.replace(/^v1,?/, '').replace(/^whsec_/, '')
  const keyBytes = Uint8Array.from(atob(base64Secret), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signed = `${id}.${timestamp}.${body}`
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed))
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))

  // Header is a space-separated list of "v1,<sig>" entries.
  return sigHeader.split(' ').some((part) => part.split(',')[1] === expected)
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
