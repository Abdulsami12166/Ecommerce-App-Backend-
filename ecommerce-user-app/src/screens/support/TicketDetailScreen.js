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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { ticketApi } from '../../services/api';
import { subscribeTicketEvents } from '../../services/socket';

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

const TicketDetailScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { authToken } = useAppStore();

  const { ticketId } = route.params;
  const [ticket, setTicket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadTicketDetail = async () => {
    setLoading(true);
    try {
      const response = await ticketApi.getTicketById(ticketId, authToken);
      setTicket(response.data.ticket);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketDetail();

    // Subscribe to real-time ticket updates
    const unsubscribeUpdated = subscribeTicketEvents.onTicketUpdated((data) => {
      if (data.ticketId === ticketId) {
        loadTicketDetail();
      }
    });

    const unsubscribeMessage = subscribeTicketEvents.onTicketMessageAdded((data) => {
      if (data.ticketId === ticketId) {
        loadTicketDetail();
      }
    });

    return () => {
      unsubscribeUpdated();
      unsubscribeMessage();
    };
  }, [ticketId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Empty Message', 'Please enter a message');
      return;
    }

    setSending(true);
    try {
      await ticketApi.addMessage(ticketId, { message: newMessage }, authToken);
      setNewMessage('');
      await loadTicketDetail();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReopenTicket = async () => {
    Alert.alert(
      'Reopen Ticket',
      'Are you sure you want to reopen this ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reopen',
          onPress: async () => {
            try {
              await ticketApi.updateTicketStatus(ticketId, { status: 'open' }, authToken);
              await loadTicketDetail();
              Alert.alert('Success', 'Ticket reopened successfully');
            } catch (error) {
              Alert.alert('Error', error?.message || 'Failed to reopen ticket');
            }
          },
        },
      ]
    );
  };

  const handleCloseTicket = async () => {
    Alert.alert(
      'Close Ticket',
      'Are you sure you want to close this ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          onPress: async () => {
            try {
              await ticketApi.updateTicketStatus(ticketId, { status: 'closed' }, authToken);
              await loadTicketDetail();
              Alert.alert('Success', 'Ticket closed successfully');
            } catch (error) {
              Alert.alert('Error', error?.message || 'Failed to close ticket');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Ticket Details" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading ticket details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Ticket Details" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Ticket not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canReply = ticket.status !== 'closed' && ticket.status !== 'resolved';
  const canReopen = ticket.status === 'closed' || ticket.status === 'resolved';
  const canClose = ticket.status !== 'closed';

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Ticket Details" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Ticket Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.ticketNumber}>{ticket.ticketNumber || `TKT-${ticket._id.slice(-6)}`}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[ticket.status] || '#6c757d' }]}>
                <Text style={styles.statusText}>{STATUS_LABELS[ticket.status] || ticket.status}</Text>
              </View>
            </View>

            <Text style={styles.subject}>{ticket.subject}</Text>
            <Text style={styles.category}>{ticket.category || 'General'}</Text>

            <View style={styles.infoRow}>
              <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[ticket.priority] || '#6c757d' }]}>
                <Text style={styles.priorityText}>{PRIORITY_LABELS[ticket.priority] || ticket.priority}</Text>
              </View>
              <Text style={styles.date}>
                Created on {new Date(ticket.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.description}>{ticket.description}</Text>
            </View>
          </View>

          {/* Conversation Thread */}
          <View style={styles.conversationSection}>
            <Text style={styles.sectionTitle}>Conversation</Text>

            {ticket.messages && ticket.messages.length > 0 ? (
              ticket.messages.map((message, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    message.senderType === 'user' ? styles.userMessage : styles.adminMessage,
                  ]}
                >
                  <Text style={styles.messageSender}>
                    {message.senderType === 'user' ? 'You' : 'Support Team'}
                  </Text>
                  <Text style={styles.messageText}>{message.message}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(message.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyConversation}>
                <Text style={styles.emptyConversationText}>No messages yet</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            {canReopen && (
              <CustomButton
                title="Reopen Ticket"
                onPress={handleReopenTicket}
                style={styles.reopenButton}
              />
            )}
            {canClose && (
              <CustomButton
                title="Close Ticket"
                onPress={handleCloseTicket}
                style={styles.closeButton}
                textStyle={{ color: colors.text }}
              />
            )}
          </View>
        </ScrollView>

        {/* Message Input */}
        {canReply && (
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message..."
              placeholderTextColor={colors.textMuted}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
            />
            <CustomButton
              title={sending ? 'Sending...' : 'Send'}
              onPress={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              style={styles.sendButton}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = colors =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardContainer: {
      flex: 1,
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
      marginTop: spacing.md,
      fontSize: 14,
      color: colors.textMuted,
    },
    errorText: {
      fontSize: 16,
      color: colors.text,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
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
      fontSize: 11,
      fontWeight: '600',
      color: 'white',
    },
    subject: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    category: {
      fontSize: 14,
      color: colors.primary,
      marginBottom: spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    priorityBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    priorityText: {
      fontSize: 11,
      fontWeight: '600',
      color: 'white',
    },
    date: {
      fontSize: 12,
      color: colors.textMuted,
    },
    descriptionSection: {
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    descriptionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    description: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    conversationSection: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.md,
    },
    messageBubble: {
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      maxWidth: '85%',
    },
    userMessage: {
      backgroundColor: colors.primary,
      alignSelf: 'flex-end',
      marginLeft: 'auto',
    },
    adminMessage: {
      backgroundColor: colors.surfaceSecondary,
      alignSelf: 'flex-start',
    },
    messageSender: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    messageText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    messageTime: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    emptyConversation: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyConversationText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    actionsSection: {
      marginBottom: spacing.lg,
    },
    reopenButton: {
      marginBottom: spacing.md,
    },
    closeButton: {
      backgroundColor: colors.surfaceMuted,
    },
    messageInputContainer: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    messageInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: spacing.md,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    sendButton: {
      minHeight: 44,
    },
  });

export default TicketDetailScreen;
