import React, { useMemo } from 'react'
import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import BottomNav from '../../components/BottomNav'
import ProductCard from '../../components/ProductCard'
import { useAppStore } from '../../context/AppContext'
import { heroCards, orders } from '../../constants/mockData'
import { useThemeColors } from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'

const HomeScreen = ({ navigation }) => {
  const colors = useThemeColors()
  const styles = createStyles(colors)
  const {
    cartCount,
    latestActivity,
    wishlistIds,
    currentUser,
    catalogProducts,
  } = useAppStore()
  const featuredProducts = useMemo(() => catalogProducts.slice(0, 3), [catalogProducts])
  const topCategories = useMemo(() => {
    const uniqueCategories = []

    catalogProducts.forEach(product => {
      if (product.category && !uniqueCategories.includes(product.category)) {
        uniqueCategories.push(product.category)
      }
    })

    return uniqueCategories.slice(0, 4).map((title, index) => ({
      id: `cat-${index + 1}`,
      title,
    }))
  }, [catalogProducts])
  const currentOrder = useMemo(() => orders.find(order => order.statusGroup === 'current') || orders[0], [])

  return (
   <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      >
        <View style={styles.topRow}>
          <View style={styles.menuButton}>
            <Text style={styles.menuIcon}>=</Text>
          </View>

          <View style={styles.topCenter}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.name}>{currentUser?.name || 'Fashion Explorer'}</Text>
          </View>

          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => navigation.navigate('Profile')}
          >
            <Image
              source={{
                uri:
                  currentUser?.avatar ||
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
              }}
              style={styles.avatar}
            />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search by outfit, color or brand"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            onFocus={() => navigation.navigate('Search')}
          />
          <TouchableOpacity
            style={styles.searchFilter}
            onPress={() => navigation.navigate('Categories')}
          >
            <Text style={styles.searchFilterText}>+</Text>
          </TouchableOpacity>
        </View>

        {latestActivity ? (
          <View style={styles.activityCard}>
            <Text style={styles.activityLabel}>Store activity</Text>
            <Text style={styles.activityText}>{latestActivity.message}</Text>
          </View>
        ) : null}

        {/* main promo card */}
        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.featuredCard}
          onPress={() => navigation.navigate('SpecialOffers')}
        >
          <View style={styles.featuredCopy}>
            <Text style={styles.featuredLabel}>Premium Collection</Text>
            <Text style={styles.featuredTitle}>Fresh arrivals for your signature look</Text>
            <Text style={styles.featuredSubtitle}>Elegant layers, rich texture, warm neutral tones</Text>
          </View>
          <Image
            source={{ uri: heroCards[0].image }}
            style={styles.featuredImage}
          />
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{wishlistIds.length}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>24h</Text>
            <Text style={styles.statLabel}>Express</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.sectionLink} onPress={() => navigation.navigate('Categories')}>
            See all
          </Text>
        </View>

        <View style={styles.categoryRow}>
          {topCategories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryChip}
              onPress={() =>
                navigation.navigate('Categories', { selectedCategory: category.title })
              }
            >
              <Text style={styles.categoryText}>{category.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top picks for you</Text>
          <Text style={styles.sectionLink} onPress={() => navigation.navigate('Search')}>
            More
          </Text>
        </View>

        {/* keep few products on home only */}
        <FlatList
          data={featuredProducts}
          horizontal
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
            />
          )}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={3}
          removeClippedSubviews
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>Products are loading from the store.</Text>}
        />

        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.orderCard}
          onPress={() => navigation.navigate('TrackOrder', { orderId: currentOrder.id })}
        >
          <View>
            <Text style={styles.orderLabel}>Current delivery</Text>
            <Text style={styles.orderTitle}>{currentOrder.trackingTitle}</Text>
            <Text style={styles.orderSubtitle}>{currentOrder.eta}</Text>
          </View>
          <View style={styles.orderRoute}>
            <View style={[styles.routeDot, styles.routeDotFilled]} />
            <View style={styles.routeLine} />
            {/* <view>
              setTimeout(() => {
                  <Text>hello</Text>
              }, timeout);
            </view> */}
            <View style={[styles.routeDot, styles.routeDotFilled]} />
            <View style={styles.routeLine} />
            <View style={styles.routeDot} />
          </View>
        </TouchableOpacity>

        <BottomNav active="Home" navigation={navigation} />
      </ScrollView>
   </SafeAreaView>
  )
}

const createStyles = colors => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    //marginBottom: spacing.md,
    
    //flexDirection: 'row',
    //alignItems: 'center',

    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  topCenter: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  greeting: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    //flexDirection: 'row',
    //alignItems: 'center',
    // backgroundColor: 'red',
    letterSpacing: 0.8,
  },
  name: {
    marginTop: 4,
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cartBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  cartBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  searchInput: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  searchFilter: {
    width: 56,
    height: 56,
    marginLeft: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchFilterText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '700',
  },
  activityCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#F3E8DE',
    borderWidth: 1,
    borderColor: '#E2D2C4',
  },
  activityLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activityText: {
    marginTop: 6,
    color: colors.text,
    fontWeight: '700',
  },
  featuredCard: {
    marginTop: spacing.lg,
    borderRadius: 30,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  featuredLabel: {
    color: '#DFC9B6',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  featuredTitle: {
    marginTop: 8,
    color: colors.surface,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  featuredSubtitle: {
    marginTop: 8,
    color: '#F1E2D5',
    lineHeight: 20,
  },
  featuredImage: {
    width: 104,
    height: 146,
    borderRadius: radius.lg,
  },
  statsRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '31%',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionLink: {
    color: colors.primarySoft,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryChip: {
    width: '23%',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  categoryText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
  orderCard: {
    marginTop: spacing.xl,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderTitle: {
    marginTop: 8,
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  orderSubtitle: {
    marginTop: 6,
    color: colors.textMuted,
    lineHeight: 20,
    maxWidth: 180,
  },
  orderRoute: {
    alignItems: 'center',
  },
  routeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  routeDotFilled: {
    backgroundColor: colors.primary,
  },
  routeLine: {
    width: 3,
    height: 20,
    backgroundColor: '#D3BAA5',
  },
})

export default HomeScreen
