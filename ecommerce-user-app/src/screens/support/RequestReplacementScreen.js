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
  Image,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import AppModal, { useAppAlert } from '../../components/AppModal';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/helpers';
import { replacementApi, returnApi, refundApi } from '../../services/api';
import * as ImagePicker from 'react-native-image-picker';

const REPLACEMENT_REASONS = [
  { id: 'damaged', label: 'Item Damaged/Defective', description: 'Product arrived damaged or not working' },
  { id: 'wrong_item', label: 'Wrong Item Received', description: 'Received different product than ordered' },
  { id: 'not_as_described', label: 'Not as Described', description: 'Product differs from listing description' },
  { id: 'quality_issue', label: 'Quality Issue', description: 'Poor quality or material issue' },
  { id: 'wrong_size', label: 'Wrong Size/Fit', description: 'Size or fit issue' },
  { id: 'other', label: 'Other Reason', description: 'Please specify in comments' },
];

const RequestReplacementScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { orders, authToken } = useAppStore();
  const { alert, modalProps } = useAppAlert();

  // Support pre-selecting from order/product context
  const prefillOrderId = route.params?.orderId || null;
  const prefillProductId = route.params?.productId || null;

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState(prefillProductId ? [String(prefillProductId)] : []);
  const [replacementProducts, setReplacementProducts] = useState({});
  const [selectedReason, setSelectedReason] = useState(null);
  const [comments, setComments] = useState('');
  const [images, setImages] = useState([]);
  const [pickupAddress, setPickupAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(prefillOrderId ? 2 : 1); 
  const [requestedItemIds, setRequestedItemIds] = useState([]);

  // Pre-select the order if orderId was passed in params
  useEffect(() => {
    if (prefillOrderId) {
      const found = orders.find(o => String(o.id) === String(prefillOrderId) || String(o._id) === String(prefillOrderId));
      if (found) {
        setSelectedOrder(found);
        if (prefillProductId) {
          setSelectedItems([String(prefillProductId)]);
        }
      }
    }
  }, [prefillOrderId, prefillProductId, orders]);

  // Load existing requests for this order
  // ponytail: unified returns/refunds/replacements fetching and coercion to String
  useEffect(() => {
    if (!authToken || !selectedOrder) return;
    const fetchExistingRequests = async () => {
      try {
        const orderIdStr = String(selectedOrder.id || selectedOrder._id);
        const [returnsRes, refundsRes, replacementsRes] = await Promise.all([
          returnApi.getReturns(authToken).catch(() => ({ data: {} })),
          refundApi.getRefunds(authToken).catch(() => ({ data: {} })),
          replacementApi.getReplacements(authToken).catch(() => ({ data: {} })),
        ]);

        const returnsList = returnsRes.data?.returns || returnsRes.returns || [];
        const refundsList = refundsRes.data?.refunds || refundsRes.refunds || [];
        const replacementsList = replacementsRes.data?.replacements || replacementsRes.replacements || [];

        const requested = new Set();

        returnsList.forEach(ret => {
          const retOrderId = String(ret.order?._id || ret.order);
          if (retOrderId === orderIdStr && ret.status !== 'rejected' && ret.status !== 'cancelled') {
            ret.returnItems?.forEach(item => {
              requested.add(String(item.product?._id || item.product));
            });
          }
        });

        refundsList.forEach(ref => {
          const refOrderId = String(ref.order?._id || ref.order);
          if (refOrderId === orderIdStr && ref.status !== 'rejected' && ref.status !== 'failed') {
            ref.items?.forEach(itemId => {
              requested.add(String(itemId?._id || itemId));
            });
          }
        });

        replacementsList.forEach(rep => {
          const repOrderId = String(rep.order?._id || rep.order);
          if (repOrderId === orderIdStr && rep.status !== 'rejected' && rep.status !== 'cancelled') {
            rep.replacementItems?.forEach(item => {
              requested.add(String(item.originalProduct?._id || item.originalProduct));
            });
          }
        });

        setRequestedItemIds(Array.from(requested));
      } catch (err) {
        console.warn('Failed to fetch existing requests:', err);
      }
    };
    fetchExistingRequests();
  }, [authToken, selectedOrder]);

  // Handle prefilled item already requested
  useEffect(() => {
    if (prefillProductId && requestedItemIds.includes(String(prefillProductId))) {
      setSelectedItems([]);
      alert({
        type: 'warning',
        title: 'Already Requested',
        message: 'A return, refund, or replacement has already been requested for this item.'
      });
    }
  }, [requestedItemIds, prefillProductId]);

  const eligibleOrders = useMemo(
    () => orders.filter(order => 
      order.statusGroup === 'completed' || 
      order.statusGroup === 'delivered' ||
      order.status === 'delivered'
    ),
    [orders]
  );

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setSelectedItems([]);
    setRequestedItemIds([]);
    setReplacementProducts({});
    setStep(2);
  };

  const handleToggleItem = (itemId) => {
    const idStr = String(itemId);
    setSelectedItems(current =>
      current.includes(idStr)
        ? current.filter(id => id !== idStr)
        : [...current, idStr]
    );
  };

  const validSelections = useMemo(
    () => selectedItems.filter(id => !requestedItemIds.includes(String(id))),
    [selectedItems, requestedItemIds]
  );

  const handleProceedToProducts = () => {
    if (validSelections.length === 0) {
      alert({
        type: 'warning',
        title: 'No Items Selected',
        message: 'Please select at least one item for replacement',
      });
      return;
    }
    setStep(3);
  };

  const handleSelectReplacementProduct = (originalItemId, replacementProductId) => {
    setReplacementProducts(prev => ({
      ...prev,
      [originalItemId]: replacementProductId,
    }));
  };

  const handleProceedToReason = () => {
    const allSelected = validSelections.every(itemId => replacementProducts[itemId]);
    if (!allSelected) {
      alert({
        type: 'warning',
        title: 'Incomplete Selection',
        message: 'Please select a replacement product for each item',
      });
      return;
    }
    setStep(4);
  };

  const handleProceedToImages = () => {
    if (!selectedReason) {
      alert({
        type: 'warning',
        title: 'Reason Required',
        message: 'Please select a reason for replacement',
      });
      return;
    }
    setStep(5);
  };

  const handleProceedToAddress = () => {
    setStep(6);
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 3,
      });

      if (result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...newImages].slice(0, 5));
      }
    } catch (error) {
      alert({
        type: 'error',
        title: 'Error',
        message: 'Failed to pick image',
      });
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReplacementRequest = async () => {
    if (!pickupAddress.street || !pickupAddress.city || !pickupAddress.zipCode) {
      alert({
        type: 'warning',
        title: 'Incomplete Address',
        message: 'Please fill in all required address fields',
      });
      return;
    }

    setLoading(true);
    try {
      const replacementItems = validSelections.map(itemId => {
        let replacementProd = replacementProducts[itemId];
        if (replacementProd === 'different') {
          replacementProd = replacementProducts[`${itemId}_custom`] || itemId;
        }
        return {
          originalProduct: itemId,
          product: replacementProd,
          quantity: 1,
          reason: selectedReason,
          condition: 'Good',
        };
      });

      const response = await replacementApi.createReplacementRequest({
        orderId: selectedOrder.id || selectedOrder._id,
        replacementItems,
        reason: selectedReason,
        comments,
        pickupAddress,
        images,
      }, authToken);

      alert({
        type: 'success',
        title: 'Replacement Request Submitted',
        message: 'Your replacement request has been submitted. Our team will review it within 24-48 hours and send you pickup instructions for the original item.',
        buttons: [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      });
    } catch (error) {
      alert({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to submit replacement request',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedItemsData = useMemo(() => {
    return selectedOrder?.cartItems?.filter(item =>
      validSelections.includes(String(item.id || item.productId))
    ) || [];
  }, [selectedOrder, validSelections]);

  return (
    <SafeAreaView style={styles.container}>
      <AppModal {...modalProps} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!loading}
      >
        <ScreenHeader title="Request Replacement" onBack={() => {
          if (step > 1) {
            setStep(step - 1);
          } else {
            navigation.goBack();
          }
        }} />

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3, 4, 5, 6].map((s) => (
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
                {s === 1 ? 'Order' : s === 2 ? 'Items' : s === 3 ? 'Replace' : s === 4 ? 'Reason' : s === 5 ? 'Photos' : 'Address'}
              </Text>
            </View>
          ))}
        </View>

        {/* Step 1: Select Order */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Select Order for Replacement</Text>
            {eligibleOrders.length > 0 ? (
              <FlatList
                scrollEnabled={false}
                data={eligibleOrders}
                keyExtractor={item => item.id || item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.orderCard,
                      (selectedOrder?.id === item.id || selectedOrder?._id === item._id) && styles.orderCardSelected,
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
                  You need a delivered order to request a replacement.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 2: Select Items */}
        {step === 2 && selectedOrder && (
          <View>
            <Text style={styles.stepTitle}>Select Items for Replacement</Text>
            <View style={styles.orderSummary}>
              <Text style={styles.orderCode}>{selectedOrder.code}</Text>
              <Text style={styles.orderTotal}>{formatCurrency(selectedOrder.total)}</Text>
            </View>

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
                    <View style={[styles.itemCheckbox, isAlreadyRequested && styles.checkboxDisabled]}>
                      {isSelected && !isAlreadyRequested && <Text style={styles.checkmark}>✓</Text>}
                      {isAlreadyRequested && <Text style={styles.disabledCheck}>✕</Text>}
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={[styles.itemName, isAlreadyRequested && styles.textDisabled]}>
                        {item.name || item.title}
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

            <CustomButton
              title="Continue"
              onPress={handleProceedToProducts}
              disabled={loading || validSelections.length === 0}
            />
          </View>
        )}

        {/* Step 3: Select Replacement Products */}
        {step === 3 && selectedOrder && (
          <View>
            <Text style={styles.stepTitle}>Select Replacement Products</Text>
            <Text style={styles.infoText}>
              Choose the product you'd like to receive as a replacement for each selected item.
            </Text>

            {selectedItemsData.map((item) => (
              <View key={item.id || item.productId} style={styles.replacementSection}>
                <Text style={styles.originalItemName}>{item.name || item.title}</Text>
                <Text style={styles.originalItemPrice}>{formatCurrency(item.price)}</Text>
                
                <View style={styles.replacementOptions}>
                  <TouchableOpacity
                    style={[
                      styles.replacementOption,
                      replacementProducts[item.id || item.productId] === (item.id || item.productId) && styles.replacementOptionSelected,
                    ]}
                    onPress={() => handleSelectReplacementProduct(item.id || item.productId, item.id || item.productId)}
                    disabled={loading}
                  >
                    <Text style={styles.replacementOptionText}>Same Product</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.replacementOption,
                      replacementProducts[item.id || item.productId] === 'different' && styles.replacementOptionSelected,
                    ]}
                    onPress={() => handleSelectReplacementProduct(item.id || item.productId, 'different')}
                    disabled={loading}
                  >
                    <Text style={styles.replacementOptionText}>Different Product</Text>
                  </TouchableOpacity>
                </View>

                {replacementProducts[item.id || item.productId] === 'different' && (
                  <View style={styles.section}>
                    <Text style={styles.inputLabel}>Enter Product ID or Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter the product you want instead"
                      placeholderTextColor={colors.textMuted}
                      value={replacementProducts[`${item.id || item.productId}_custom`] || ''}
                      onChangeText={(text) => setReplacementProducts(prev => ({
                        ...prev,
                        [`${item.id || item.productId}_custom`]: text,
                      }))}
                      editable={!loading}
                    />
                  </View>
                )}
              </View>
            ))}

            <CustomButton
              title="Continue"
              onPress={handleProceedToReason}
              disabled={loading}
            />
          </View>
        )}

        {/* Step 4: Select Reason */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Reason for Replacement</Text>

            {REPLACEMENT_REASONS.map(reason => (
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
              <Text style={styles.inputLabel}>Comments</Text>
              <TextInput
                style={[styles.input, styles.commentsInput]}
                placeholder="Please provide additional details about your replacement request"
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

            <CustomButton
              title="Continue"
              onPress={handleProceedToImages}
              disabled={loading || !selectedReason}
            />
          </View>
        )}

        {/* Step 5: Upload Images */}
        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>Upload Evidence Photos</Text>
            <Text style={styles.infoText}>
              Upload up to 5 photos showing the condition of the item(s) you're replacing.
            </Text>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickImage}
              disabled={loading || images.length >= 5}
            >
              <Text style={styles.uploadButtonText}>
                {images.length >= 5 ? 'Max 5 photos' : '+ Add Photo'}
              </Text>
            </TouchableOpacity>

            <View style={styles.imageGrid}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <CustomButton
              title="Continue"
              onPress={handleProceedToAddress}
              disabled={loading}
            />
          </View>
        )}

        {/* Step 6: Pickup Address */}
        {step === 6 && (
          <View>
            <Text style={styles.stepTitle}>Pickup Address</Text>
            <Text style={styles.infoText}>
              Provide the address where the original item pickup should be arranged.
            </Text>

            <View style={styles.section}>
              <Text style={styles.inputLabel}>Street Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter street address"
                placeholderTextColor={colors.textMuted}
                value={pickupAddress.street}
                onChangeText={(text) => setPickupAddress({ ...pickupAddress, street: text })}
                editable={!loading}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter city"
                placeholderTextColor={colors.textMuted}
                value={pickupAddress.city}
                onChangeText={(text) => setPickupAddress({ ...pickupAddress, city: text })}
                editable={!loading}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter state"
                placeholderTextColor={colors.textMuted}
                value={pickupAddress.state}
                onChangeText={(text) => setPickupAddress({ ...pickupAddress, state: text })}
                editable={!loading}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.inputLabel}>ZIP Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter ZIP code"
                placeholderTextColor={colors.textMuted}
                value={pickupAddress.zipCode}
                onChangeText={(text) => setPickupAddress({ ...pickupAddress, zipCode: text })}
                editable={!loading}
                keyboardType="number-pad"
              />
            </View>

            <CustomButton
              title={loading ? 'Submitting...' : 'Submit Replacement Request'}
              onPress={handleSubmitReplacementRequest}
              disabled={loading || !pickupAddress.street || !pickupAddress.city || !pickupAddress.zipCode}
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
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    stepNumber: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    stepLabel: {
      fontSize: 9,
      color: colors.textMuted,
    },
    stepTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.lg,
    },
    infoText: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: spacing.lg,
      lineHeight: 20,
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
    replacementSection: {
      marginBottom: spacing.xl,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    originalItemName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    originalItemPrice: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
    replacementOptions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    replacementOption: {
      flex: 1,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    replacementOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    replacementOptionText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
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
    uploadButton: {
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: radius.md,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.lg,
      backgroundColor: colors.surface,
    },
    uploadButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -spacing.sm,
      marginBottom: spacing.lg,
    },
    imageContainer: {
      width: '31%',
      aspectRatio: 1,
      margin: spacing.sm,
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    removeImageButton: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      backgroundColor: 'rgba(0,0,0,0.6)',
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeImageText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '700',
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
    itemCardDisabled: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.border,
      opacity: 0.6,
    },
    checkboxDisabled: {
      backgroundColor: colors.border,
      borderColor: colors.border,
    },
    disabledCheck: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    textDisabled: {
      color: colors.textMuted,
    },
    alreadyRequestedLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.danger,
      marginTop: spacing.xs,
    },
  });

export default RequestReplacementScreen;
