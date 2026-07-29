// Supabase Edge Function: release-vendor-transfer
//
// Releases a vendor's HELD Route transfer when the agreed milestone completes,
// so the payout only settles after the vendor has delivered (plan §7: held
// until milestone/event completion). Held transfers protect couples against a
// no-show; this flips on_hold → 0 on Razorpay and marks the payout released.
//
// Wire it as a Supabase Database Webhook so it fires automatically:
//   Database → Webhooks → Create
//     Table:  milestones
//     Events: UPDATE
//     Type:   Edge Function → release-vendor-transfer
// The webhook sends { type:'UPDATE', record: <milestone> }. We act only when the
// milestone just completed AND its title matches RELEASE_MILESTONE_TITLE
// (default "Event day"). It can also be called directly with { bookingId }.
//
// Deploy:
//   supabase functions deploy release-vendor-transfer
//   supabase secrets set RAZORPAY_KEY_ID=… RAZORPAY_KEY_SECRET=… \
//     SB_URL=… SB_SERVICE_ROLE_KEY=… RELEASE_MILESTONE_TITLE="Event day"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RZP = 'https://api.razorpay.com/v1'

Deno.serve(async (req: Request) => {
  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    const url = Deno.env.get('SB_URL')
    const serviceKey = Deno.env.get('SB_SERVICE_ROLE_KEY')
    if (!keyId || !keySecret || !url || !serviceKey) {
      return json({ error: 'Not configured' }, 500)
    }
    const releaseTitle = Deno.env.get('RELEASE_MILESTONE_TITLE') ?? 'Event day'
    const admin = createClient(url, serviceKey)

    const body = await req.json().catch(() => ({}))
    let bookingId: string | undefined = body.bookingId

    // Database-webhook path: a milestone row was updated.
    if (!bookingId && body.record) {
      const m = body.record
      if (!m.is_complete || m.title !== releaseTitle) {
        return json({ skipped: 'not the release milestone' }, 200)
      }
      bookingId = m.booking_id
    }
    if (!bookingId) return json({ error: 'No booking' }, 400)

    const { data: booking } = await admin.from('bookings').select('id, vendor_id').eq('id', bookingId).maybeSingle()
    if (!booking) return json({ error: 'Booking not found' }, 404)

    // Prefer payouts already linked to this booking; else the vendor's oldest
    // held payout (FIFO), which we then link to this booking.
    let { data: payouts } = await admin
      .from('vendor_payouts')
      .select('id, razorpay_transfer_id')
      .eq('booking_id', bookingId)
      .eq('status', 'held')
    if (!payouts || payouts.length === 0) {
      const res = await admin
        .from('vendor_payouts')
        .select('id, razorpay_transfer_id')
        .eq('vendor_id', booking.vendor_id)
        .eq('status', 'held')
        .order('created_at', { ascending: true })
        .limit(1)
      payouts = res.data ?? []
    }
    if (payouts.length === 0) return json({ released: 0, note: 'no held payout' }, 200)

    const auth = 'Basic ' + btoa(`${keyId}:${keySecret}`)
    let released = 0
    for (const p of payouts) {
      const res = await fetch(`${RZP}/transfers/${p.razorpay_transfer_id}`, {
        method: 'PATCH',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ on_hold: 0 }),
      })
      if (res.ok) {
        await admin.from('vendor_payouts').update({ status: 'released', booking_id: bookingId }).eq('id', p.id)
        released++
      } else {
        console.warn('[release] transfer PATCH failed:', await res.text())
      }
    }

    return json({ released }, 200)
  } catch (e) {
    console.error('[release-vendor-transfer] error:', e)
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
