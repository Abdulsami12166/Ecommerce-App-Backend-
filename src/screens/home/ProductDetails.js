import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import CustomButton from '../../components/CustomButton'
import OptimizedImage from '../../components/OptimizedImage'
import { useAppStore } from '../../context/AppContext'
import { productColors, sizes } from '../../constants/mockData'
import { normalizeProduct, productApi } from '../../services/api'
import colors from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'
import { formatCurrency } from '../../utils/helpers'

const ProductDetails = ({ navigation, route }) => {
  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedColor, setSelectedColor] = useState(productColors[0])
  const [reviewName, setReviewName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [remoteProduct, setRemoteProduct] = useState(null)
  const {
    cartCount,
    catalogProducts,
    addProductToCart,
    wishlistIds,
    toggleWishlist,
    reviewsByProduct,
    addReview,
  } = useAppStore()

  const product = useMemo(() => {
    return (
      catalogProducts.find(item => item.id === route.params?.productId) ||
      remoteProduct
    )
  }, [catalogProducts, remoteProduct, route.params?.productId])

  useEffect(() => {
    if (!route.params?.productId) {
      setRemoteProduct(null)
      return
    }

    if (catalogProducts.some(item => item.id === route.params?.productId)) {
      return
    }

    productApi
      .getProductById(route.params?.productId)
      .then(response => {
        const nextProduct = response.data?.data?.product
        if (nextProduct) {
          setRemoteProduct(normalizeProduct(nextProduct))
        }
      })
      .catch(() => {
        setRemoteProduct(null)
      })
  }, [catalogProducts, route.params?.productId])

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading the selected product...</Text>
          <CustomButton
            title="Back to products"
            onPress={() => navigation.goBack()}
            style={styles.loadingButton}
          />
        </View>
      </SafeAreaView>
    )
  }

  const handleAddToCart = () => {
    if (!/^[a-f\d]{24}$/i.test(product.id)) {
      Alert.alert(
        'Product still syncing',
        'This item is not ready for checkout yet. Please wait for live catalog data and try again.',
      )
      return
    }

    addProductToCart(product, selectedSize)
    navigation.navigate('Cart')
  }

  const isWishlisted = wishlistIds.includes(product.id)
  const productReviews = reviewsByProduct[product.id] || []
  const averageRating = productReviews.length
    ? (
      productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
    ).toFixed(1)
    : '0.0'

  const handleReviewSubmit = () => {
    if (!reviewText.trim()) {
      Alert.alert('Review required', 'Please write a few words about this product.')
      return
    }

    addReview(product.id, {
      name: reviewName,
      rating: reviewRating,
      text: reviewText,
      productName: product.name,
    })
    setReviewName('')
    setReviewText('')
    setReviewRating(5)
    Alert.alert('Review added', 'Your review has been posted successfully.')
  }

  return (
   <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} removeClippedSubviews>
        <View style={styles.imageWrap}>
          <OptimizedImage source={{ uri: product.image }} style={styles.heroImage} width={900} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.cartText}>{cartCount}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.topMeta}>
            <View>
              <Text style={styles.brand}>{product.brand}</Text>
              <Text style={styles.title}>{product.name}</Text>
            </View>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isWishlisted && styles.saveButtonActive]}
            onPress={() => toggleWishlist(product.id, product.name)}
          >
            <Text style={[styles.saveButtonText, isWishlisted && styles.saveButtonTextActive]}>
              {isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.description}>
            A premium shape with soft lining, relaxed fitting and warm shades for all seasons.
          </Text>

          <Text style={styles.sectionTitle}>Choose Size</Text>
          <View style={styles.choiceRow}>
            {sizes.map(size => {
              const active = size === selectedSize;
              return (
                <TouchableOpacity
                  key={size}
                  style={[styles.choiceChip, active && styles.choiceChipActive]}
                  onPress={() => setSelectedSize(size)}
                >
                  <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={styles.sectionTitle}>Colors</Text>
          <View style={styles.colorRow}>
            {productColors.map(color => {
              const active = color === selectedColor;
              return (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorDot, { backgroundColor: color }, active && styles.colorActive]}
                  onPress={() => setSelectedColor(color)}
                />
              )
            })}
          </View>

          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <Text style={styles.reviewScore}>{averageRating} / 5</Text>
          </View>

          <View style={styles.reviewForm}>
            <Text style={styles.reviewFormTitle}>Write a Review</Text>

            {/* name can stay empty also */}
            <TextInput
              placeholder="Your name (optional)"
              placeholderTextColor={colors.textMuted}
              value={reviewName}
              onChangeText={setReviewName}
              style={styles.reviewInput}
            />

            <View style={styles.ratingPicker}>
              {[1, 2, 3, 4, 5].map(star => {
                const active = star <= reviewRating;
                return (
                  <TouchableOpacity
                    key={star}
                    style={styles.ratingButton}
                    onPress={() => setReviewRating(star)}
                  >
                    <Text style={[styles.ratingButtonText, active && styles.ratingButtonTextActive]}>
                      *
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <TextInput
              placeholder="Share your experience with this product"
              placeholderTextColor={colors.textMuted}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              textAlignVertical="top"
              style={[styles.reviewInput, styles.reviewTextArea]}
            />

            <CustomButton title="Submit Review" onPress={handleReviewSubmit} style={styles.reviewSubmit} />
          </View>

          {productReviews.map(review => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewAvatar}>
                <Text style={styles.reviewAvatarText}>{review.name.charAt(0)}</Text>
              </View>
              <View style={styles.reviewBody}>
                <Text style={styles.reviewName}>{review.name}</Text>
                <Text style={styles.reviewRating}>{'*'.repeat(review.rating)}</Text>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            </View>
          ))}

          <CustomButton
            title="Add to Cart"
            onPress={handleAddToCart}
            style={styles.cta}
          />
        </View>
      </ScrollView>
   </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingButton: {
    marginTop: spacing.lg,
    minWidth: 180,
  },
  imageWrap: {
    position: 'relative',
    height: 420,
    backgroundColor: colors.surfaceMuted,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    top: spacing.xl,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  cartButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.xl,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartText: {
    color: colors.surface,
    fontWeight: '700',
  },
  content: {
    marginTop: -24,
    padding: spacing.lg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.background,
  },
  topMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  title: {
    marginTop: 4,
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    maxWidth: 240,
  },
  price: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  saveButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  saveButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  saveButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  saveButtonTextActive: {
    color: colors.surface,
  },
  description: {
    marginTop: spacing.md,
    color: colors.textMuted,
    lineHeight: 22,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  choiceRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  choiceChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  choiceChipActive: {
    backgroundColor: colors.primary,
  },
  choiceText: {
    color: colors.text,
    fontWeight: '700',
  },
  choiceTextActive: {
    color: colors.surface,
  },
  colorRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorActive: {
    borderColor: colors.text,
  },
  reviewHeader: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewScore: {
    color: colors.primary,
    fontWeight: '700',
  },
  reviewForm: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewFormTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  reviewInput: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  reviewTextArea: {
    minHeight: 110,
  },
  ratingPicker: {
    flexDirection: 'row',
    marginVertical: spacing.md,
  },
  ratingButton: {
    marginRight: spacing.sm,
  },
  ratingButtonText: {
    fontSize: 28,
    color: colors.border,
  },
  ratingButtonTextActive: {
    color: colors.star,
  },
  reviewSubmit: {
    marginTop: spacing.md,
  },
  reviewCard: {
    flexDirection: 'row',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reviewAvatarText: {
    color: colors.surface,
    fontWeight: '700',
  },
  reviewBody: {
    flex: 1,
  },
  reviewName: {
    color: colors.text,
    fontWeight: '700',
  },
  reviewRating: {
    marginTop: 2,
    color: colors.star,
  },
  reviewText: {
    marginTop: 6,
    color: colors.textMuted,
    lineHeight: 20,
  },
  cta: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
})

export default ProductDetails
