// Two-way milestone tracker (couple side) — port of the web MilestoneTracker.
//
// Collapsed: a progress bar + the next step. Expanded: the full timeline with a
// "Mark complete" on the current milestone. Reads/writes the SHARED store
// (milestoneProgress / completeMilestone), the same state the vendor advances
// from the Bookings screen — so a step marked on either side shows on both.

import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useStore } from '@shared/store'
import { getMilestones } from '@shared/milestones'
import { Text } from '@/components/ui'
import { colors } from '@/theme/tokens'

export function MilestoneTracker({ categoryLabel, vendorId }: { categoryLabel: string; vendorId: string }) {
  const [expanded, setExpanded] = useState(false)
  const milestoneProgress = useStore((s) => s.milestoneProgress)
  const completeMilestone = useStore((s) => s.completeMilestone)

  const milestones = getMilestones(categoryLabel)
  const totalCount = milestones.length
  const completedCount = milestoneProgress[vendorId] || 0
  const progress = Math.round((completedCount / totalCount) * 100)
  const allDone = completedCount >= totalCount
  const nextMilestone = milestones[completedCount] || null

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setExpanded((v) => !v)}>
        <View style={styles.barRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress}%` }]} />
          </View>
          <Text variant="micro" color={colors.gray400}>
            {completedCount}/{totalCount}
          </Text>
          <Text variant="micro" color={colors.gray400}>
            {expanded ? '▲' : '▼'}
          </Text>
        </View>

        {nextMilestone && !expanded && (
          <Text variant="micro" color={colors.gray400} style={styles.nextLine}>
            Next: <Text variant="micro" weight="500" color={colors.dark}>{nextMilestone.label}</Text> · {nextMilestone.description}
          </Text>
        )}
        {allDone && !expanded && (
          <Text variant="micro" weight="500" color={colors.success} style={styles.nextLine}>
            All milestones complete!
          </Text>
        )}
      </Pressable>

      {expanded && (
        <View style={styles.timeline}>
          {milestones.map((m, i) => {
            const isDone = i < completedCount
            const isCurrent = i === completedCount && !allDone
            const isLast = i === milestones.length - 1
            return (
              <View key={m.label} style={styles.tRow}>
                <View style={styles.tGutter}>
                  <View
                    style={[
                      styles.dot,
                      isDone
                        ? { backgroundColor: colors.magenta, borderColor: colors.magenta }
                        : isCurrent
                          ? { backgroundColor: colors.white, borderColor: colors.magenta }
                          : { backgroundColor: colors.white, borderColor: colors.cardBorder },
                    ]}
                  >
                    {isDone && (
                      <Text variant="micro" color={colors.white}>
                        ✓
                      </Text>
                    )}
                  </View>
                  {!isLast && <View style={[styles.line, { backgroundColor: isDone ? colors.magenta : colors.cardBorder }]} />}
                </View>
                <View style={styles.tBody}>
                  <Text variant="small" weight="500" color={isDone ? colors.magenta : isCurrent ? colors.dark : colors.gray400}>
                    {m.label}
                  </Text>
                  <Text variant="micro" color={isCurrent ? colors.gray500 : colors.gray400} style={styles.tDesc}>
                    {m.description}
                  </Text>
                  {isCurrent && (
                    <Pressable onPress={() => completeMilestone(vendorId, totalCount)} style={styles.markBtn}>
                      <Text variant="micro" weight="600" color={colors.white}>
                        Mark complete
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  track: { flex: 1, height: 6, borderRadius: 999, backgroundColor: colors.emptyBg, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 999, backgroundColor: colors.magenta },
  nextLine: { marginTop: 2 },
  timeline: { marginTop: 8 },
  tRow: { flexDirection: 'row', gap: 10 },
  tGutter: { alignItems: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  line: { width: 1, flex: 1, minHeight: 22 },
  tBody: { flex: 1, paddingBottom: 12 },
  tDesc: { marginTop: 1 },
  markBtn: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: colors.magenta, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
})
