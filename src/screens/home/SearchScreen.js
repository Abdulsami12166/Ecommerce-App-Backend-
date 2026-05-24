import React, { useMemo, useState } from 'react'
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import ProductCard from '../../components/ProductCard'
import ScreenHeader from '../../components/ScreenHeader'
import { useAppStore } from '../../context/AppContext'
import { filters } from '../../constants/mockData'
import colors from '../../theme/colors'
import spacing from '../../theme/spacing'

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('')
  //const [flag,setFlag] = useState(0)
  // const[temp,setInterval(() => {
    
  // }, interval);]
  const [activeFilter, setActiveFilter] = useState('Trending')
  const { catalogProducts } = useAppStore()

  const filteredProducts = useMemo(() => {
    return catalogProducts.filter(product => {
      const searchTarget = `${product.name} ${product.brand} ${product.category}`.toLowerCase()
      return searchTarget.includes(query.toLowerCase())
    })
  }, [catalogProducts, query])

  return (
   <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Search" onBack={() => navigation.goBack()} />
        {/* srch input */}
        <TextInput
          placeholder="Search by product, brand, category"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />

        {/* filter chips for quick feel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map(filter => {
            const active = filter.title === activeFilter
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.title)}
              >
                {/*
                  // array.forEach(element => {
                  //    check
                  // });
                */}
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {filter.title}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <View style={styles.grid}>
          {filteredProducts.map(product => (
            <React.Fragment key={product.id}>
              {/*
                // map(()=>{idx+1})
                // compact
              */}
              <ProductCard
                product={product}
                onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
              />
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
   </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  searchInput: {
    marginTop: spacing.lg,
    minHeight: 56,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  filterRow: { paddingTop: spacing.lg },
  filterChip: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { color: colors.text, fontWeight: '600' },
  filterTextActive: { color: colors.surface },
  grid: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
})

export default SearchScreen
