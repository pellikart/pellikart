// Vendor profile — port of the web VendorProfile (view + edit).
//
// Shows the header card with a live completeness bar, an editable Business
// Details sheet, and links into the vendor's other management screens. Edits
// persist through the SHARED updateVendorProfile.
//
// Portfolio photo upload is deferred: on the web it uses a file input +
// Supabase Storage; the native equivalent needs expo-image-picker and the
// upload flow, which will land with the listing media work. Everything else
// here is faithful.

import { useState } from 'react'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVendorStore } from '@shared/vendor-store'
import type { VendorProfile as VendorProfileType } from '@shared/vendor-types'
import { Button, Text } from '@/components/ui'
import { Field, Chip } from '@/components/inputs'
import { SignOutRow } from '@/components/SignOutRow'
import { colors, radius } from '@/theme/tokens'

const CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Decor', 'Makeup', 'Mehendi', 'DJ / Music',
  'Pandit', 'Invitations', 'Banjantrilu', 'Reels', 'Saree Draping', 'Live Stalls',
  'Hosts / Entertainers', 'Wedding Props', 'Other',
]
const AREAS = [
  'Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Gachibowli', 'Kukatpally',
  'Secunderabad', 'Kondapur', 'Hitech City', 'Begumpet', 'Ameerpet',
  'Chandanagar', 'Sanath Nagar', 'Moosapet',
]
const TEAM_SIZES = ['Solo', '2-5', '5-10', '10+']

