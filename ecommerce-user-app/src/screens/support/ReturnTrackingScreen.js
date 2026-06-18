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
import { returnApi } from '../../services/api';
import { subscribeReturnEvents } from '../../services/socket';

const STATUS_LABELS = {
  initiated: 'Initiated',
  approved: 'Approved',
  rejected: 'Rejected',
  in_transit: 'In Transit',
  received: 'Received',
  inspected: 'Inspected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  initiated: '#228be6',
  approved: '#51cf66',
  rejected: '#fa5252',
  in_transit: '#fd7e14',
  received: '#20c997',
  inspected: '#228be6',
  completed: '#20c997',
  cancelled: '#868e96',
};

const ReturnTrackingScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { authToken } = useAppStore();

  const { returnId } = route.params;
  const [returnRequest, setReturnRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadReturnDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await returnApi.getReturnById(returnId, authToken);
      setReturnRequest(response.data.returnRequest);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load return details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [returnId, authToken]);

  useEffect(() => {
    loadReturnDetail();

    // Subscribe to real-time return updates
    const unsubscribe = subscribeReturnEvents.onReturnUpdated((data) => {
      if (data.returnId === returnId) {
        loadReturnDetail();
      }
    });

    return () => unsubscribe();
  }, [loadReturnDetail, returnId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReturnDetail();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Return Details" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading return details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!returnRequest) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Return Details" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Return not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const timeline = [
    { status: 'initiated', label: 'Request Initiated', completed: true },
    { status: 'approved', label: 'Approved', completed: ['approved', 'in_transit', 'received', 'inspected', 'completed'].includes(returnRequest.status) },
    { status: 'in_transit', label: 'Item in Transit', completed: ['in_transit', 'received', 'inspected', 'completed'].includes(returnRequest.status) },
    { status: 'received', label: 'Item Received', completed: ['received', 'inspected', 'completed'].includes(returnRequest.status) },
    { status: 'inspected', label: 'Inspection Complete', completed: ['inspected', 'completed'].includes(returnRequest.status) },
    { status: 'completed', label: 'Return Completed', completed: returnRequest.status === 'completed' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Return Details" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[returnRequest.status] || '#6c757d' }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[returnRequest.status] || returnRequest.status}</Text>
          </View>
          <Text style={styles.statusTitle}>
            {returnRequest.status === 'completed' ? 'Return Completed' : 
             returnRequest.status === 'rejected' ? 'Return Rejected' : 
             returnRequest.status === 'in_transit' ? 'Item in Transit' : 
             returnRequest.status === 'received' ? 'Item Received' :
             'Return in Progress'}
          </Text>
          <Text style={styles.statusDate}>
            Requested on {new Date(returnRequest.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Items Card */}
        <View style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Return Items</Text>
          {returnRequest.returnItems && returnRequest.returnItems.length > 0 ? (
            returnRequest.returnItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product?.name || 'Item'}</Text>
                  <Text style={styles.itemMeta}>Qty: {item.quantity} • {item.condition}</Text>
                </View>
                <Text style={styles.itemReason}>{item.reason}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItems}>No items in this return</Text>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Return Timeline</Text>
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
        {returnRequest.pickupAddress && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Pickup Address</Text>
            <Text style={styles.addressText}>
              {returnRequest.pickupAddress.street}
              {returnRequest.pickupAddress.city && `, ${returnRequest.pickupAddress.city}`}
              {returnRequest.pickupAddress.state && `, ${returnRequest.pickupAddress.state}`}
              {returnRequest.pickupAddress.zipCode && ` ${returnRequest.pickupAddress.zipCode}`}
            </Text>
          </View>
        )}

        {/* Admin Notes */}
        {returnRequest.adminNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Admin Notes</Text>
            <Text style={styles.notesText}>{returnRequest.adminNotes}</Text>
          </View>
        )}

        {/* Rejection Reason */}
        {returnRequest.status === 'rejected' && returnRequest.rejectionReason && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionTitle}>Rejection Reason</Text>
            <Text style={styles.rejectionText}>{returnRequest.rejectionReason}</Text>
          </View>
        )}

        {/* Actions */}
        {returnRequest.status === 'rejected' && (
          <CustomButton
            title="Request New Return"
            onPress={() => navigation.navigate('RequestReturn')}
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
    itemsCard: {
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
    itemReason: {
      fontSize: 11,
      color: colors.textMuted,
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

export default ReturnTrackingScreen;
