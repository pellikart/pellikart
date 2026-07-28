// Vendor reviews — port of the web VendorReviews.
//
// Rating summary, the review list, and a respond sheet. Responses persist
// through the SHARED respondToReview. Reviews themselves are written only after
// a completed booking (enforced couple-side / in Phase 4), so everything here
// is trusted, verified feedback.

import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVendorStore } from '@shared/vendor-store'
import { Button, Text } from '@/components/ui'
import { Field } from '@/components/inputs'
import { SubHeader } from '@/components/SubHeader'
import { colors, radius } from '@/theme/tokens'

function monthYear(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}
function fullDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
}
function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ fontSize: size, color: s <= value ? colors.mustard : colors.gray300 }}>
          ★
        </Text>
      ))}
    </View>
  )
}

export default function VendorReviews() {
  const reviews = useVendorStore((s) => s.vendorReviews)
  const respondToReview = useVendorStore((s) => s.respondToReview)

  const [respondId, setRespondId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')

  const avgRating =
    reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0'

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <SubHeader title="Reviews" />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.summaryLeft}>
            <Text variant="h1">{avgRating}</Text>
            <Text variant="micro" color={colors.gray500}>
              out of 5
            </Text>
          </View>
          <View style={styles.grow}>
            <Stars value={Math.round(Number(avgRating))} size={16} />
            <Text variant="micro" color={colors.gray500} style={styles.summarySub}>
              {reviews.length} verified reviews
            </Text>
          </View>
        </View>

        {reviews.length === 0 ? (
          <Text variant="small" color={colors.gray400} align="center" style={styles.empty}>
            No reviews yet
          </Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.review}>
              <View style={styles.reviewHead}>
                <Text variant="small" weight="600">
                  {r.coupleNames}
                </Text>
                <Stars value={r.rating} />
              </View>
              <Text variant="micro" color={colors.gray400}>
                {r.eventName} · {monthYear(r.eventDate)}
              </Text>
              <Text variant="small" color={colors.gray600} style={styles.reviewText}>
                {r.text}
              </Text>
              <Text variant="micro" color={colors.gray400} style={styles.posted}>
                Posted {fullDate(r.datePosted)}
              </Text>

              {r.vendorResponse ? (
                <View style={styles.responseBox}>
                  <Text variant="micro" weight="600" color={colors.mustard}>
                    Your response
                  </Text>
                  <Text variant="small" color={colors.gray600}>
                    {r.vendorResponse}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setRespondId(r.id)
                      setResponseText(r.vendorResponse || '')
                    }}
                    hitSlop={6}
                  >
                    <Text variant="micro" weight="500" color={colors.mustard} style={styles.editResp}>
                      Edit response
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setRespondId(r.id)
                    setResponseText('')
                  }}
                  hitSlop={6}
                >
                  <Text variant="small" weight="500" color={colors.mustard} style={styles.addResp}>
                    + Add response
                  </Text>
                </Pressable>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!respondId} transparent animationType="slide" onRequestClose={() => setRespondId(null)}>
        <Pressable style={styles.backdrop} onPress={() => setRespondId(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            <Text variant="title">Respond to review</Text>
            <Text variant="caption" color={colors.gray400} style={styles.sheetSub}>
              Your response will be visible publicly under the review.
            </Text>
            <Field
              accent={colors.mustard}
              multiline
              value={responseText}
              onChangeText={setResponseText}
              placeholder="Thank you for your kind words..."
            />
            <View style={styles.sheetActions}>
              <Button label="Cancel" variant="secondary" onPress={() => setRespondId(null)} style={styles.grow} />
              <Button
                label="Post response"
                variant="vendor"
                disabled={!responseText.trim()}
                onPress={() => {
                  if (respondId) respondToReview(respondId, responseText.trim())
                  setRespondId(null)
                }}
                style={styles.grow}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  body: { padding: 16 },
  grow: { flex: 1 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: radius.md, backgroundColor: colors.mustardLight, borderWidth: 1, borderColor: 'rgba(212,160,23,0.2)', marginBottom: 16 },
  summaryLeft: { alignItems: 'center' },
  summarySub: { marginTop: 2 },
  stars: { flexDirection: 'row', gap: 2 },
  empty: { paddingVertical: 48 },
  review: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  reviewText: { marginTop: 6, lineHeight: 18 },
  posted: { marginTop: 6 },
  responseBox: { marginTop: 8, paddingLeft: 10, paddingVertical: 8, paddingRight: 8, borderLeftWidth: 2, borderLeftColor: 'rgba(212,160,23,0.4)', backgroundColor: 'rgba(212,160,23,0.08)', borderTopRightRadius: radius.sm, borderBottomRightRadius: radius.sm },
  editResp: { marginTop: 4 },
  addResp: { marginTop: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28 },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.gray300, alignSelf: 'center', marginBottom: 12 },
  sheetSub: { marginTop: 4, marginBottom: 12 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
})
