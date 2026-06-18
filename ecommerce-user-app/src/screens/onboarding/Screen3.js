import React from 'react'
import {
          SafeAreaView,
          StatusBar,
          StyleSheet,
          Text,
          TouchableOpacity,
          View,
        } from 'react-native'
import CustomButton from '../../components/CustomButton'
import colors from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'

const deliverySteps = [
  { id: 'step-1', label: 'Order confirmed', time: '10:25 AM', done: true },
  { id: 'step-2', label: 'Packed and ready', time: '01:10 PM', done: true },
  { id: 'step-3', label: 'Courier on the way', time: '06:45 PM', done: true },
  { id: 'step-4', label: 'Arrives at your door', time: '08:15 PM', done: false },
]

const ProgressDots = () => (
  <View style={styles.dotsRow}>
    <View style={styles.dot} />
    <View style={styles.dot} />
    <View style={[styles.dot, styles.dotActive]} />
  </View>
)

const Screen3 = ({ navigation }) => {
  return (
   <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        {/* <view> checking 123</view> */}
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>Live order tracking</Text>
            <Text style={styles.heroSubtitle}>Track every step to your doorstep</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>On the way</Text>
          </View>
        </View>

        {/* fake map block for onboarding demo */}
        <View style={styles.mapCard}>
          <View style={styles.mapBadge}>
            <Text style={styles.mapBadgeText}>Map</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={[styles.routeDot, styles.routeDotTop]} />
          <View style={[styles.routeDot, styles.routeDotMid]} />
          <View style={[styles.routeDot, styles.routeDotBottom]} />
        </View>
        <View style={styles.timelineCard}>
          {deliverySteps.map(step => (
            <View key={step.id} style={styles.stepRow}>
              <View style={[styles.stepDot, step.done && styles.stepDotDone]} />
              <View style={styles.stepContent}>
                {/* <TouchableOpacity> click me</TouchableOpacity> */}
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepTime}>{step.time}</Text>
              </View>
              <View style={[styles.stepChip, step.done && styles.stepChipDone]}>
                <Text style={[styles.stepChipText, step.done && styles.stepChipTextDone]}>
                  {step.done ? 'Done' : 'Next'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <ProgressDots />

      <Text style={styles.title}>Track orders and</Text>
      <Text style={styles.title}>checkout with ease</Text>

      <Text style={styles.subtitle}>
        Follow delivery in real time and move from cart to done without extra mess.
      </Text>

      <CustomButton
        title="Create Account"
        onPress={() => navigation.replace('Register')}
        style={styles.button}
      />

      <TouchableOpacity onPress={() => navigation.replace('Login')}>
        <Text style={styles.link}>already hv account? sign in</Text>
      </TouchableOpacity>
   </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    // padding: spacing.lg,
    // backgroundColor: colors.background,
    //  justifyContent: 'center',
  },
  topBar: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingHorizontal: spacing.lg,
    // backgroundColor: 'red',
    // marginBottom: spacing.lg,
  },
  back: {
    color: colors.primary,
    fontWeight: '700',
  },
  skip: {
    // color: colors.primary,
    color: colors.primarySoft,
    // fontWeight: '700',
    fontWeight: '700',
  },
  heroCard: {
    marginTop: spacing.lg,
    borderRadius: 34,
    // backgroundColor: colors.primary,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderWidth: 1,
    // borderColor: colors.border,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    //padding: spacing.lg,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 20,
    /// fontWeight: '800',
    // textAlign: 'center',

    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
  },
  statusPill: {
    borderRadius: radius.pill,
    backgroundColor: '#F2E6DA',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  statusPillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  mapCard: {
    marginTop: spacing.lg,
    height: 164,
    borderRadius: radius.lg,
    backgroundColor: '#F5EEE6',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  mapBadgeText: {
    color: colors.primary,
    fontWeight: '700',
  },
  routeLine: {
    width: 5,
    height: 86,
    borderRadius: radius.pill,
    backgroundColor: '#D3B79A',
  },
  routeDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  routeDotTop: {
    top: 40,
  },
  routeDotMid: {
    top: 74,
  },
  routeDotBottom: {
    top: 108,
  },
  timelineCard: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    //height: 164,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D8CCC1',
    marginRight: spacing.md,
  },
  stepDotDone: {
    backgroundColor: colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  stepTime: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
  },
  stepChip: {
    borderRadius: radius.pill,
    backgroundColor: '#E8DED4',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  stepChipDone: {
    backgroundColor: '#EEE1D2',
  },
  stepChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stepChipTextDone: {
    color: colors.primary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9C9BB',
    marginHorizontal: 5,
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.primary,
  },
  title: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  subtitle: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.textMuted,
    // fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  button: {
    marginTop: spacing.xl,
  },
  link: {
    marginTop: spacing.lg,
    textAlign: 'center',
    //paddingHorizontal: spacing.sm,
    color: colors.primarySoft,
    fontWeight: '700',
  },
})

export default Screen3
