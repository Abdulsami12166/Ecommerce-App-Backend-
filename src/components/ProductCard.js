import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OptimizedImage from './OptimizedImage';
import { useAppStore } from '../context/AppContext';
import { useThemeColors } from '../theme/colors';
import spacing, { radius } from '../theme/spacing';
import { formatCurrency } from '../utils/helpers';

const ProductCard = ({ product, onPress, compact = false }) => {
  const { wishlistIds, toggleWishlist } = useAppStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const isWishlisted = wishlistIds.includes(product.id);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <OptimizedImage source={{ uri: product.image }} style={styles.image} width={420} />
      <TouchableOpacity
        style={[styles.wishlistButton, isWishlisted && styles.wishlistButtonActive]}
        onPress={() => toggleWishlist(product.id, product.name)}
      >
        <Text style={[styles.wishlistText, isWishlisted && styles.wishlistTextActive]}>
          {isWishlisted ? 'Saved' : 'Save'}
        </Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <View style={styles.row}>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          <Text style={styles.rating}>{product.rating} *</Text>
        </View>
      </View>
    </Pressable>
  );
};

const createStyles = colors => StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  cardCompact: {
    width: '48%',
    marginRight: 0,
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: colors.surfaceMuted,
  },
  wishlistButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  wishlistButtonActive: {
    backgroundColor: colors.primary,
  },
  wishlistText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  wishlistTextActive: {
    color: colors.surface,
  },
  content: {
    padding: spacing.md,
  },
  brand: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    minHeight: 40,
  },
  row: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  rating: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default memo(ProductCard);
