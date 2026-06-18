import React from 'react'
import {
  Image,
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
//this is data for demo
const recommendations = [
  {
    id: 'rec-1',
    title: 'Brown Winter Jacket',
      price: '$120',
    image:
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'rec-2',
    title: 'Elegant Long Coat',
    price: '$136',
      image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
  },
]

const ProgressDots = () => (
  <View style={styles.dotsRow}>
    <View style={styles.dot} />
    {/* <view>hello</view> */}
    <View style={[styles.dot, styles.dotActive]} />
    <View style={styles.dot} />
  </View>
)

const Screen2 = ({ navigation }) => {
  return (
   <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />

      <View style={styles.topBar}>
        {/* <View>
          map(step => (
            <view key={step.id}>
              <text>{step.label}</text>)
        </View> */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.mockPhone}>
        <View style={styles.mockHeader}>
          <View>
            <Text style={styles.mockGreeting}>Hello Sami</Text>
            <Text style={styles.mockSubheading}>Discover what suits you today</Text>
          </View>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>O</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchText}>Search jackets, dresses, bags...</Text>
        </View>

        {/* just mock home ui */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredCopy}>
            <Text style={styles.featuredLabel}>Featured</Text>
            <Text style={styles.featuredTitle}>New autumn edit</Text>
            <Text style={styles.featuredOffer}>Up to 40% off</Text>
          </View>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80',
            }}
            style={styles.featuredImage}
          />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recommended</Text>
          <Text style={styles.sectionAction}>See all</Text>
        </View>

        <View style={styles.recommendationRow}>
          {recommendations.map(item => (
            <View key={item.id} style={styles.productCard}>
              <Image source={{ uri: item.image }} style={styles.productImage} />
              <Text style={styles.productTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.productPrice}>{item.price}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomTabs}>
          <View style={[styles.bottomTab, styles.bottomTabActive]} />
          <View style={styles.bottomTab} />
          <View style={styles.bottomTab} />
          <View style={styles.bottomTab} />
        </View>
      </View>

      <ProgressDots />

      <Text style={styles.title}>Shop through a</Text>
      <Text style={styles.title}>smarter home feed</Text>

      <Text style={styles.subtitle}>
        Get featured collections, better recs and cleaner browsing from first tap.
      </Text>

      <CustomButton
        title="Next"
        onPress={() => navigation.navigate('Screen3')}
        style={styles.button}
      />
   </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',

    // backgroundColor: 'red',
    // marginBottom: spacing.lg,
    alignItems: 'center',
  },
  back: {
    color: colors.primary,
    fontWeight: '700',
  },
  skip: {
    color: colors.primarySoft,
    fontWeight: '700',
  },
  mockPhone: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    width: '92%',
    borderRadius: 34,
    backgroundColor: colors.surface,
    padding: spacing.md,
    // height: 400,
    // backgroundColor: 'red',
    // height: 400,
    // justifyContent: 'center',
    // alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // backgroundColor: 'red',
    // padding: spacing.md,
    // marginBottom: spacing.lg,
    alignItems: 'center',
  },
  mockGreeting: {
    color: colors.text,
    //paddingHorizontal: spacing.sm,
    //marginBottom: spacing.sm,
    fontSize: 18,
    fontWeight: '800',
  },
  mockSubheading: {
    marginTop: 4,
    color: colors.textMuted,
    //marginBottom: spacing.sm,
    fontSize: 12,
  },
  avatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    // padding: 10,
    // backgroundColor: 'red',
    // marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontWeight: '800',
  },
  searchBar: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    //padding: spacing.sm,
    // backgroundColor: 'red',
    // height: 40,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  featuredCard: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    //textAlign: 'center',
      // height: 164,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  featuredLabel: {
    color: '#E8D5C4',
    fontSize: 12,
    //color: colors.textMuted,
    //marginBottom: spacing.sm,
    fontWeight: '700',
  },
  featuredTitle: {
    marginTop: 6,
    color: colors.surface,
    fontSize: 20,
    fontWeight: '800',
  },
  featuredOffer: {
    marginTop: 6,
    color: '#F4E8DC',
    fontWeight: '600',
  },
  featuredImage: {
    width: 92,
    height: 118,
    borderRadius: radius.md,
  },
  sectionRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    // backgroundColor: 'red',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  sectionAction: {
    color: colors.primarySoft,
    //marginRight: spacing.sm,
    // backgroundColor: 'red',
      
    fontSize: 12,
    fontWeight: '700',
  },
  recommendationRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48.5%',
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.sm,
    // height: 220,
       // backgroundColor: 'red',
       // height: 220,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: '100%',
    height: 110,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  productTitle: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  productPrice: {
    marginTop: 4,
    color: colors.primary,
    fontWeight: '800',
  },
  bottomTabs: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomTab: {
    width: '21%',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: '#DCCFC3',
  },
  bottomTabActive: {
    backgroundColor: colors.primary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    //marginBottom: spacing.lg,
    // backgroundColor: 'red',
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
     //marginBottom: spacing.lg,
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  button: {
    marginTop: spacing.xl,
  },
})

export default Screen2
