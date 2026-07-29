// Vendor payouts — Razorpay Route onboarding + payout status.
//
// A vendor enters bank + KYC details once to create a Route linked account
// (create-linked-account edge function); their share of each booking then
// settles here automatically, held until the release milestone. This screen
// shows the account status and the held/released payout history.
//
// Live-only: needs a signed-in vendor + Supabase. In demo there's no backend, so
// it explains that and previews the form.

import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@shared/auth-context'
import { useVendorStore } from '@shared/vendor-store'
import { formatINR } from '@shared/helpers'
import { supabase } from '@/lib/supabase.native'
import { Button, Text } from '@/components/ui'
import { Field } from '@/components/inputs'
import { SubHeader } from '@/components/SubHeader'
import { colors, radius } from '@/theme/tokens'

interface PayoutAccount {
  status: string
  bank_last4: string | null
  beneficiary_name: string | null
}
interface Payout {
  id: string
  amount: number // paise
  status: string
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  activation_pending: 'Activation pending',
  activated: 'Active',
  needs_action: 'Needs your action',
  created: 'Created',
}

export default function VendorPayouts() {
  const { user } = useAuth()
  const vendorDbId = useVendorStore((s) => s._vendorDbId)
  const profile = useVendorStore((s) => s.vendorProfile)
  const live = !!(user && supabase && vendorDbId)

  const [account, setAccount] = useState<PayoutAccount | null>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [form, setForm] = useState({
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    legalBusinessName: profile?.businessName ?? '',
    contactName: '',
    pan: '',
    bankAccountNumber: '',
    ifsc: '',
    beneficiaryName: '',
  })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!live) {
      setLoaded(true)
      return
    }
    let cancelled = false
    ;(async () => {
      const [acc, pays] = await Promise.all([
        supabase!.from('vendor_payout_accounts').select('status, bank_last4, beneficiary_name').eq('vendor_id', vendorDbId).maybeSingle(),
        supabase!.from('vendor_payouts').select('id, amount, status, created_at').eq('vendor_id', vendorDbId).order('created_at', { ascending: false }).limit(20),
      ])
      if (cancelled) return
      setAccount((acc.data as PayoutAccount) ?? null)
      setPayouts((pays.data as Payout[]) ?? [])
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [live, vendorDbId])

  async function submit() {
    setMessage(null)
    if (!live) {
      setMessage('Payments activate once your account is live on the platform.')
      return
    }
    setSubmitting(true)
    const { data, error } = await supabase!.functions.invoke('create-linked-account', { body: form })
    setSubmitting(false)
    if (error || data?.error) {
      setMessage('Could not set up payouts. Check your details and try again.')
      return
    }
    setAccount({ status: data.status, bank_last4: form.bankAccountNumber.slice(-4), beneficiary_name: form.beneficiaryName || form.contactName })
    setMessage('Payout account submitted. Activation may take a short while.')
  }

  const canSubmit =
    form.email.trim() && form.legalBusinessName.trim() && form.bankAccountNumber.trim() && form.ifsc.trim()

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <SubHeader title="Payouts" subtitle="Get paid automatically for bookings" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Status */}
        {loaded && account ? (
          <View style={styles.statusCard}>
            <Text variant="caption" color={colors.gray400}>
              PAYOUT ACCOUNT
            </Text>
            <Text variant="title" style={styles.statusValue}>
              {STATUS_LABEL[account.status] ?? account.status}
            </Text>
            {!!account.bank_last4 && (
              <Text variant="small" color={colors.gray500}>
                {account.beneficiary_name} · A/C ••••{account.bank_last4}
              </Text>
            )}
          </View>
        ) : loaded ? (
          <View style={styles.note}>
            <Text variant="small" color={colors.gray600}>
              Add your bank details to receive your share of each booking automatically. Your payout
              is held until the event milestone, then released.
            </Text>
          </View>
        ) : null}

        {/* Payout history */}
        {payouts.length > 0 && (
          <View style={styles.section}>
            <Text variant="caption" color={colors.gray400} style={styles.sectionLabel}>
              RECENT PAYOUTS
            </Text>
            {payouts.map((p) => (
              <View key={p.id} style={styles.payoutRow}>
                <Text variant="small" weight="600">
                  {formatINR(Math.round(p.amount / 100))}
                </Text>
                <View style={[styles.payoutPill, p.status === 'released' ? styles.released : styles.held]}>
                  <Text variant="micro" weight="600" color={p.status === 'released' ? colors.success : colors.mustard}>
                    {p.status === 'released' ? 'Released' : 'Held'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* KYC / bank form — shown when no account yet, or to update */}
        {loaded && (!account || account.status === 'needs_action') && (
          <View style={styles.section}>
            <Text variant="caption" color={colors.gray400} style={styles.sectionLabel}>
              BANK & KYC DETAILS
            </Text>
            <View style={styles.form}>
              <Field label="Business email" accent={colors.mustard} keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(v) => set('email', v)} />
              <Field label="Phone" accent={colors.mustard} keyboardType="phone-pad" value={form.phone} onChangeText={(v) => set('phone', v)} />
              <Field label="Legal business name" accent={colors.mustard} value={form.legalBusinessName} onChangeText={(v) => set('legalBusinessName', v)} />
              <Field label="Contact name" accent={colors.mustard} value={form.contactName} onChangeText={(v) => set('contactName', v)} />
              <Field label="PAN" accent={colors.mustard} autoCapitalize="none" value={form.pan} onChangeText={(v) => set('pan', v.toUpperCase())} />
              <Field label="Bank account number" accent={colors.mustard} keyboardType="number-pad" value={form.bankAccountNumber} onChangeText={(v) => set('bankAccountNumber', v)} />
              <Field label="IFSC" accent={colors.mustard} autoCapitalize="none" value={form.ifsc} onChangeText={(v) => set('ifsc', v.toUpperCase())} />
              <Field label="Beneficiary name (as per bank)" accent={colors.mustard} value={form.beneficiaryName} onChangeText={(v) => set('beneficiaryName', v)} />
            </View>
            <Button label="Set up payouts" variant="vendor" loading={submitting} disabled={!canSubmit} onPress={submit} style={styles.submit} />
          </View>
        )}

        {!!message && (
          <Text variant="small" color={colors.gray600} style={styles.message}>
            {message}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBg },
  body: { padding: 16, paddingBottom: 32 },
  statusCard: { padding: 16, borderRadius: radius.md, backgroundColor: colors.mustardLight, borderWidth: 1, borderColor: 'rgba(212,160,23,0.2)' },
  statusValue: { marginTop: 2, marginBottom: 2 },
  note: { padding: 12, borderRadius: radius.md, backgroundColor: colors.emptyBg },
  section: { marginTop: 20 },
  sectionLabel: { marginBottom: 8 },
  payoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder },
  payoutPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  held: { backgroundColor: colors.mustardLight },
  released: { backgroundColor: 'rgba(22,163,74,0.12)' },
  form: { gap: 14 },
  submit: { marginTop: 18 },
  message: { marginTop: 16 },
})
