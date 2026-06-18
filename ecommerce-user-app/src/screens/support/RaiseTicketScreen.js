import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { ticketApi } from '../../services/api';
import { useAppStore } from '../../context/AppContext';

const TICKET_CATEGORIES = [
  { id: 'delivery', label: 'Delivery Issue', icon: '📦' },
  { id: 'product_quality', label: 'Product Quality', icon: '⭐' },
  { id: 'wrong_item', label: 'Wrong Item Received', icon: '❌' },
  { id: 'damaged', label: 'Item Damaged', icon: '💔' },
  { id: 'refund', label: 'Refund Inquiry', icon: '💰' },
  { id: 'payment', label: 'Payment Issue', icon: '💳' },
  { id: 'account', label: 'Account Support', icon: '👤' },
  { id: 'other', label: 'Other', icon: '❓' },
];

const RaiseTicketScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { authToken } = useAppStore();

  // Support pre-filling from product/order context
  const prefillProductId = route.params?.productId || null;
  const prefillProductName = route.params?.productName || null;
  const prefillOrderId = route.params?.orderId || null;
  const prefillOrderCode = route.params?.orderCode || null;
  const prefillCategory = route.params?.category || null;
  const prefillSubject = route.params?.subject || (prefillProductName ? `Issue with ${prefillProductName}` : '');

  const [selectedCategory, setSelectedCategory] = useState(prefillCategory || null);
  const [subject, setSubject] = useState(prefillSubject);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState('normal');

  const handleSubmit = async () => {
    if (!selectedCategory || !subject.trim() || !description.trim() || !email.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Description Too Short', 'Please provide at least 10 characters describing your issue');
      return;
    }

    setLoading(true);
    try {
      await ticketApi.createTicket({
        category: selectedCategory,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        email: email.trim(),
        ...(prefillProductId && { relatedProduct: prefillProductId }),
        ...(prefillOrderId && { orderId: prefillOrderId, relatedOrder: prefillOrderId }),
      }, authToken);

      Alert.alert(
        'Ticket Created',
        'Your support ticket has been created successfully. We will get back to you soon.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryLabel = TICKET_CATEGORIES.find(c => c.id === selectedCategory)?.label;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!loading}
      >
        <ScreenHeader title="Raise a Ticket" onBack={() => navigation.goBack()} />

        {/* Product / Order context banner */}
        {(prefillProductName || prefillOrderCode) && (
          <View style={styles.contextBanner}>
            {prefillProductName && (
              <View style={styles.contextRow}>
                <Text style={styles.contextIcon}>📦</Text>
                <View style={styles.contextText}>
                  <Text style={styles.contextLabel}>Product</Text>
                  <Text style={styles.contextValue} numberOfLines={1}>{prefillProductName}</Text>
                </View>
              </View>
            )}
            {prefillOrderCode && (
              <View style={[styles.contextRow, prefillProductName && styles.contextRowBorder]}>
                <Text style={styles.contextIcon}>🧾</Text>
                <View style={styles.contextText}>
                  <Text style={styles.contextLabel}>Order</Text>
                  <Text style={styles.contextValue}>{prefillOrderCode}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Need Help?</Text>
          <Text style={styles.infoText}>
            Describe your issue and our support team will assist you as soon as possible.
          </Text>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Category *</Text>
          <View style={styles.categoryGrid}>
            {TICKET_CATEGORIES.map(category => (
              <View key={category.id} style={styles.categoryButtonInner}>
                <TouchableOpacity
                  style={[
                    styles.categoryButtonContent,
                    selectedCategory === category.id && styles.categoryButtonContentActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  disabled={loading}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      selectedCategory === category.id && styles.categoryLabelActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Subject Input */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief subject of your issue"
            placeholderTextColor={colors.textMuted}
            value={subject}
            onChangeText={setSubject}
            editable={!loading}
            maxLength={100}
          />
          <Text style={styles.charCount}>{subject.length}/100</Text>
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Describe your issue in detail (minimum 10 characters)"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            editable={!loading}
            maxLength={500}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Email Input */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Contact Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Your email address"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!loading}
            autoCapitalize="none"
          />
        </View>

        {/* Priority Selection */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {['low', 'normal', 'high', 'urgent'].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.priorityButton, priority === p && styles.priorityButtonActive]}
                onPress={() => setPriority(p)}
                disabled={loading}
              >
                <Text style={[styles.priorityLabel, priority === p && styles.priorityLabelActive]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        {selectedCategory && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Ticket Summary</Text>
            {prefillProductName && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Product:</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>{prefillProductName}</Text>
              </View>
            )}
            {prefillOrderCode && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Order:</Text>
                <Text style={styles.summaryValue}>{prefillOrderCode}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Category:</Text>
              <Text style={styles.summaryValue}>{selectedCategoryLabel}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Priority:</Text>
              <Text style={styles.summaryValue}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subject:</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>{subject || '(Not filled)'}</Text>
            </View>
          </View>
        )}

        <CustomButton
          title={loading ? 'Creating Ticket...' : 'Submit Ticket'}
          onPress={handleSubmit}
          disabled={loading || !selectedCategory}
        />

        <CustomButton
          title="Cancel"
          onPress={() => navigation.goBack()}
          disabled={loading}
          style={{ backgroundColor: colors.surfaceMuted, marginTop: spacing.sm }}
          textStyle={{ color: colors.text }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    contextBanner: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.surfaceSecondary,
      marginBottom: spacing.lg,
      overflow: 'hidden',
    },
    contextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.md,
    },
    contextRowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    contextIcon: { fontSize: 20 },
    contextText: { flex: 1 },
    contextLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    contextValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 },
    infoCard: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.xl,
    },
    infoTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
    infoText: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    section: { marginBottom: spacing.xl },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.sm },
    categoryButtonInner: { width: '50%', padding: spacing.sm, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    categoryButtonContent: {
      alignItems: 'center', justifyContent: 'center', padding: spacing.md,
      borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.surface, width: '100%',
    },
    categoryButtonContentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    categoryIcon: { fontSize: 28, marginBottom: spacing.sm },
    categoryLabel: { fontSize: 12, color: colors.text, textAlign: 'center', fontWeight: '600' },
    categoryLabelActive: { color: colors.surfaceLight },
    inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
      padding: spacing.md, fontSize: 14, color: colors.text, backgroundColor: colors.surface,
    },
    descriptionInput: { height: 120, textAlignVertical: 'top' },
    charCount: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'right' },
    priorityRow: { flexDirection: 'row', justifyContent: 'space-between' },
    priorityButton: {
      flex: 1, marginHorizontal: spacing.xs, paddingVertical: spacing.md,
      borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
      alignItems: 'center', backgroundColor: colors.surface,
    },
    priorityButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    priorityLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
    priorityLabelActive: { color: colors.surfaceLight },
    summaryCard: {
      backgroundColor: colors.surfaceSecondary, borderRadius: radius.md,
      padding: spacing.lg, marginBottom: spacing.xl,
    },
    summaryTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    summaryLabel: { fontSize: 12, color: colors.textMuted },
    summaryValue: { fontSize: 12, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right', marginLeft: spacing.sm },
  });

export default RaiseTicketScreen;
