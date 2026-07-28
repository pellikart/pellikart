// The multi-step listing form, shared by create (new.tsx) and edit
// ([listingId].tsx). Restates VendorAddListing's flow as an explicit step list
// (see listing-form.ts) and renders each step: rituals → config fields →
// pricing → inclusions → photos → review.
//
// Category coverage:
//   • Photography / Hosts & Entertainers → their dedicated pricing editors
//   • generic categories → a starting-price slider
//   • Venue / Catering → the common fields + a note that the heavy sub-editors
//     (plate packages, menu builder, rooms, in-house decor) live on the web
//
// The parent supplies onSubmit(draft, photoUrls) so create and edit differ only
// in what they do with the assembled listing.

import { useState } from 'react'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import Slider from '@react-native-community/slider'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getListingConfig, RITUALS } from '@shared/vendor-category-config'
import { formatINR } from '@shared/helpers'
import { Button, Text } from '@/components/ui'
import { Chip, ProgressBar } from '@/components/inputs'
import { FormField, isFieldVisible, type FieldValues } from '@/components/FormField'
import { PhotographyEventPackagesEditor } from '@/components/editors/PhotographyEventPackagesEditor'
import { EntertainerPricingEditor } from '@/components/editors/EntertainerPricingEditor'
import { pickImages } from '@/lib/media'
import {
  stepsFor,
  webOnlyPricingNote,
  type ListingDraft,
  type StepKey,
} from '@/lib/listing-form'
import { colors, radius } from '@/theme/tokens'

const MAX_PHOTOS = 10

export function ListingForm({
  category,
  title,
  submitLabel,
  initial,
  onSubmit,
}: {
  category: string
  title: string
  submitLabel: string
  initial: ListingDraft
  /** Assemble + persist. Returns an error message, or null on success. */
  onSubmit: (draft: ListingDraft, photoUris: string[]) => Promise<string | null>
}) {
  const steps = stepsFor(category)
  const config = getListingConfig(category)
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<ListingDraft>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const step = steps[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = step === 'review'

  const patch = (p: Partial<ListingDraft>) => setDraft((d) => ({ ...d, ...p }))

  function setCategoryField(key: string, value: string | string[]) {
    setDraft((d) => {
      const next: FieldValues = { ...d.categoryFields, [key]: value }
      // Mirror the web: prune now-hidden fields as dependencies change.
      for (const s of config.steps) {
        for (const f of s.fields) {
          if (!isFieldVisible(f, next)) delete next[f.key]
        }
      }
      return { ...d, categoryFields: next }
    })
  }

  async function addPhotos() {
    const uris = await pickImages(MAX_PHOTOS - draft.photos.length)
    if (uris.length) patch({ photos: [...draft.photos, ...uris] })
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const err = await onSubmit(draft, draft.photos)
    setSubmitting(false)
    if (err) setError(err)
    // On success the parent navigates away.
  }

  const back = () => (isFirst ? router.back() : setStepIndex((i) => i - 1))
  const next = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1))

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={10}>
          <Text variant="title">←</Text>
        </Pressable>
        <Text variant="title" style={styles.grow}>
          {title}
        </Text>
        <Text variant="caption" color={colors.gray400}>
          {stepIndex + 1}/{steps.length}
        </Text>
      </View>
      <ProgressBar value={(stepIndex + 1) / steps.length} />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <StepView
          step={step}
          category={category}
          config={config}
          draft={draft}
          patch={patch}
          setCategoryField={setCategoryField}
          addPhotos={addPhotos}
        />
        {!!error && (
          <Text variant="small" color={colors.danger} style={styles.error}>
            {error}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!isFirst && <Button label="Back" variant="secondary" onPress={back} style={styles.grow} />}
        {isLast ? (
          <Button label={submitLabel} variant="vendor" loading={submitting} onPress={handleSubmit} style={styles.grow} />
        ) : (
          <Button label="Next" variant="vendor" onPress={next} style={styles.grow} />
        )}
      </View>
    </SafeAreaView>
  )
}

