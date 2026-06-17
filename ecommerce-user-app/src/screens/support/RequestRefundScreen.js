import React, { useState, useMemo, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  FlatList,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/helpers';
import { refundApi } from '../../services/api';

const REFUND_REASONS = [
  { id: 'damaged', label: 'Item Damaged/Defective', description: 'Product arrived damaged or not working' },
  { id: 'not_as_described', label: 'Not as Described', description: 'Product differs from listing' },
  { id: 'quality_issue', label: 'Quality Issue', description: 'Poor quality or material issue' },
  { id: 'wrong_size', label: 'Wrong Size/Fit', description: 'Size or fit issue' },
  { id: 'changed_mind', label: 'Changed Mind', description: 'No longer need the product' },
  { id: 'duplicate_order', label: 'Duplicate Order', description: 'Accidentally ordered twice' },
  { id: 'other', label: 'Other Reason', description: 'Please specify in comments' },
];

const RequestRefundScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { orders, authToken } = useAppStore();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedReason, setSelectedReason] = useState(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Order, 2: Select Items, 3: Select Reason

  const eligibleOrders = useMemo(
    () => orders.filter(order => order.statusGroup === 'completed' || order.statusGroup === 'current'),
    [orders]
  );

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setSelectedItems([]);
    setStep(2);
  };

  const handleToggleItem = (itemId) => {
    setSelectedItems(current =>
      current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId]
    );
  };

  const handleProceedToReason = () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item for refund');
      return;
    }
    setStep(3);
  };

  const handleSubmitRefundRequest = async () => {
    if (!selectedReason || !comments.trim()) {
      Alert.alert('Incomplete', 'Please select a reason and add comments');
      return;
    }

    setLoading(true);
    try {
      const response = await refundApi.requestRefund({
        orderId: selectedOrder.id,
        itemIds: selectedItems,
        reason: selectedReason,
        comments,
      }, authToken);

      const refundAmount = formatCurrency(refundAmount);

      Alert.alert(
        'Refund Request Submitted',
        `Your refund request for ${refundAmount} has been submitted. Our team will review it within 24-48 hours.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to submit refund request');
    } finally {
      setLoading(false);
    }
  };

  const refundReason = REFUND_REASONS.find(r => r.id === selectedReason);
  const selectedItemsData = selectedOrder?.cartItems?.filter(item =>
    selectedItems.includes(item.id || item.productId)
  ) || [];
  const refundAmount = selectedItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!loading}
      >
        <ScreenHeader title="Request Refund" onBack={() => {
          if (step > 1) {
            setStep(step - 1);
          } else {
            navigation.goBack();
          }
        }} />

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={{ alignItems: 'center', flex: 1 }}>
              <View
                style={[
                  styles.stepDot,
                  step >= s && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[
                  styles.stepNumber,
                  step >= s && { color: colors.surfaceLight },
                ]}>
                  {s}
                </Text>
              </View>
              <Text style={[styles.stepLabel, step >= s && { color: colors.primary }]}>
                {s === 1 ? 'Order' : s === 2 ? 'Items' : 'Reason'}
              </Text>
            </View>
          ))}
        </View>

        {/* Step 1: Select Order */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Select Order for Refund</Text>
            {eligibleOrders.length > 0 ? (
              <FlatList
                scrollEnabled={false}
                data={eligibleOrders}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.orderCard,
                      selectedOrder?.id === item.id && styles.orderCardSelected,
                    ]}
                    onPress={() => handleSelectOrder(item)}
                    disabled={loading}
                  >
                    <View style={styles.orderCardHeader}>
                      <Text style={styles.orderCode}>{item.code}</Text>
                      <Text style={[styles.orderStatus, { color: colors.primary }]}>{item.status}</Text>
                    </View>
                    <Text style={styles.orderDate}>Order on {item.date}</Text>
                    <View style={styles.orderFooter}>
                      <Text style={styles.orderItems}>{item.items} items</Text>
                      <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Eligible Orders</Text>
                <Text style={styles.emptyText}>
                  You need a completed or current order to request a refund.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 2: Select Items */}
        {step === 2 && selectedOrder && (
          <View>
            <Text style={styles.stepTitle}>Select Items for Refund</Text>
            <View style={styles.orderSummary}>
              <Text style={styles.orderCode}>{selectedOrder.code}</Text>
              <Text style={styles.orderTotal}>{formatCurrency(selectedOrder.total)}</Text>
            </View>

            <FlatList
              scrollEnabled={false}
              data={selectedOrder.cartItems || []}
              keyExtractor={item => item.id || item.productId}
              renderItem={({ item }) => {
                const isSelected = selectedItems.includes(item.id || item.productId);
                return (
                  <TouchableOpacity
                    style={[
                      styles.itemCard,
                      isSelected && styles.itemCardSelected,
                    ]}
                    onPress={() => handleToggleItem(item.id || item.productId)}
                    disabled={loading}
                  >
                    <View style={styles.itemCheckbox}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name || item.title}</Text>
                      <Text style={styles.itemMeta}>
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            {selectedItems.length > 0 && (
              <View style={styles.refundSummary}>
                <Text style={styles.summaryLabel}>Refund Amount:</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(refundAmount)}</Text>
              </View>
            )}

            <CustomButton
              title="Continue"
              onPress={handleProceedToReason}
              disabled={loading || selectedItems.length === 0}
            />
          </View>
        )}

        {/* Step 3: Select Reason */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Reason for Refund</Text>

            {REFUND_REASONS.map(reason => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonCard,
                  selectedReason === reason.id && styles.reasonCardSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
                disabled={loading}
              >
                <View style={styles.reasonRadio}>
                  {selectedReason === reason.id && (
                    <View style={styles.radioFilled} />
                  )}
                </View>
                <View style={styles.reasonContent}>
                  <Text style={styles.reasonLabel}>{reason.label}</Text>
                  <Text style={styles.reasonDescription}>{reason.description}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.section}>
              <Text style={styles.inputLabel}>Comments *</Text>
              <TextInput
                style={[styles.input, styles.commentsInput]}
                placeholder="Please provide additional details about your refund request"
                placeholderTextColor={colors.textMuted}
                value={comments}
                onChangeText={setComments}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
                maxLength={500}
              />
              <Text style={styles.charCount}>{comments.length}/500</Text>
            </View>

            <View style={styles.refundSummary}>
              <View>
                <Text style={styles.summaryLabel}>Refund Amount:</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(refundAmount)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summaryLabel}>Processing Time:</Text>
                <Text style={styles.summaryAmount}>3-5 Business Days</Text>
              </View>
            </View>

            <CustomButton
              title={loading ? 'Submitting...' : 'Submit Refund Request'}
              onPress={handleSubmitRefundRequest}
              disabled={loading || !selectedReason || !comments.trim()}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    stepIndicator: {
      flexDirection: 'row',
      marginBottom: spacing.xl,
      justifyContent: 'space-between',
    },
    stepDot: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    stepNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textMuted,
    },
    stepLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    stepTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.lg,
    },
    orderCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      backgroundColor: colors.surface,
    },
    orderCardSelected: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    orderCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    orderCode: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    orderStatus: {
      fontSize: 12,
      fontWeight: '600',
    },
    orderDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    orderFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    orderItems: {
      fontSize: 12,
      color: colors.textMuted,
    },
    orderTotal: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    orderSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.md,
      marginBottom: spacing.lg,
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      backgroundColor: colors.surface,
    },
    itemCardSelected: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    itemCheckbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    checkmark: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    itemDetails: {
      flex: 1,
    },
    itemName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    itemMeta: {
      fontSize: 12,
      color: colors.textMuted,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    refundSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.md,
      marginVertical: spacing.lg,
    },
    reasonCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      backgroundColor: colors.surface,
    },
    reasonCardSelected: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    reasonRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    radioFilled: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    reasonContent: {
      flex: 1,
    },
    reasonLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    reasonDescription: {
      fontSize: 12,
      color: colors.textMuted,
    },
    section: {
      marginVertical: spacing.lg,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    commentsInput: {
      height: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: spacing.xs,
      textAlign: 'right',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    summaryAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      marginTop: spacing.xs,
    },
  });

export default RequestRefundScreen;
