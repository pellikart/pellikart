// Payment seam for the 10% booking amount.
//
// Real Razorpay flow (plan §3 — our own UPI gateway in-app, no store cut):
//   1. create-razorpay-order edge function makes the order server-side (the key
//      SECRET never touches the app).
//   2. We open the razorpay-checkout hosted page in a browser session
//      (expo-web-browser). Using the hosted checkout.js widget means no native
//      Razorpay module, so this runs in a dev build without ejecting.
//   3. The page redirects back to our deep link with the payment result.
//   4. verify-razorpay-payment confirms the signature server-side; only then is
//      the booking recorded by the caller.
//
// The real flow runs only when it can actually work: a native platform, a
// configured EXPO_PUBLIC_RAZORPAY_KEY_ID, and a Supabase client. Otherwise
// (demo, web preview, no keys) it falls back to a simulated success — matching
// the web app — so the booking UI is always exercisable.

import { Platform } from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase.native'

export interface BookingPaymentRequest {
  amount: number
  description: string
  /** Route split: each vendor (by vendors.id) and the booking amount charged for
   *  them. The edge function transfers (amount − commission) to their linked
   *  account, held until a milestone. Omit / empty → settles wholly to platform. */
  splits?: { vendorId: string; amount: number }[]
}

export type BookingPaymentResult =
  | { ok: true; paymentId: string; simulated: boolean }
  | { ok: false; error: string }

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL

function razorpayEnabled(): boolean {
  return Platform.OS !== 'web' && !!RAZORPAY_KEY_ID && !!SUPABASE_URL && !!supabase
}

export async function payBookingAmount(req: BookingPaymentRequest): Promise<BookingPaymentResult> {
  if (!(req.amount > 0)) return { ok: false, error: 'Invalid booking amount.' }
  if (!razorpayEnabled()) {
    // Simulated settlement (demo / web / unconfigured).
    return { ok: true, paymentId: `sim_${Math.round(Math.abs(Math.sin(req.amount)) * 1e9)}`, simulated: true }
  }
  return runRazorpay(req)
}

async function runRazorpay(req: BookingPaymentRequest): Promise<BookingPaymentResult> {
  try {
    // 1. Create the order server-side.
    const { data: order, error: orderErr } = await supabase!.functions.invoke('create-razorpay-order', {
      body: { amount: req.amount, splits: req.splits?.filter((s) => s.vendorId) },
    })
    if (orderErr || !order?.orderId) {
      return { ok: false, error: 'Could not start the payment. Please try again.' }
    }

    // 2. Open the hosted checkout and wait for the redirect back to us.
    const redirect = Linking.createURL('razorpay-callback')
    const checkoutUrl =
      `${SUPABASE_URL}/functions/v1/razorpay-checkout` +
      `?orderId=${encodeURIComponent(order.orderId)}` +
      `&keyId=${encodeURIComponent(order.keyId)}` +
      `&amount=${encodeURIComponent(String(order.amount))}` +
      `&currency=${encodeURIComponent(order.currency || 'INR')}` +
      `&redirect=${encodeURIComponent(redirect)}` +
      `&description=${encodeURIComponent(req.description)}`

    const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirect)
    if (result.type !== 'success' || !result.url) {
      return { ok: false, error: '' } // user closed the sheet — no error banner
    }

    const params = new URL(result.url).searchParams
    if (params.get('status') !== 'success') {
      return { ok: false, error: params.get('status') === 'cancelled' ? '' : 'Payment did not complete.' }
    }

    // 3. Verify the signature server-side before trusting it.
    const paymentId = params.get('payment_id') || ''
    const { data: verification, error: verifyErr } = await supabase!.functions.invoke('verify-razorpay-payment', {
      body: { orderId: params.get('order_id'), paymentId, signature: params.get('signature') },
    })
    if (verifyErr || !verification?.verified) {
      return { ok: false, error: 'We could not verify the payment. If you were charged, contact support.' }
    }

    return { ok: true, paymentId, simulated: false }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Payment failed.' }
  }
}