function StepView({
  step,
  category,
  config,
  draft,
  patch,
  setCategoryField,
  addPhotos,
}: {
  step: StepKey
  category: string
  config: ReturnType<typeof getListingConfig>
  draft: ListingDraft
  patch: (p: Partial<ListingDraft>) => void
  setCategoryField: (key: string, value: string | string[]) => void
  addPhotos: () => void
}) {
  if (step === 'rituals') {
    return (
      <Step title="Which events is this for?" subtitle="Pick every event this listing suits.">
        <View style={styles.chipWrap}>
          {RITUALS.map((r) => (
            <Chip
              key={r}
              label={r}
              selected={draft.rituals.includes(r)}
              onPress={() =>
                patch({ rituals: draft.rituals.includes(r) ? draft.rituals.filter((x) => x !== r) : [...draft.rituals, r] })
              }
              accent={colors.mustard}
              accentLight={colors.mustardLight}
            />
          ))}
        </View>
      </Step>
    )
  }

  if (step.startsWith('config:')) {
    const idx = Number(step.split(':')[1])
    const stepCfg = config.steps[idx]
    if (!stepCfg) return null
    return (
      <Step title={stepCfg.title} subtitle={stepCfg.subtitle}>
        <View style={styles.fields}>
          {stepCfg.fields
            .filter((f) => isFieldVisible(f, draft.categoryFields))
            .map((f) => (
              <FormField
                key={f.key}
                field={f}
                value={draft.categoryFields[f.key]}
                onChange={(v) => setCategoryField(f.key, v)}
              />
            ))}
        </View>
      </Step>
    )
  }

  if (step === 'pricing') {
    if (category === 'Photography') {
      return (
        <Step title="How do you price?" subtitle="Create one or more event pricing cards.">
          <PhotographyEventPackagesEditor value={draft.eventPackages} onChange={(v) => patch({ eventPackages: v })} />
        </Step>
      )
    }
    if (category === 'Hosts / Entertainers') {
      return (
        <Step title="How do you price?" subtitle="Set a flat price per event.">
          {draft.entertainerPricing && (
            <EntertainerPricingEditor value={draft.entertainerPricing} onChange={(v) => patch({ entertainerPricing: v })} />
          )}
        </Step>
      )
    }
    const note = webOnlyPricingNote(category)
    const { min, max, step: priceStep } = config.priceRange
    return (
      <Step title="Pricing" subtitle={category === 'Catering' ? 'Your price per plate.' : 'Your starting price.'}>
        {!!note && (
          <View style={styles.note}>
            <Text variant="small" color={colors.gray600}>
              {note}
            </Text>
          </View>
        )}
        <Text variant="h2" color={colors.mustard} style={styles.priceValue}>
          {formatINR(draft.price || min)}
        </Text>
        <Slider
          minimumValue={min}
          maximumValue={max}
          step={priceStep}
          value={draft.price || min}
          onValueChange={(v) => patch({ price: v })}
          minimumTrackTintColor={colors.mustard}
          maximumTrackTintColor={colors.cardBorder}
          thumbTintColor={colors.mustard}
        />
        <View style={styles.priceScale}>
          <Text variant="micro" color={colors.gray400}>
            {formatINR(min)}
          </Text>
          <Text variant="micro" color={colors.gray400}>
            {formatINR(max)}
          </Text>
        </View>
      </Step>
    )
  }

  if (step === 'inclusions') {
    return (
      <Step title="What's included?" subtitle="Tap everything this listing covers.">
        <View style={styles.chipWrap}>
          {config.inclusions.map((inc) => (
            <Chip
              key={inc}
              label={inc}
              selected={draft.includes.includes(inc)}
              onPress={() =>
                patch({ includes: draft.includes.includes(inc) ? draft.includes.filter((x) => x !== inc) : [...draft.includes, inc] })
              }
              accent={colors.mustard}
              accentLight={colors.mustardLight}
            />
          ))}
        </View>
      </Step>
    )
  }

  if (step === 'photos') {
    return (
      <Step title="Add photos" subtitle={`Show your best work. Up to ${MAX_PHOTOS}. The first is the cover.`}>
        <View style={styles.photoGrid}>
          {draft.photos.map((uri, i) => (
            <View key={`${uri}-${i}`} style={styles.photoCell}>
              <Image source={{ uri }} style={styles.photo} contentFit="cover" />
              {i === 0 && (
                <View style={styles.coverBadge}>
                  <Text variant="micro" weight="600" color={colors.white}>
                    COVER
                  </Text>
                </View>
              )}
              <Pressable onPress={() => patch({ photos: draft.photos.filter((_, idx) => idx !== i) })} style={styles.photoRemove} hitSlop={6}>
                <Text variant="micro" color={colors.white}>
                  ✕
                </Text>
              </Pressable>
            </View>
          ))}
          {draft.photos.length < MAX_PHOTOS && (
            <Pressable onPress={addPhotos} style={styles.addPhoto}>
              <Text variant="h2" color={colors.mustard}>
                +
              </Text>
              <Text variant="micro" color={colors.gray500}>
                Add
              </Text>
            </Pressable>
          )}
        </View>
      </Step>
    )
  }

  // review
  return (
    <Step title="Review & publish" subtitle="Check the details, then publish your listing.">
      <SummaryRow label="Category" value={category} />
      {draft.rituals.length > 0 && <SummaryRow label="Events" value={draft.rituals.join(', ')} />}
      <SummaryRow label="Price" value={category === 'Decor' ? '—' : formatINR(draft.price)} priceCategories={category} draft={draft} />
      {draft.includes.length > 0 && <SummaryRow label="Includes" value={draft.includes.join(', ')} />}
      <SummaryRow label="Photos" value={`${draft.photos.length} added`} />
    </Step>
  )
}

