import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  RefreshControl,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { replacementApi } from '../../services/api';
import { subscribeReplacementEvents } from '../../services/socket';

const STATUS_LABELS = {
  initiated: 'Initiated',
  approved: 'Approved',
  rejected: 'Rejected',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  initiated: '#228be6',
  approved: '#51cf66',
  rejected: '#fa5252',
  processing: '#fd7e14',
  shipped: '#20c997',
  delivered: '#20c997',
  cancelled: '#868e96',
};

const ReplacementTrackingScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { authToken } = useAppStore();

  const { replacementId } = route.params;
  const [replacement, setReplacement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadReplacementDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await replacementApi.getReplacementById(replacementId, authToken);
      setReplacement(response.data.replacementRequest);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load replacement details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [replacementId, authToken]);

  useEffect(() => {
    loadReplacementDetail();

    // Subscribe to real-time replacement updates
    const unsubscribe = subscribeReplacementEvents.onReplacementUpdated((data) => {
      if (data.replacementId === replacementId) {
        loadReplacementDetail();
      }
    });

    return () => unsubscribe();
  }, [loadReplacementDetail, replacementId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReplacementDetail();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Replacement Details" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading replacement details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!replacement) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Replacement Details" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Replacement not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const timeline = [
    { status: 'initiated', label: 'Request Initiated', completed: true },
    { status: 'approved', label: 'Approved', completed: ['approved', 'processing', 'shipped', 'delivered'].includes(replacement.status) },
    { status: 'processing', label: 'Processing', completed: ['processing', 'shipped', 'delivered'].includes(replacement.status) },
    { status: 'shipped', label: 'Replacement Shipped', completed: ['shipped', 'delivered'].includes(replacement.status) },
    { status: 'delivered', label: 'Delivered', completed: replacement.status === 'delivered' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Replacement Details" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[replacement.status] || '#6c757d' }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[replacement.status] || replacement.status}</Text>
          </View>
          <Text style={styles.statusTitle}>
            {replacement.status === 'delivered' ? 'Replacement Delivered' : 
             replacement.status === 'rejected' ? 'Replacement Rejected' : 
             replacement.status === 'shipped' ? 'Replacement Shipped' : 
             replacement.status === 'processing' ? 'Processing Replacement' :
             'Replacement in Progress'}
          </Text>
          <Text style={styles.statusDate}>
            Requested on {new Date(replacement.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Tracking Info */}
        {replacement.trackingNumber && (
          <View style={styles.trackingCard}>
            <Text style={styles.sectionTitle}>Tracking Information</Text>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Tracking Number</Text>
              <Text style={styles.trackingValue}>{replacement.trackingNumber}</Text>
            </View>
            {replacement.shippedAt && (
              <View style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>Shipped On</Text>
                <Text style={styles.trackingValue}>{new Date(replacement.shippedAt).toLocaleDateString()}</Text>
              </View>
            )}
            {replacement.deliveredAt && (
              <View style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>Delivered On</Text>
                <Text style={styles.trackingValue}>{new Date(replacement.deliveredAt).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        )}

        {/* Items Card */}
        <View style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Replacement Items</Text>
          {replacement.replacementItems && replacement.replacementItems.length > 0 ? (
            replacement.replacementItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.originalProduct?.name || 'Original Item'}</Text>
                  <Text style={styles.itemMeta}>Qty: {item.quantity} • {item.condition}</Text>
                </View>
                <View style={styles.itemReplacement}>
                  <Text style={styles.replacementLabel}>→</Text>
                  <Text style={styles.replacementName}>{item.product?.name || 'New Item'}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noItems}>No items in this replacement</Text>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Replacement Timeline</Text>
          {timeline.map((item, index) => (
            <View key={item.status} style={styles.timelineItem}>
              <View style={styles.timelineLine}>
                <View style={[
                  styles.timelineDot,
                  item.completed ? styles.timelineDotCompleted : styles.timelineDotPending,
                ]}>
                  {item.completed && <Text style={styles.timelineDotCheck}>✓</Text>}
                </View>
                {index < timeline.length - 1 && (
                  <View style={[
                    styles.timelineConnector,
                    item.completed ? styles.timelineConnectorCompleted : styles.timelineConnectorPending,
                  ]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.timelineLabel,
                  item.completed ? styles.timelineLabelCompleted : styles.timelineLabelPending,
                ]}>
                  {item.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pickup Address */}
        {replacement.pickupAddress && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Pickup Address</Text>
            <Text style={styles.addressText}>
              {replacement.pickupAddress.street}
              {replacement.pickupAddress.city && `, ${replacement.pickupAddress.city}`}
              {replacement.pickupAddress.state && `, ${replacement.pickupAddress.state}`}
              {replacement.pickupAddress.zipCode && ` ${replacement.pickupAddress.zipCode}`}
            </Text>
          </View>
        )}

        {/* Admin Notes */}
        {replacement.adminNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Admin Notes</Text>
            <Text style={styles.notesText}>{replacement.adminNotes}</Text>
          </View>
        )}

        {/* Rejection Reason */}
        {replacement.status === 'rejected' && replacement.rejectionReason && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionTitle}>Rejection Reason</Text>
            <Text style={styles.rejectionText}>{replacement.rejectionReason}</Text>
          </View>
        )}

        {/* Actions */}
        {replacement.status === 'rejected' && (
          <CustomButton
            title="Request New Replacement"
            onPress={() => navigation.navigate('RequestReplacement')}
            style={styles.actionButton}
          />
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    errorText: {
      fontSize: 16,
      color: colors.text,
    },
    statusCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
      color: 'white',
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    statusDate: {
      fontSize: 12,
      color: colors.textMuted,
    },
    trackingCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.md,
    },
    trackingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    trackingLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    trackingValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    itemsCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemInfo: {
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
    itemReplacement: {
      alignItems: 'flex-end',
      marginLeft: spacing.md,
    },
    replacementLabel: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '700',
    },
    replacementName: {
      fontSize: 12,
      color: colors.text,
      fontStyle: 'italic',
    },
    noItems: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    timelineSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timelineItem: {
      flexDirection: 'row',
      marginBottom: spacing.lg,
    },
    timelineLine: {
      alignItems: 'center',
      marginRight: spacing.md,
    },
    timelineDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    timelineDotCompleted: {
      backgroundColor: colors.primary,
    },
    timelineDotPending: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 2,
      borderColor: colors.border,
    },
    timelineDotCheck: {
      color: 'white',
      fontSize: 14,
      fontWeight: '700',
    },
    timelineConnector: {
      width: 2,
      height: 24,
    },
    timelineConnectorCompleted: {
      backgroundColor: colors.primary,
    },
    timelineConnectorPending: {
      backgroundColor: colors.border,
    },
    timelineContent: {
      flex: 1,
    },
    timelineLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    timelineLabelCompleted: {
      color: colors.text,
    },
    timelineLabelPending: {
      color: colors.textMuted,
    },
    addressSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addressText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    notesSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notesText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    rejectionCard: {
      backgroundColor: '#fff5f5',
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: '#fa5252',
    },
    rejectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fa5252',
      marginBottom: spacing.sm,
    },
    rejectionText: {
      fontSize: 12,
      color: colors.text,
    },
    actionButton: {
      marginTop: spacing.md,
    },
  });

export default ReplacementTrackingScreen;
