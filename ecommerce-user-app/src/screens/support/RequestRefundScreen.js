import React, { useState, useMemo, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import AppModal, { useAppAlert } from '../../components/AppModal';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/helpers';
import { refundApi, returnApi, replacementApi } from '../../services/api';

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
  const { alert, modalProps } = useAppAlert();

  const prefillOrderId = route.params?.orderId || null;
  const prefillProductId = route.params?.productId || null;

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState(
    prefillProductId ? [String(prefillProductId)] : [],
  );
  const [selectedReason, setSelectedReason] = useState(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(prefillOrderId ? 2 : 1);
  const [requestedItemIds, setRequestedItemIds] = useState([]);

  const eligibleOrders = useMemo(
    () => orders.filter(
      o => o.statusGroup === 'completed' || o.statusGroup === 'current',
    ),
    [orders],
  );

  // Pre-select order from route params
  useEffect(() => {
    if (prefillOrderId) {
      const found = orders.find(
        o => String(o.id) === String(prefillOrderId) || String(o._id) === String(prefillOrderId),
      );
      if (found) {
        setSelectedOrder(found);
        if (prefillProductId) setSelectedItems([String(prefillProductId)]);
      }
    }
  }, [prefillOrderId, prefillProductId, orders]);

  // Load existing requests to mark already-requested items
  useEffect(() => {
    if (!authToken || !selectedOrder) return;
    const orderIdStr = String(selectedOrder.id || selectedOrder._id);

    const fetch = async () => {
      try {
        const [returnsRes, refundsRes, replacementsRes] = await Promise.all([
          returnApi.getReturns(authToken).catch(() => ({ data: {} })),
          refundApi.getRefunds(authToken).catch(() => ({ data: {} })),
          replacementApi.getReplacements(authToken).catch(() => ({ data: {} })),
        ]);

        const returnsList = returnsRes?.data?.returns || returnsRes?.returns || [];
        const refundsList = refundsRes?.data?.refunds || refundsRes?.refunds || [];
        const replacementsList = replacementsRes?.data?.replacements || replacementsRes?.replacements || [];

        const requested = new Set();

        returnsList.forEach(ret => {
          if (
            String(ret.order?._id || ret.order) === orderIdStr &&
            ret.status !== 'rejected' &&
            ret.status !== 'cancelled'
          ) {
            ret.returnItems?.forEach(item =>
              requested.add(String(item.product?._id || item.product)),
            );
          }
        });

        refundsList.forEach(ref => {
          if (
            String(ref.order?._id || ref.order) === orderIdStr &&
            ref.status !== 'rejected' &&
            ref.status !== 'failed'
          ) {
            (ref.items || []).forEach(itemId =>
              requested.add(String(itemId?._id || itemId)),
            );
          }
        });

        replacementsList.forEach(rep => {
          if (
            String(rep.order?._id || rep.order) === orderIdStr &&
            rep.status !== 'rejected' &&
            rep.status !== 'cancelled'
          ) {
            rep.replacementItems?.forEach(item =>
              requested.add(String(item.originalProduct?._id || item.originalProduct)),
            );
          }
        });

        setRequestedItemIds(Array.from(requested));
      } catch (err) {
        console.warn('Failed to fetch existing requests:', err);
      }
    };

    fetch();
  }, [authToken, selectedOrder]);

  // If prefilled item was already requested, warn user
  useEffect(() => {
    if (prefillProductId && requestedItemIds.includes(String(prefillProductId))) {
      setSelectedItems([]);
      alert({
        type: 'warning',
        title: 'Already Requested',
        message: 'A refund, return or replacement has already been submitted for this item.',
      });
    }
  }, [requestedItemIds, prefillProductId]);

  const handleSelectOrder = order => {
    setSelectedOrder(order);
    setSelectedItems([]);
    setRequestedItemIds([]);
    setStep(2);
  };

  const handleToggleItem = itemId => {
    const idStr = String(itemId);
    setSelectedItems(prev =>
      prev.includes(idStr) ? prev.filter(x => x !== idStr) : [...prev, idStr],
    );
  };

  const validSelections = useMemo(
    () => selectedItems.filter(id => !requestedItemIds.includes(id)),
    [selectedItems, requestedItemIds],
  );

  const handleProceedToReason = () => {
    if (validSelections.length === 0) {
      alert({
        type: 'warning',
        title: 'No Items Selected',
        message: 'Please select at least one item to request a refund.',
      });
      return;
    }
    setStep(3);
  };

  const handleSubmitRefundRequest = async () => {
    if (!selectedReason || !comments.trim()) {
      alert({
        type: 'warning',
        title: 'Incomplete',
        message: 'Please select a reason and add a comment.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await refundApi.requestRefund(
        {
          orderId: selectedOrder.id || selectedOrder._id,
          itemIds: validSelections,
          reason: selectedReason,
          comments,
        },
        authToken,
      );

      const confirmedAmount = response.data?.refundAmount ?? refundAmount;
      alert({
        type: 'success',
        title: 'Refund Request Submitted',
        message: `Your refund request for ${formatCurrency(confirmedAmount)} has been submitted. Our team will review it within 24–48 hours.`,
        buttons: [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      });
    } catch (error) {
      alert({
        type: 'error',
        title: 'Submission Failed',
        message: error?.message || 'Failed to submit refund request. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedItemsData = useMemo(
    () =>
      (selectedOrder?.cartItems || []).filter(item =>
        validSelections.includes(String(item.id || item.productId)),
      ),
    [selectedOrder, validSelections],
  );

  const refundAmount = useMemo(
    () => selectedItemsData.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItemsData],
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppModal {...modalProps} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!loading}
      >
        <ScreenHeader
          title="Request Refund"
          onBack={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
        />

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map(s => (
            <View key={s} style={{ alignItems: 'center', flex: 1 }}>
              <View
                style={[
                  styles.stepDot,
                  step >= s && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    step >= s && { color: colors.surface },
                  ]}
                >
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
                keyExtractor={item => String(item.id || item._id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.orderCard,
                      (selectedOrder?.id === item.id || selectedOrder?._id === item._id) &&
                        styles.orderCardSelected,
                    ]}
                    onPress={() => handleSelectOrder(item)}
                    disabled={loading}
                  >
                    <View style={styles.orderCardHeader}>
                      <Text style={styles.orderCode}>{item.code}</Text>
                      <Text style={[styles.orderStatus, { color: colors.primary }]}>
                        {item.status}
                      </Text>
                    </View>
                    <Text style={styles.orderDate}>Ordered on {item.date}</Text>
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
                  You need a completed or active order to request a refund.
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

            {(selectedOrder.cartItems || []).length === 0 && (
              <Text style={[styles.emptyText, { textAlign: 'center', marginVertical: spacing.lg }]}>
                No item details available for this order.
              </Text>
            )}

            <FlatList
              scrollEnabled={false}
              data={selectedOrder.cartItems || []}
              keyExtractor={item => String(item.id || item.productId)}
              renderItem={({ item }) => {
                const itemId = String(item.id || item.productId);
                const isAlreadyRequested = requestedItemIds.includes(itemId);
                const isSelected = selectedItems.includes(itemId);
                return (
                  <TouchableOpacity
                    style={[
                      styles.itemCard,
                      isSelected && styles.itemCardSelected,
                      isAlreadyRequested && styles.itemCardDisabled,
                    ]}
                    onPress={() => !isAlreadyRequested && handleToggleItem(itemId)}
                    disabled={loading || isAlreadyRequested}
                  >
                    <View
                      style={[
                        styles.itemCheckbox,
                        isSelected && !isAlreadyRequested && styles.checkboxSelected,
                        isAlreadyRequested && styles.checkboxDisabled,
                      ]}
                    >
                      {isSelected && !isAlreadyRequested && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                      {isAlreadyRequested && (
                        <Text style={styles.disabledCheck}>✕</Text>
                      )}
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={[styles.itemName, isAlreadyRequested && styles.textDisabled]}>
                        {item.name || item.title || 'Product'}
                      </Text>
                      <Text style={styles.itemMeta}>
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </Text>
                      {isAlreadyRequested && (
                        <Text style={styles.alreadyRequestedLabel}>Already requested</Text>
                      )}
                    </View>
                    <Text style={[styles.itemPrice, isAlreadyRequested && styles.textDisabled]}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            {validSelections.length > 0 && (
              <View style={styles.refundSummary}>
                <Text style={styles.summaryLabel}>Refund Amount:</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(refundAmount)}</Text>
              </View>
            )}

            <CustomButton
              title="Continue"
              onPress={handleProceedToReason}
              disabled={loading || validSelections.length === 0}
            />
          </View>
        )}

        {/* Step 3: Reason */}
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
                  {selectedReason === reason.id && <View style={styles.radioFilled} />}
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
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    stepIndicator: {
      flexDirection: 'row',
      marginBottom: spacing.xl,
      justifyContent: 'space-between',
    },
    stepDot: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceSecondary || colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    stepNumber: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
    stepLabel: { fontSize: 12, color: colors.textMuted },
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
      borderColor: colors.primary,
      borderWidth: 2,
    },
    orderCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    orderCode: { fontSize: 14, fontWeight: '700', color: colors.text },
    orderStatus: { fontSize: 12, fontWeight: '600' },
    orderDate: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    orderItems: { fontSize: 12, color: colors.textMuted },
    orderTotal: { fontSize: 14, fontWeight: '700', color: colors.primary },
    orderSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.border,
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
    itemCardSelected: { borderColor: colors.primary, borderWidth: 2 },
    itemCardDisabled: { opacity: 0.55 },
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
    checkboxSelected: { borderColor: colors.primary },
    checkboxDisabled: { backgroundColor: colors.border },
    checkmark: { fontSize: 14, fontWeight: '700', color: colors.primary },
    disabledCheck: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
    itemDetails: { flex: 1 },
    itemName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    itemMeta: { fontSize: 12, color: colors.textMuted },
    itemPrice: { fontSize: 14, fontWeight: '700', color: colors.text },
    textDisabled: { color: colors.textMuted },
    alreadyRequestedLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.danger,
      marginTop: spacing.xs,
    },
    refundSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.border,
      borderRadius: radius.md,
      marginVertical: spacing.lg,
    },
    summaryLabel: { fontSize: 12, color: colors.textMuted },
    summaryAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      marginTop: spacing.xs,
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
    reasonCardSelected: { borderColor: colors.primary, borderWidth: 2 },
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
    reasonContent: { flex: 1 },
    reasonLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    reasonDescription: { fontSize: 12, color: colors.textMuted },
    section: { marginVertical: spacing.lg },
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
    commentsInput: { height: 100, textAlignVertical: 'top' },
    charCount: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: spacing.xs,
      textAlign: 'right',
    },
    emptyState: { alignItems: 'center', paddingVertical: spacing.xl },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
    emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  });

export default RequestRefundScreen;
