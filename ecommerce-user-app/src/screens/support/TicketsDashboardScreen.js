import React, { useState, useMemo, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { ticketApi } from '../../services/api';
import { subscribeTicketEvents } from '../../services/socket';

const STATUS_FILTERS = ['all', 'open', 'in_progress', 'escalated', 'resolved', 'closed'];

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_customer: 'Waiting for You',
  waiting_admin: 'Waiting for Admin',
  escalated: 'Escalated',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLORS = {
  open: '#fcc419',
  in_progress: '#228be6',
  waiting_customer: '#fd7e14',
  waiting_admin: '#6c757d',
  escalated: '#fa5252',
  resolved: '#51cf66',
  closed: '#868e96',
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const PRIORITY_COLORS = {
  low: '#51cf66',
  medium: '#fcc419',
  high: '#fd7e14',
  critical: '#fa5252',
};

const TicketsDashboardScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { authToken } = useAppStore();

  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketApi.getTickets(authToken);
      setTickets(response.data.tickets || []);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets();

    // Subscribe to real-time ticket updates
    const unsubscribeUpdated = subscribeTicketEvents.onTicketUpdated(() => {
      loadTickets();
    });

    const unsubscribeMessage = subscribeTicketEvents.onTicketMessageAdded(() => {
      loadTickets();
    });

    return () => {
      unsubscribeUpdated();
      unsubscribeMessage();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets.filter(ticket => ticket.status === statusFilter);
  }, [tickets, statusFilter]);

  const ticketStats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      escalated: tickets.filter(t => t.status === 'escalated').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
    };
  }, [tickets]);

  const renderTicketItem = ({ item }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item._id })}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketNumber}>{item.ticketNumber || `TKT-${item._id.slice(-6)}`}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#6c757d' }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.ticketSubject}>{item.subject}</Text>
      <Text style={styles.ticketCategory} numberOfLines={1}>
        {item.category || 'General'}
      </Text>
      
      <View style={styles.ticketFooter}>
        <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] || '#6c757d' }]}>
          <Text style={styles.priorityText}>{PRIORITY_LABELS[item.priority] || item.priority}</Text>
        </View>
        <Text style={styles.ticketDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {item.messages && item.messages.length > 0 && (
        <View style={styles.messagePreview}>
          <Text style={styles.messageCount}>{item.messages.length} messages</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.messages[item.messages.length - 1]?.message || 'No messages yet'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="My Tickets" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{ticketStats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#fcc419' }]}>{ticketStats.open}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#228be6' }]}>{ticketStats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#fa5252' }]}>{ticketStats.escalated}</Text>
            <Text style={styles.statLabel}>Escalated</Text>
          </View>
        </View>

        {/* Status Filters */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {STATUS_FILTERS.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  statusFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setStatusFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === filter && styles.filterButtonTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tickets List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading tickets...</Text>
          </View>
        ) : filteredTickets.length > 0 ? (
          <FlatList
            data={filteredTickets}
            keyExtractor={item => item._id}
            renderItem={renderTicketItem}
            scrollEnabled={false}
            contentContainerStyle={styles.ticketsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Tickets Found</Text>
            <Text style={styles.emptyText}>
              {statusFilter === 'all' 
                ? "You haven't created any support tickets yet."
                : `No tickets with status "${STATUS_LABELS[statusFilter] || statusFilter}"`}
            </Text>
            <CustomButton
              title="Create New Ticket"
              onPress={() => navigation.navigate('RaiseTicket')}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        )}

        {/* Create Ticket Button */}
        <CustomButton
          title="Create New Ticket"
          onPress={() => navigation.navigate('RaiseTicket')}
          style={styles.createButton}
        />
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
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: spacing.lg,
      marginHorizontal: -spacing.sm,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      margin: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    filterContainer: {
      marginBottom: spacing.lg,
    },
    filterButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    filterButtonTextActive: {
      color: colors.surfaceLight,
    },
    ticketsList: {
      paddingBottom: spacing.lg,
    },
    ticketCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ticketHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    ticketNumber: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    ticketSubject: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    ticketCategory: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    ticketFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priorityBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    ticketDate: {
      fontSize: 11,
      color: colors.textMuted,
    },
    messagePreview: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    messageCount: {
      fontSize: 11,
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    lastMessage: {
      fontSize: 12,
      color: colors.text,
      fontStyle: 'italic',
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textMuted,
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
      marginBottom: spacing.md,
    },
    createButton: {
      marginTop: spacing.md,
    },
  });

export default TicketsDashboardScreen;
