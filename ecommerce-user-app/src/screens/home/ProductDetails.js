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
import { normalizeProduct, productApi } from '../../services/api'
import { useThemeColors } from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'
import { formatCurrency } from '../../utils/helpers'

const ProductDetails = ({ navigation, route }) => {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
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
    openSupportChatForProduct,
  } = useAppStore()

  const product = useMemo(() => {
    return (
      catalogProducts.find(item => item.id === route.params?.productId) ||
      remoteProduct
    )
  }, [catalogProducts, remoteProduct, route.params?.productId])

  const variants = useMemo(() => Array.isArray(product?.variants) ? product.variants : [], [product?.variants])
  const selectedVariant = useMemo(
    () => variants.find(variant => String(variant._id || variant.id || variant.sku) === selectedVariantId) || variants[0] || null,
    [selectedVariantId, variants],
  )
  const effectiveProduct = useMemo(() => ({
    ...product,
    price: selectedVariant?.price ?? product?.price,
    stock: selectedVariant?.stock ?? product?.stock ?? 0,
    sku: selectedVariant?.sku || product?.inventory?.sku || '',
    image: selectedVariant?.images?.[0] || product?.image,
    variantId: selectedVariant?._id || selectedVariant?.id || '',
  }), [product, selectedVariant])
  const specificationEntries = useMemo(() => {
    const values = {
      ...(product?.attributes || {}),
      ...(product?.specifications || {}),
      ...(selectedVariant?.attributes || {}),
    }
    return Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== '')
  }, [product?.attributes, product?.specifications, selectedVariant?.attributes])

  useEffect(() => {
    const firstVariant = variants[0]
    setSelectedVariantId(firstVariant ? String(firstVariant._id || firstVariant.id || firstVariant.sku || '') : '')
  }, [product?.id, variants])

  useEffect(() => {
    const productId = route.params?.productId
    setRemoteProduct(null)

    if (!productId) {
      return
    }

    const hasCatalogProduct = catalogProducts.some(
      item => String(item.id) === String(productId) || String(item._id || item.id) === String(productId),
    )

    if (hasCatalogProduct) {
      return
    }

    let isMounted = true
    productApi
      .getProductById(productId)
      .then(response => {
        if (!isMounted) {
          return
        }

        const nextProduct = response.data?.data?.product
        if (nextProduct) {
          setRemoteProduct(normalizeProduct(nextProduct))
        }
      })
      .catch(() => {
        if (isMounted) {
          setRemoteProduct(null)
        }
      })

    return () => {
      isMounted = false
    }
  }, [catalogProducts, route.params?.productId])

  const supportsSize = useMemo(() => {
    const category = String(product?.category || '').toLowerCase()
    const name = String(product?.name || '').toLowerCase()

    // Only Fashion should show clothing sizes.
    // We prefer category-based checks to avoid false positives.
    const categoryIsFashion = category.includes('fashion') || category === 'fashion'

    // Some catalogs may store fashion variants under category names
    // like "Men", "Women", etc. If category matches common fashion buckets,
    // treat it as fashion.
    const fashionBuckets = [
      'men',
      'women',
      'kids',
      'footwear',
      'casual',
      'formal',
    ]

    const nameLooksLikeClothing = [
      'jacket',
      'coat',
      'dress',
      'shirt',
      'blazer',
      'wear',
      'jean',
      'trouser',
      'hoodie',
      'sweater',
      'kurta',
      'saree',
      'top',
      'pant',
      'skirt',
    ].some(k => name.includes(k))

    const categoryLooksLikeFashion = fashionBuckets.some(b => category === b || category.includes(b))

    return categoryIsFashion || categoryLooksLikeFashion || nameLooksLikeClothing
  }, [product?.category, product?.name])

  const getSizeOptions = (currentProduct, currentVariant) => {
    const sizesFromProduct = Array.isArray(currentProduct?.sizes) ? currentProduct.sizes : []

    // common sizes fields could also live on attributes / variant attributes
    const sizesFromVariantAttr = currentVariant?.attributes?.size || currentVariant?.attributes?.sizes
    const normalizedVariantSizes = (() => {
      if (Array.isArray(sizesFromVariantAttr)) {
        return sizesFromVariantAttr.map(s => String(s).trim()).filter(Boolean)
      }
      if (typeof sizesFromVariantAttr === 'string') {
        return sizesFromVariantAttr.split(',').map(s => s.trim()).filter(Boolean)
      }
      return []
    })()

    // fallback: sometimes variant.value itself is the size (e.g., "M", "L", "40")
    const candidate = [
      ...sizesFromProduct,
      ...normalizedVariantSizes,
      ...(sizesFromProduct.length ? [] : (String(currentVariant?.value || '').trim() ? [String(currentVariant.value).trim()] : [])),
    ]

    const unique = Array.from(new Set(candidate.map(s => String(s).trim()).filter(Boolean)))
    return unique
  }


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

    if (effectiveProduct.stock <= 0) {
      Alert.alert('Out of stock', 'This selection is currently unavailable.')
      return
    }

    // If fashion supports size, prefer the user-selected size.
    // Otherwise, keep using the selected variant label.
    const selectionLabel = supportsSize
      ? (selectedSize || selectedVariant?.value || selectedVariant?.name || 'M')
      : (selectedVariant?.value || selectedVariant?.name || 'Default')

    addProductToCart(effectiveProduct, selectionLabel)
    navigation.navigate('Cart')
  }


  const handleOpenSupport = () => {
    const chatId = openSupportChatForProduct(product)
    navigation.navigate('SupportChat', { chatId, productId: product.id })
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
          <OptimizedImage source={{ uri: effectiveProduct.image }} style={styles.heroImage} width={900} />
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
            <Text style={styles.price}>{formatCurrency(effectiveProduct.price)}</Text>
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
            {product.description || 'Product details are being updated.'}
          </Text>

          {variants.length ? (
            variants.some(v => v.attributes?.color) ? (
              <>
                <Text style={styles.sectionTitle}>Choose Color</Text>
                <View style={styles.colorRow}>
                  {variants.map(variant => {
                    const id = String(variant._id || variant.id || variant.sku || `${variant.name}-${variant.value}`)
                    const active = id === String(selectedVariant?._id || selectedVariant?.id || selectedVariant?.sku || '')
                    const colorVal = variant.attributes?.color;
                    if (!colorVal) return null;
                    return (
                      <TouchableOpacity
                        key={id}
                        disabled={(variant.stock ?? 0) <= 0}
                        style={[
                          styles.colorDot,
                          { backgroundColor: String(colorVal) },
                          active && styles.colorActive,
                          (variant.stock ?? 0) <= 0 && { opacity: 0.35 }
                        ]}
                        onPress={() => {
                          setSelectedVariantId(id)
                          // reset size selection when user changes variant
                          setSelectedSize('')
                        }}
                      />
                    )
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Choose Variant</Text>
                <View style={styles.variantGrid}>
                  {variants.map(variant => {
                    const id = String(variant._id || variant.id || variant.sku || `${variant.name}-${variant.value}`)
                    const active = id === String(selectedVariant?._id || selectedVariant?.id || selectedVariant?.sku || '')
                    return (
                      <TouchableOpacity
                        key={id}
                        disabled={(variant.stock ?? 0) <= 0}
                        style={[styles.variantCard, active && styles.variantCardActive, (variant.stock ?? 0) <= 0 && styles.variantCardDisabled]}
                        onPress={() => {
                          setSelectedVariantId(id)
                          // reset size selection when user changes variant
                          setSelectedSize('')
                        }}>
                        <View style={styles.variantTitleRow}>
                          {variant.attributes?.color ? (
                            <View style={[styles.variantColor, {backgroundColor: String(variant.attributes.color)}]} />
                          ) : null}
                          <Text style={[styles.variantTitle, active && styles.variantTitleActive]}>{variant.value || variant.name || 'Default'}</Text>
                        </View>
                        <Text style={[styles.variantMeta, active && styles.variantMetaActive]}>{formatCurrency(variant.price ?? product.price)} | Stock {variant.stock ?? 0}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </>
            )
          ) : null}

          {supportsSize ? (
            <>
              <Text style={styles.sectionTitle}>Choose Size</Text>
              <View style={styles.sizeGrid}>
                {getSizeOptions(product, selectedVariant).map(size => {
                  const active = size === selectedSize
                  return (
                    <TouchableOpacity
                      key={size}
                      style={[styles.sizeCard, active && styles.sizeCardActive]}
                      onPress={() => setSelectedSize(size)}
                    >
                      <Text style={[styles.sizeText, active && styles.sizeTextActive]}>{size}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>
          ) : null}


          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Availability</Text>
            <Text style={[styles.stockValue, effectiveProduct.stock <= 0 && styles.stockValueEmpty]}>
              {effectiveProduct.stock > 0 ? `${effectiveProduct.stock} in stock` : 'Out of stock'}
            </Text>
          </View>

          {specificationEntries.length ? (
            <>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <View style={styles.specificationCard}>
                {specificationEntries.map(([key, value]) => (
                  <View style={styles.specificationRow} key={key}>
                    <Text style={styles.specificationLabel}>{String(key).replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase())}</Text>
                    <Text style={styles.specificationValue}>{Array.isArray(value) ? value.join(', ') : String(value)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

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
          <CustomButton
            title="SMS Support For This Product"
            onPress={handleOpenSupport}
            variant="secondary"
          />
        </View>
      </ScrollView>
   </SafeAreaView>
  )
}

const createStyles = colors => StyleSheet.create({
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
    backgroundColor: colors.surface,
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
  variantGrid: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  variantCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  variantCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  variantCardDisabled: {
    opacity: 0.45,
  },
  variantTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  variantTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  variantColor: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  variantTitleActive: {
    color: colors.surface,
  },
  variantMeta: {
    marginTop: 4,
    color: colors.textMuted,
  },
  variantMetaActive: {
    color: colors.surface,
  },
  sizeGrid: {
    marginTop: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sizeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  sizeText: {
    color: colors.text,
    fontWeight: '800',
  },
  sizeTextActive: {
    color: colors.surface,
  },

  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stockLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  stockValue: {
    color: colors.success,
    fontWeight: '800',
  },
  stockValueEmpty: {
    color: colors.danger,
  },
  specificationCard: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  specificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specificationLabel: {
    flex: 1,
    color: colors.textMuted,
    fontWeight: '700',
  },
  specificationValue: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'right',
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