// Reproduced from VendorProfile — equal-weighted completeness checks.
function calcCompleteness(p: VendorProfileType): number {
  const photos = Array.isArray(p.portfolioPhotos) ? p.portfolioPhotos : []
  const checks = [
    p.businessName.trim().length > 0,
    p.category.trim().length > 0,
    p.area.trim().length > 0,
    p.phone.trim().length > 0,
    p.whatsapp.trim().length > 0,
    p.email.trim().length > 0,
    p.description.trim().length >= 50,
    p.experience > 0,
    p.teamSize.trim().length > 0,
    photos.length >= 3,
    !!p.instagram?.trim(),
    Object.keys(p.categoryFields || {}).length > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

const SECTIONS = [
  { label: 'Bookings', desc: 'Upcoming, completed, cancelled', href: '/(vendor)/bookings' },
  { label: 'Leads', desc: 'Couples who picked your listings', href: '/(vendor)/leads' },
  { label: 'Visit Requests', desc: 'Approve or propose a new time', href: '/(vendor)/trials' },
  { label: 'Reviews', desc: 'All reviews and ratings', href: '/(vendor)/reviews' },
  { label: 'Payouts', desc: 'Bank details & booking payouts', href: '/(vendor)/payouts' },
  { label: 'Notifications', desc: 'Leads, bookings, visit requests', href: '/(vendor)/notifications' },
] as const

export default function VendorProfileScreen() {
  const profile = useVendorStore((s) => s.vendorProfile)
  const reviews = useVendorStore((s) => s.vendorReviews)
  const updateVendorProfile = useVendorStore((s) => s.updateVendorProfile)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<VendorProfileType>>({})

  if (!profile) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.center}>
          <Text variant="body" color={colors.gray500}>
            No vendor profile loaded yet.
          </Text>
          <SignOutRow />
        </View>
      </SafeAreaView>
    )
  }

  const p = profile
  const photos = Array.isArray(p.portfolioPhotos) ? p.portfolioPhotos : []
  const completeness = calcCompleteness(p)

  function openEdit() {
    setForm({
      businessName: p.businessName,
      category: p.category,
      area: p.area,
      phone: p.phone,
      whatsapp: p.whatsapp,
      email: p.email,
      instagram: p.instagram || '',
      description: p.description,
      experience: p.experience,
      teamSize: p.teamSize,
    })
    setEditing(true)
  }

  function saveEdit() {
    updateVendorProfile({
      businessName: form.businessName,
      category: form.category,
      area: form.area,
      phone: form.phone,
      whatsapp: form.whatsapp,
      email: form.email,
      instagram: (form.instagram ?? '').trim() || undefined,
      description: form.description,
      experience: form.experience,
      teamSize: form.teamSize,
    })
    setEditing(false)
  }

  const set = <K extends keyof VendorProfileType>(key: K, value: VendorProfileType[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.headerBar}>
        <Text variant="title">Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              {photos[0] ? (
                <Image source={{ uri: photos[0] }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Text variant="h2" color={colors.mustard}>
                  {p.businessName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.headerCopy}>
              <Text variant="title">{p.businessName}</Text>
              <Text variant="caption" color={colors.gray500}>
                {p.category} · {p.area}, {p.city}
              </Text>
              <Text variant="micro" color={colors.gray400} style={styles.headerMeta}>
                ★ {p.rating} · {p.experience} yrs exp · Team {p.teamSize}
              </Text>
            </View>
          </View>

          <View style={styles.completeHead}>
            <Text variant="micro" color={colors.gray500}>
              Profile completeness
            </Text>
            <Text variant="micro" weight="600" color={colors.mustard}>
              {completeness}%
            </Text>
          </View>
          <View style={styles.completeTrack}>
            <View style={[styles.completeFill, { width: `${completeness}%` }]} />
          </View>
        </View>

        {/* Business details → edit */}
        <Pressable style={styles.detailBtn} onPress={openEdit}>
          <View style={styles.grow}>
            <Text variant="small" weight="500">
              Business Details
            </Text>
            <Text variant="micro" color={colors.gray400}>
              {p.category} · {p.area} · {p.phone}
            </Text>
          </View>
          <Text variant="micro" weight="500" color={colors.mustard}>
            Edit
          </Text>
        </Pressable>

        {/* Section links */}
        <View style={styles.sections}>
          {SECTIONS.map((s) => (
            <Pressable key={s.label} style={styles.sectionRow} onPress={() => router.push(s.href)}>
              <View style={styles.grow}>
                <Text variant="small" weight="500">
                  {s.label}
                </Text>
                <Text variant="micro" color={colors.gray400}>
                  {s.label === 'Reviews' ? `${reviews.length} reviews · ★ ${p.rating}` : s.desc}
                </Text>
              </View>
              <Text variant="body" color={colors.gray300}>
                ›
              </Text>
            </Pressable>
          ))}
        </View>

        <SignOutRow />
      </ScrollView>

      {/* Edit sheet */}
      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <Pressable style={styles.backdrop} onPress={() => setEditing(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text variant="title" style={styles.sheetTitle}>
                Edit Business Details
              </Text>

              <View style={styles.form}>
                <Field label="Business name" accent={colors.mustard} value={form.businessName ?? ''} onChangeText={(v) => set('businessName', v)} />

                <ChipGroup label="Category" options={CATEGORIES} value={form.category} onSelect={(v) => set('category', v)} />
                <ChipGroup label="Where you're based" options={AREAS} value={form.area} onSelect={(v) => set('area', v)} />

                <Field label="Phone" accent={colors.mustard} keyboardType="phone-pad" value={form.phone ?? ''} onChangeText={(v) => set('phone', v)} />
                <Field label="WhatsApp" accent={colors.mustard} keyboardType="phone-pad" value={form.whatsapp ?? ''} onChangeText={(v) => set('whatsapp', v)} />
                <Field label="Email" accent={colors.mustard} keyboardType="email-address" autoCapitalize="none" value={form.email ?? ''} onChangeText={(v) => set('email', v)} />
                <Field label="Instagram" optional accent={colors.mustard} autoCapitalize="none" placeholder="@yourhandle" value={form.instagram ?? ''} onChangeText={(v) => set('instagram', v)} />
                <Field
                  label="Description"
                  accent={colors.mustard}
                  multiline
                  value={form.description ?? ''}
                  onChangeText={(v) => set('description', v)}
                  helper="Tip: wrap a line in **asterisks** for a bold subheading. Line breaks are kept."
                />
                <Field
                  label="Years of experience"
                  accent={colors.mustard}
                  keyboardType="number-pad"
                  value={form.experience != null ? String(form.experience) : ''}
                  onChangeText={(v) => set('experience', parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)}
                />

                <View>
                  <Text variant="body" weight="500" style={styles.groupLabel}>
                    Team size
                  </Text>
                  <View style={styles.chipRow}>
                    {TEAM_SIZES.map((t) => (
                      <Chip
                        key={t}
                        label={t}
                        selected={form.teamSize === t}
                        onPress={() => set('teamSize', t)}
                        accent={colors.mustard}
                        accentLight={colors.mustardLight}
                        style={styles.teamChip}
                      />
                    ))}
                  </View>
                </View>
              </View>

              <Button label="Save changes" variant="vendor" onPress={saveEdit} style={styles.saveBtn} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

function ChipGroup({
  label,
  options,
  value,
  onSelect,
}: {
  label: string
  options: string[]
  value: string | undefined
  onSelect: (v: string) => void
}) {
  return (
    <View>
      <Text variant="body" weight="500" style={styles.groupLabel}>
        {label}
      </Text>
      <View style={styles.chipWrap}>
        {options.map((o) => (
          <Chip
            key={o}
            label={o}
            selected={value === o}
            onPress={() => onSelect(o)}
            accent={colors.mustard}
            accentLight={colors.mustardLight}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  headerBar: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  body: { padding: 16, paddingBottom: 32 },
  headerCard: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.mustardLight, borderWidth: 1, borderColor: 'rgba(212,160,23,0.2)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: radius.md, overflow: 'hidden', backgroundColor: 'rgba(212,160,23,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%' },
  headerCopy: { flex: 1 },
  headerMeta: { marginTop: 2 },
  completeHead: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 4 },
  completeTrack: { height: 6, backgroundColor: colors.white, borderRadius: 999, overflow: 'hidden' },
  completeFill: { height: 6, backgroundColor: colors.mustard, borderRadius: 999 },
  detailBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white },
  grow: { flex: 1 },
  sections: { marginTop: 16, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28, maxHeight: '90%' },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.gray300, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { marginBottom: 16 },
  form: { gap: 16 },
  groupLabel: { marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipRow: { flexDirection: 'row', gap: 8 },
  teamChip: { flex: 1 },
  saveBtn: { marginTop: 20 },
})
