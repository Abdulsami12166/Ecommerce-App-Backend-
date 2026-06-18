import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import colors from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const quickReplies = [
  'Track my order',
  'Need refund help',
  'Change address',
];

const SupportChatScreen = ({ navigation, route }) => {
  const { supportChats, addChatMessage } = useAppStore();
  const [draftMessage, setDraftMessage] = useState('');

  const chat = useMemo(
    () => supportChats.find(item => item.id === route.params?.chatId) || supportChats[0] || null,
    [route.params?.chatId, supportChats],
  );

  const otherChats = useMemo(
    () => supportChats.filter(item => item.id !== chat?.id && item.productId === chat?.productId),
    [chat?.id, chat?.productId, supportChats],
  );

  const orderedMessages = useMemo(
    () => [...(chat?.messages ?? [])].sort((a, b) => a.timestamp - b.timestamp),
    [chat?.messages],
  );

  if (!chat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No support chat available</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backToChatsText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSendMessage = () => {
    if (!draftMessage.trim()) {
      return;
    }

    addChatMessage(chat.id, draftMessage.trim());
    setDraftMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={chat.name}
          onBack={() => navigation.goBack()}
          rightLabel={chat.status}
        />

        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: chat.accent }]}>
            <Text style={styles.avatarText}>{chat.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{chat.name}</Text>
          <Text style={styles.role}>{chat.role}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SupportChat', { chatId: chat.id })}
          >
            <Text style={styles.actionIcon}>S</Text>
            <Text style={styles.actionLabel}>SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SupportCall', { chatId: chat.id, mode: 'voice' })}
          >
            <Text style={styles.actionIcon}>C</Text>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SupportCall', { chatId: chat.id, mode: 'video' })}
          >
            <Text style={styles.actionIcon}>V</Text>
            <Text style={styles.actionLabel}>Video</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backToChats} onPress={() => navigation.navigate('Support')}>
          <Text style={styles.backToChatsText}>View all owner chats</Text>
        </TouchableOpacity>

        <View style={styles.ordersDashboard}>
          <Text style={styles.ordersDashboardTitle}>Other Order Chats</Text>
          {otherChats.map(item => (
            <View key={item.id} style={styles.orderChatRow}>
              <TouchableOpacity
                style={styles.orderChatMain}
                onPress={() => navigation.replace('SupportChat', { chatId: item.id })}
              >
                <View style={[styles.orderChatAvatar, { backgroundColor: item.accent }]}>
                  <Text style={styles.orderChatAvatarText}>{item.name.charAt(0)}</Text>
                </View> 

                <View style={styles.orderChatBody}>
                  <Text style={styles.orderChatName}>{item.name}</Text>
                  <Text numberOfLines={1} style={styles.orderChatRole}>{item.role}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.orderChatActions}>
                <TouchableOpacity
                  style={styles.orderChatAction}
                  onPress={() => navigation.navigate('SupportCall', { chatId: item.id, mode: 'voice' })}
                >

                  <Text style={styles.orderChatActionIcon}>C</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.orderChatAction}
                  onPress={() => navigation.navigate('SupportCall', { chatId: item.id, mode: 'video' })}
                >
                  <Text style={styles.orderChatActionIcon}>V</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.quickReplyRow}>
          {quickReplies.map(reply => (
            <TouchableOpacity
              key={reply}
              style={styles.quickReplyChip}
              onPress={() => setDraftMessage(reply)}
            >
              <Text style={styles.quickReplyText}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </View>


        <View style={styles.chatCard}>
          {orderedMessages.map(message => (
            <View
              key={message.id}
              style={[
                styles.chatBubble,
                message.from === 'user' ? styles.chatBubbleUser : styles.chatBubbleSupport,
              ]}
            >
              <Text
                style={[
                  styles.chatBubbleText,
                  message.from === 'user' && styles.chatBubbleTextUser,
                ]}
              >
                {message.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.composerDock}>
        <TextInput
          value={draftMessage}
          onChangeText={setDraftMessage}
          placeholder="Type a message"
          placeholderTextColor={colors.textMuted}
          style={styles.chatInput}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120 },
  profileCard: {
    marginTop: spacing.lg,
    alignItems: 'center',
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: 28,
    backgroundColor: colors.primary,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  avatarText: {
    color: colors.surface,
    fontSize: 26,
    fontWeight: '800',
  },
  name: {
    marginTop: spacing.md,
    color: colors.surface,
    fontSize: 22,
    fontWeight: '800',
  },
  role: {
    marginTop: 4,
    color: '#F1E2D5',
  },
  actionRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '31%',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  actionIcon: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  actionLabel: {
    marginTop: 8,
    color: colors.text,
    fontWeight: '700',
  },
  backToChats: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  backToChatsText: {
    color: colors.primary,
    fontWeight: '700',
  },
  ordersDashboard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ordersDashboardTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  orderChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderChatMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderChatAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderChatAvatarText: {
    color: colors.surface,
    fontWeight: '800',
  },
  orderChatBody: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  orderChatName: {
    color: colors.text,
    fontWeight: '700',
  },
  orderChatRole: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
  },
  orderChatActions: {
    flexDirection: 'row',
  },
  orderChatAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3E7DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  orderChatActionIcon: {
    color: colors.primary,
    fontWeight: '800',
  },
  quickReplyRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickReplyChip: {
    width: '31%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: '#F0E4D8',
    alignItems: 'center',
  },
  quickReplyText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  chatCard: {
    marginTop: spacing.lg,
  },
  chatBubble: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    maxWidth: '84%',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 8,
  },
  chatBubbleSupport: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5EEE6',
    borderBottomLeftRadius: 8,
  },
  chatBubbleText: {
    color: colors.text,
    lineHeight: 20,
  },
  chatBubbleTextUser: {
    color: colors.surface,
  },
  composerDock: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chatInputContainer: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatInput: {
    flex: 1,
    minHeight: 52,
    maxHeight: 110,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    color: colors.text,
    textAlignVertical: 'top',
  },
  sendButton: {
    marginLeft: spacing.sm,
    minWidth: 78,
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  sendButtonText: {
    color: colors.surface,
    fontWeight: '800',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
});

export default SupportChatScreen;
