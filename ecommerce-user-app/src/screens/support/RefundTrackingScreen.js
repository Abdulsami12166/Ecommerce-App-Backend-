import React, { useState, useMemo, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/helpers';
import { refundApi } from '../../services/api';
import { subscribeRefundEvents } from '../../services/socket';

const STATUS_LABELS = {
  initiated: 'Initiated',
  approved: 'Approved',
  rejected: 'Rejected',
  processing: 'Processing',
  completed: 'Refunded',
  failed: 'Failed',
};

const STATUS_COLORS = {
  initiated: '#228be6',
  approved: '#51cf66',
  rejected: '#fa5252',
  processing: '#fd7e14',
  completed: '#20c997',
  failed: '#fa5252',
};

const RefundTrackingScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { authToken } = useAppStore();

  const { refundId } = route.params;
  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadRefundDetail = async () => {
    setLoading(true);
    try {
      const response = await refundApi.getRefundById(refundId, authToken);
      setRefund(response.data.refund);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load refund details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRefundDetail();

    // Subscribe to real-time refund updates
    const unsubscribe = subscribeRefundEvents.onRefundUpdated((data) => {
      if (data.refundId === refundId) {
        loadRefundDetail();
      }
    });

    return () => unsubscribe();
  }, [refundId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRefundDetail();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Refund Details" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading refund details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!refund) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Refund Details" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Refund not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const timeline = [
    { status: 'initiated', label: 'Request Initiated', completed: true },
    { status: 'approved', label: 'Approved', completed: ['approved', 'processing', 'completed'].includes(refund.status) },
    { status: 'processing', label: 'Processing', completed: ['processing', 'completed'].includes(refund.status) },
    { status: 'completed', label: 'Refunded', completed: refund.status === 'completed' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Refund Details" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[refund.status] || '#6c757d' }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[refund.status] || refund.status}</Text>
          </View>
          <Text style={styles.statusTitle}>
            {refund.status === 'completed' ? 'Refund Successful' : 
             refund.status === 'rejected' ? 'Refund Rejected' : 
             refund.status === 'processing' ? 'Refund Processing' : 
             'Refund in Progress'}
          </Text>
          <Text style={styles.statusDate}>
            Requested on {new Date(refund.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Refund Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(refund.refundAmount || 0)}</Text>
          <View style={styles.amountBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Product Amount</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(refund.refundBreakdown?.productAmount || 0)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Shipping Refund</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(refund.refundBreakdown?.shippingRefund || 0)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Tax Refund</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(refund.refundBreakdown?.taxRefund || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Refund Timeline</Text>
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
                {item.completed && item.status === refund.status && (
                  <Text style={styles.timelineDate}>
                    {new Date(refund.updatedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Refund Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Refund Type</Text>
            <Text style={styles.detailValue}>{refund.refundType || 'Partial'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reason</Text>
            <Text style={styles.detailValue}>{refund.reason || 'Other'}</Text>
          </View>
          {refund.paymentDetails?.gateway && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Gateway</Text>
              <Text style={styles.detailValue}>{refund.paymentDetails.gateway}</Text>
            </View>
          )}
          {refund.paymentDetails?.refundId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Refund ID</Text>
              <Text style={styles.detailValue}>{refund.paymentDetails.refundId}</Text>
            </View>
          )}
          {refund.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{refund.notes}</Text>
            </View>
          )}
        </View>

        {/* Rejection Reason */}
        {refund.status === 'rejected' && refund.rejectionReason && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionTitle}>Rejection Reason</Text>
            <Text style={styles.rejectionText}>{refund.rejectionReason}</Text>
          </View>
        )}

        {/* Actions */}
        {refund.status === 'rejected' && (
          <CustomButton
            title="Request New Refund"
            onPress={() => navigation.navigate('RequestRefund')}
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
    amountCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    amountLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    amountValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.md,
    },
    amountBreakdown: {
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    breakdownLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    breakdownValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    timelineSection: {
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
      marginBottom: spacing.lg,
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
      marginBottom: spacing.xs,
    },
    timelineLabelCompleted: {
      color: colors.text,
    },
    timelineLabelPending: {
      color: colors.textMuted,
    },
    timelineDate: {
      fontSize: 11,
      color: colors.textMuted,
    },
    detailsSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    detailValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    notesSection: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    notesLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    notesText: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 18,
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

export default RefundTrackingScreen;
