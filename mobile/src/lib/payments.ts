// Payment seam for the 10% booking amount.
//
// The web app has no real gateway yet — booking is recorded straight to the
// database with the amount marked paid. This keeps that behaviour (so the flow
// works in demo and in the current live backend) while giving a single, honest
// integration point for Razorpay later. When the real gateway lands, only
// payBookingAmount() changes; the booking screen and store calls stay put.
//
// The plan (§3): vendor booking is payment for a real-world service, so both
// stores allow our own UPI gateway in-app with no store commission. The real
// implementation is:
//   1. A Supabase edge function creates a Razorpay order server-side (the
//      secret key never touches the app) and returns order_id.
//   2. The app opens Razorpay checkout — the native SDK (react-native-razorpay,
//      needs a dev build) or a hosted checkout via expo-web-browser.
//   3. A second edge function verifies the payment signature, then the booking
//      is written. Razorpay Route handles the split payout to the vendor.
//
// Until then this resolves as a simulated success, matching the web app.

export interface BookingPaymentRequest {
  /** Amount in ₹ (the 10% booking fee). */
  amount: number
  /** Human description shown at checkout, e.g. "Muhurtham Films · Wedding". */
  description: string
}

export type BookingPaymentResult =
  | { ok: true; paymentId: string; simulated: boolean }
  | { ok: false; error: string }

/**
 * Collect the booking amount. Today: simulated success (no gateway configured),
 * mirroring the web app. Swap the body for the Razorpay flow described above
 * without touching callers.
 */
export async function payBookingAmount(req: BookingPaymentRequest): Promise<BookingPaymentResult> {
  if (!(req.amount > 0)) return { ok: false, error: 'Invalid booking amount.' }
  // Simulated settlement. A real gateway would await the checkout result here.
  return { ok: true, paymentId: `sim_${Math.round(Math.abs(Math.sin(req.amount)) * 1e9)}`, simulated: true }
}
