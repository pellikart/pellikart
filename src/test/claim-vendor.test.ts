import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Login-with-code (claim) flow ────────────────────────────────────────────
// The vendor logs in with Google, then enters the claim code / phone Pellikart
// gave them. claimVendor() forwards those to the claim_vendor RPC. This suite
// pins the client-side contract: trimming, success pass-through, error
// surfacing, and the not-connected guard — the exact things that break the
// live "enter your code" moment in front of a vendor.

const hoisted = vi.hoisted(() => {
  const rpc = vi.fn()
  return { rpc, holder: { client: { rpc } as { rpc: typeof rpc } | null } }
})

// Live-binding getter so flipping holder.client to null is observed by the
// `if (!supabase)` guard inside supabase-db at call time.
vi.mock('@/lib/supabase', () => ({
  get supabase() {
    return hoisted.holder.client
  },
}))

import { claimVendor } from '@/lib/supabase-db'

describe('claimVendor (login-with-code flow)', () => {
  beforeEach(() => {
    hoisted.rpc.mockReset()
    hoisted.holder.client = { rpc: hoisted.rpc }
  })

  it('trims code + phone and forwards them to the claim_vendor RPC', async () => {
    hoisted.rpc.mockResolvedValue({ data: 'vendor-uuid-9', error: null })

    const id = await claimVendor('  PK-AB12 ', '  +919876543210 ')

    expect(hoisted.rpc).toHaveBeenCalledWith('claim_vendor', {
      p_code: 'PK-AB12',
      p_phone: '+919876543210',
    })
    expect(id).toBe('vendor-uuid-9')
  })

  it('works with only a code (phone left blank)', async () => {
    hoisted.rpc.mockResolvedValue({ data: 'vendor-uuid-1', error: null })

    const id = await claimVendor('PK-WXYZ', '')

    expect(hoisted.rpc).toHaveBeenCalledWith('claim_vendor', { p_code: 'PK-WXYZ', p_phone: '' })
    expect(id).toBe('vendor-uuid-1')
  })

  it('surfaces the RPC error message so the vendor sees why the claim failed', async () => {
    hoisted.rpc.mockResolvedValue({
      data: null,
      error: { message: 'No matching profile found. Check your code or phone number.' },
    })

    await expect(claimVendor('PK-ZZZZ', '')).rejects.toThrow(
      'No matching profile found. Check your code or phone number.',
    )
  })

  it('surfaces the "already claimed / ambiguous" errors verbatim', async () => {
    hoisted.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Multiple profiles match — please use your claim code.' },
    })

    await expect(claimVendor('', '+919876543210')).rejects.toThrow(
      'Multiple profiles match — please use your claim code.',
    )
  })

  it('throws "Not connected" when Supabase is unavailable (never silently succeeds)', async () => {
    hoisted.holder.client = null

    await expect(claimVendor('PK-AB12', '')).rejects.toThrow('Not connected')
    expect(hoisted.rpc).not.toHaveBeenCalled()
  })
})
