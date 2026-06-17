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
  Image,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/helpers';
import { returnApi } from '../../services/api';
import * as ImagePicker from 'react-native-image-picker';

const RETURN_REASONS = [
  { id: 'damaged', label: 'Item Damaged/Defective', description: 'Product arrived damaged or not working' },
  { id: 'wrong_item', label: 'Wrong Item Received', description: 'Received different product than ordered' },
  { id: 'not_as_described', label: 'Not as Described', description: 'Product differs from listing description' },
  { id: 'quality_issue', label: 'Quality Issue', description: 'Poor quality or material issue' },
  { id: 'wrong_size', label: 'Wrong Size/Fit', description: 'Size or fit issue' },
  { id: 'changed_mind', label: 'Changed Mind', description: 'No longer need the product' },
  { id: 'other', label: 'Other Reason', description: 'Please specify in comments' },
];

const RETURN_CONDITIONS = [
  { id: 'new', label: 'New with tags' },
  { id: 'like_new', label: 'Like new' },
  { id: 'good', label: 'Good condition' },
  { id: 'fair', label: 'Fair condition' },
  { id: 'poor', label: 'Poor/Damaged' },
];

const RequestReturnScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { orders, authToken } = useAppStore();

  // Support pre-selecting from order/product context
  const prefillOrderId = route.params?.orderId || null;
  const prefillProductId = route.params?.productId || null;

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState(prefillProductId ? [prefillProductId] : []);
  const [selectedReason, setSelectedReason] = useState(null);
  const [selectedCondition, setSelectedCondition] = useState('good');
  const [comments, setComments] = useState('');
  const [images, setImages] = useState([]);
  const [pickupAddress, setPickupAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [loading, setLoading] = useState(false);
  // If orderId provided, skip step 1 (start at step 2 with that order pre-selected)
  const [step, setStep] = useState(prefillOrderId ? 2 : 1);

  const eligibleOrders = useMemo(
    () => orders.filter(order => 
      order.statusGroup === 'completed' || 
      order.statusGroup === 'delivered' ||
      order.status === 'delivered'
    ),
    [orders]
  );

  // Pre-select the order if orderId was passed in params
  React.useEffect(() => {
    if (prefillOrderId) {
      const found = orders.find(o => o.id === prefillOrderId || o._id === prefillOrderId);
      if (found) {
        setSelectedOrder(found);
        if (prefillProductId) {
          setSelectedItems([prefillProductId]);
        }
      }
    }
  }, [prefillOrderId, prefillProductId, orders]);

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
      Alert.alert('No Items Selected', 'Please select at least one item for return');
      return;
    }
    setStep(3);
  };

  const handleProceedToImages = () => {
    if (!selectedReason) {
      Alert.alert('Reason Required', 'Please select a reason for return');
      return;
    }
    setStep(4);
  };

  const handleProceedToAddress = () => {
    setStep(5);
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
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturnRequest = async () => {
    if (!pickupAddress.street || !pickupAddress.city || !pickupAddress.zipCode) {
      Alert.alert('Incomplete Address', 'Please fill in all required address fields');
      return;
    }

    setLoading(true);
    try {
      const response = await returnApi.createReturnRequest({
        orderId: selectedOrder.id,
        returnItems: selectedItems.map(itemId => ({
          productId: itemId,
          quantity: 1,
          reason: selectedReason,
          condition: selectedCondition,
        })),
        reason: selectedReason,
        comments,
        pickupAddress,
        images,
      }, authToken);

      Alert.alert(
        'Return Request Submitted',
        'Your return request has been submitted. Our team will review it within 24-48 hours and send you pickup instructions.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  const returnReason = RETURN_REASONS.find(r => r.id === selectedReason);
  const selectedItemsData = selectedOrder?.cartItems?.filter(item =>
    selectedItems.includes(item.id || item.productId)
  ) || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!loading}
      >
        <ScreenHeader title="Request Return" onBack={() => {
          if (step > 1) {
            setStep(step - 1);
          } else {
            navigation.goBack();
          }
        }} />

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3, 4, 5].map((s) => (
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
                {s === 1 ? 'Order' : s === 2 ? 'Items' : s === 3 ? 'Reason' : s === 4 ? 'Photos' : 'Address'}
              </Text>
            </View>
          ))}
        </View>

        {/* Step 1: Select Order */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Select Order for Return</Text>
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
                  You need a delivered order to request a return.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 2: Select Items */}
        {step === 2 && selectedOrder && (
          <View>
            <Text style={styles.stepTitle}>Select Items for Return</Text>
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
            <Text style={styles.stepTitle}>Reason for Return</Text>

            {RETURN_REASONS.map(reason => (
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
              <Text style={styles.inputLabel}>Item Condition</Text>
              <View style={styles.conditionRow}>
                {RETURN_CONDITIONS.map(condition => (
                  <TouchableOpacity
                    key={condition.id}
                    style={[
                      styles.conditionButton,
                      selectedCondition === condition.id && styles.conditionButtonActive,
                    ]}
                    onPress={() => setSelectedCondition(condition.id)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.conditionLabel,
                      selectedCondition === condition.id && styles.conditionLabelActive,
                    ]}>
                      {condition.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.inputLabel}>Comments</Text>
              <TextInput
                style={[styles.input, styles.commentsInput]}
                placeholder="Please provide additional details about your return request"
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

        {/* Step 4: Upload Images */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Upload Evidence Photos</Text>
            <Text style={styles.infoText}>
              Upload up to 5 photos showing the condition of the item(s) you're returning.
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

        {/* Step 5: Pickup Address */}
        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>Pickup Address</Text>
            <Text style={styles.infoText}>
              Provide the address where the return pickup should be arranged.
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
              title={loading ? 'Submitting...' : 'Submit Return Request'}
              onPress={handleSubmitReturnRequest}
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
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textMuted,
    },
    stepLabel: {
      fontSize: 10,
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
    conditionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -spacing.xs,
    },
    conditionButton: {
      flex: 1,
      marginHorizontal: spacing.xs,
      marginVertical: spacing.xs,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: colors.surface,
      minWidth: 100,
    },
    conditionButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    conditionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    conditionLabelActive: {
      color: colors.surfaceLight,
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
  });

export default RequestReturnScreen;