function Step({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View>
      <Text variant="h2">{title}</Text>
      {!!subtitle && (
        <Text variant="small" color={colors.gray500} style={styles.stepSub}>
          {subtitle}
        </Text>
      )}
      <View style={styles.stepBody}>{children}</View>
    </View>
  )
}

function SummaryRow({
  label,
  value,
  priceCategories,
  draft,
}: {
  label: string
  value: string
  priceCategories?: string
  draft?: ListingDraft
}) {
  // For Photography/Entertainers the effective price is derived, not the slider.
  let shown = value
  if (label === 'Price' && priceCategories && draft) {
    if (priceCategories === 'Photography') shown = `${draft.eventPackages.length} pricing card(s)`
    else if (priceCategories === 'Hosts / Entertainers') shown = `${(draft.entertainerPricing?.eventRates || []).filter((r) => r.price > 0).length} event rate(s)`
  }
  return (
    <View style={styles.summaryRow}>
      <Text variant="small" color={colors.gray500} style={styles.summaryLabel}>
        {label}
      </Text>
      <Text variant="small" weight="500" style={styles.grow}>
        {shown}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  grow: { flex: 1 },
  body: { padding: 16, paddingBottom: 24 },
  error: { marginTop: 16 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  stepSub: { marginTop: 4 },
  stepBody: { marginTop: 20 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fields: { gap: 20 },
  note: { padding: 12, borderRadius: radius.md, backgroundColor: colors.mustardLight, marginBottom: 16 },
  priceValue: { textAlign: 'center', marginBottom: 8 },
  priceScale: { flexDirection: 'row', justifyContent: 'space-between' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoCell: { width: '31%', aspectRatio: 1, borderRadius: radius.sm, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: colors.mustard, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  addPhoto: { width: '31%', aspectRatio: 1, borderRadius: radius.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.mustard, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mustardLight },
  summaryRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder, gap: 12 },
  summaryLabel: { width: 90 },
})
