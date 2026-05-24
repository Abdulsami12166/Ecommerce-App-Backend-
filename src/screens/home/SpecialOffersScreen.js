import React from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import ProductCard from '../../components/ProductCard'
import ScreenHeader from '../../components/ScreenHeader'
import { products } from '../../constants/mockData'
import { useAppStore } from '../../context/AppContext'
import colors from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'
const SpecialOffersScreen = ({ navigation }) => {
  const { catalogProducts } = useAppStore()
  const visibleProducts = catalogProducts.length ? catalogProducts : products
  // const temp = setInterval(() => {
  //   console.log('hello')
  // }, 1000);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Special Offers" onBack={() => navigation.goBack()} />

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Limited Time</Text>
          {/* // <view>
          //   setInterval(() => {
          //     <Text>hello</Text>
          //   }, interval);
          // </view>     */}
          <Text style={styles.heroTitle}>Extra 30% off selected styles</Text>
          <Text style={styles.heroText}>
            Use seasonal discount on jackets, dresses and premium accessories.
          </Text>
        </View>

        {/* offer items list */}
        <View style={styles.grid}>
          {visibleProducts.map(product => (
            <ProductCard
              key={product.id}
              compact
              product={product}
              onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
            />
          ))}
        </View>
      </ScrollView>
   </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  // row: { flexDirection: 'row', alignItems: 'center' },
  // heroCard: {
  //   marginTop: spacing.xl,
  //   padding: spacing.xl,
  //   borderRadius: radius.lg,
  //   backgroundColor: colors.primary,
  // },
  // heroLabel: {
  //   color: '#DCC4AC',
  //   fontSize: 12,
  //   fontWeight: '700',
  //   letterSpacing: 0.5,
  heroCard: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  heroLabel: {
    color: '#DCC4AC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    marginTop: spacing.sm,
    color: colors.surface,
    fontSize: 26,
    fontWeight: '800',
  },
  heroText: {
    marginTop: spacing.sm,
    color: '#EFE1D6',
    lineHeight: 22,
  },
  grid: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    
    justifyContent: 'space-between',
  },
})

export default SpecialOffersScreen
