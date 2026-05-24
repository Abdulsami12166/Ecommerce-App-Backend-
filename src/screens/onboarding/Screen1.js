import React from 'react'
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import CustomButton from '../../components/CustomButton'
import colors from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'

// take width once for collage sizing
const { width } = Dimensions.get('window')

const showcaseImages = [
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
]

const ProgressDots = () => (
  <View style={styles.dotsRow}>
    <View style={[styles.dot, styles.dotActive]} />
    <View style={styles.dot} />
    <View style={styles.dot} />
  </View>
)

const Screen1 = ({ navigation }) => {
  return (
   <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
       <ScrollView
        showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
             <Text style={styles.brand}>Fashion</Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
               <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroBackground} />
          <View style={styles.collage}>
            {/* show imgs here */}
            {showcaseImages.map((image,index) => (
              <Image
                key={image}
                source={{ uri:image }}
                style={[
                  styles.cardImage,
                  //making some imgs tallr
                        //index%2===0 ? styles.cardImageTall:styles.cardImageShort,
                     index%3===1 ? styles.cardImageTall:styles.cardImageShort,
                ]}
              />
            ))}
          </View>

          <View style={[styles.floatingTag, styles.tagTop]}>
            <Text style={styles.tagLabel}>Curated</Text>
            <Text style={styles.tagValue}>120+ looks</Text>
          </View>

          <View style={[styles.floatingTag, styles.tagBottom]}>
            <Text style={styles.tagLabel}>Style Match</Text>
            <Text style={styles.tagValue}>Daily picks</Text>
          </View>
        </View>

        <ProgressDots />

        <Text style={styles.title}>Find your personal</Text>
        <Text style={styles.title}>fashion collection</Text>

        <Text style={styles.description}>
          Explore polished outfits, premium textures and fashion picks for diff moods.
        </Text>

        {/* next intro page */}
        <CustomButton
          title="Next"
          onPress={() => navigation.navigate('Screen2')}
          style={styles.button}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.footerLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
   </SafeAreaView>
  )
}

// basic calc for 3 img cols
const columnWidth = (width-spacing.lg*2-spacing.sm*2)/3

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  brand: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
    // backgroundColor: 'red',
    // padding: spacing.sm,
    // marginBottom: spacing.lg,
  },
  skip: {
    color: colors.primarySoft,
    fontWeight: '700',
    // backgroundColor: 'red',
    // padding: spacing.sm,
    // marginBottom: spacing.lg,
  },
  heroWrap: {
    marginTop: spacing.lg,
    position: 'relative',
    // backgroundColor: 'red',
  },
  heroBackground: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    bottom: 12,
    //height: 400,
    // backgroundColor: 'red',
    borderRadius: 36,
    backgroundColor: '#EDE1D5',
  },
  collage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
      // backgroundColor: 'red',
      // height: 400,
      
    paddingVertical: spacing.lg,
  },
  cardImage: {
    width: columnWidth,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  cardImageTall: {
    height: 168,
  },
  cardImageShort: {
    height: 128,
  },
  floatingTag: {
    position: 'absolute',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    //padding: spacing.sm,
    //width: 140,
    // backgroundColor: 'red',
    
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  tagTop: {
    top: 28,
    right: spacing.md,
  },
  tagBottom: {
    left: spacing.md,
    bottom: 28,
  },
  tagLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tagValue: {
    marginTop: 2,
    color: colors.primary,
    fontWeight: '800',
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
  description: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  button: {
    marginTop: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textMuted,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '700',
  },
})

export default Screen1
