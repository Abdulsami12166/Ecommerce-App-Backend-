import React, { useMemo } from 'react'
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import OptimizedImage from '../../components/OptimizedImage'
import ProductCard from '../../components/ProductCard'
import ScreenHeader from '../../components/ScreenHeader'
import { categories, products } from '../../constants/mockData'
import { useAppStore } from '../../context/AppContext'
import { useThemeColors } from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'

const CategoriesScreen = ({ navigation, route }) => {
  const colors = useThemeColors()
  const styles = createStyles(colors)
  const { catalogProducts } = useAppStore()
  const selectedCategory = route.params?.selectedCategory || categories[0]?.title
//function temp(){
//   setInterval(() => {
//     flag++
//   }, interval);
// }
  const visibleProducts = useMemo(() => {
    const sourceProducts = catalogProducts.length ? catalogProducts : products
    return sourceProducts.filter(product=>product.category === selectedCategory)
  }, [catalogProducts, selectedCategory])

  const sourceProducts = catalogProducts.length ? catalogProducts : products

  return (
   <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Categories" onBack={() => navigation.goBack()} />

        {/* category cards on top */}
        <View style={styles.row}>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.title && styles.categoryCardActive,
              ]}
              activeOpacity={0.9}
              onPress={() => navigation.setParams({ selectedCategory: category.title })}
            >
              <OptimizedImage source={{ uri: category.image }} style={styles.categoryImage} width={520} />
              <View style={styles.categoryOverlay} />
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                <Text style={styles.categoryMeta}>
                  {sourceProducts.filter(product => product.category === category.title).length} products
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{selectedCategory}</Text>
        <Text style={styles.sectionSubtitle}>Tap any product to open details page.</Text>
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

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '100%',
    height: 172,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    // borderWidth: 1,
    // borderColor: colors.border,
    //  shadowColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  categoryCardActive: {
    borderWidth: 2,
    borderColor: colors.accent,
    //backgroundColor: 'red',
    // shadowColor: '#000000',
    // shadowOpacity: 0.06,
    // shadowRadius: 16,
    // shadowOffset: { width: 0, height: 8 },
    // elevation: 4,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 20, 15, 0.28)',
  },
  categoryContent: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  categoryTitle: { color: colors.surface, fontSize: 24, fontWeight: '800' },
  categorySubtitle: { marginTop: 6, color: '#F6E9DD' },
  categoryMeta: { marginTop: 8, color: '#F3D8BE', fontWeight: '700' },
  sectionTitle: {
    marginTop: spacing.lg,
    color: colors.text,
    // backgroundColor: 'red',
    // padding: spacing.sm,
    // fontWeight: '800',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: 6,
    marginBottom: spacing.md,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
})

export default CategoriesScreen
