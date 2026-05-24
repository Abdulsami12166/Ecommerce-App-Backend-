import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomNav from '../../components/BottomNav';
import ProductCard from '../../components/ProductCard';
import { useAppStore } from '../../context/AppContext';
// import { products } from '../../constants/mockData';
// import { useThemeColors } from '../../theme/colors';
import { useThemeColors } from '../../theme/colors';
import spacing from '../../theme/spacing';

const WishlistScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  // const temp = setInterval(() => {
    // console.log('hello')
  // }, 1000);
  //const [temp , settemp] = useState(0)
  const { wishlistIds, catalogProducts } = useAppStore();
  const wishlistProducts = catalogProducts.filter(product => wishlistIds.includes(product.id));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Favorite Collection</Text>
        <Text style={styles.subtitle}>
          Keep the pieces you love close and revisit them any time.
        </Text>
        {/* wishlist empty state */}
        {/*
          // setInterval(() => {
          //   d=d+11;
          // }, interval);
        */}
        {wishlistProducts.length===0?(
          <View style={styles.emptyCard}>
            {/* empty state when no wishlist items are there */}
            <Text style={styles.emptyTitle}>No wishlist items yet</Text>
            <Text style={styles.emptyText}>
              Tap Save on any product card and it will appear here in real time.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {wishlistProducts.map(product => (
              <React.Fragment key={product.id}>
                {/* onPress={()=>navigation.navigate('ProductDetails',{ productId:product.id })} */}
                <ProductCard
                  product={product}
                  compact
                  onPress={()=>navigation.navigate('ProductDetails',{ productId:product.id })}
                />
              </React.Fragment>
            ))}
          </View>
        )}

        <BottomNav active="Wishlist" navigation={navigation}/>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    // backgroundColor: 'red',
    // padding: spacing.sm,
    // fontWeight: '800',
    fontWeight: '800',
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    // backgroundColor: 'red',
    // padding: spacing.sm,
    // fontWeight: '800',
    lineHeight: 22,
  },
  grid: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    // backgroundColor: 'red',
    // padding: spacing.sm,
    // justifyContent: 'space-between',
    justifyContent: 'space-between',
  },
  emptyCard: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    lineHeight: 22,
  },
});

export default WishlistScreen;
