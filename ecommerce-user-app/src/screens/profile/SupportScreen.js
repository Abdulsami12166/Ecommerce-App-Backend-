import React, { useMemo } from 'react';
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
// import { useThemeColors } from '../../theme/colors';
import colors from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const SupportScreen = ({ navigation, route }) => {
  const { supportChats } = useAppStore();
  const fromOrder = route.params?.fromOrder;
  const productChatId = route.params?.chatId;
  const orderedChats = useMemo(
    () =>
      [...(productChatId ? supportChats.filter(chat => chat.id === productChatId) : supportChats)].sort((a, b) => {
        const aTime = a.messages[a.messages.length - 1]?.timestamp || 0;
        const bTime = b.messages[b.messages.length - 1]?.timestamp || 0;
        return bTime - aTime;
      }),
    [productChatId, supportChats],
  );
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Chats" onBack={() => navigation.goBack()} />

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Support Dashboard</Text>
          <Text style={styles.heroSubtitle}>
            Chat with different product owners and reach them by SMS, voice call, or video call.
          </Text>
        </View>

        {/* Quick Actions for Support */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('TicketsDashboard')}
          >
            <Text style={styles.quickActionIcon}>🎫</Text>
            <Text style={styles.quickActionLabel}>My Tickets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('RequestReturn')}
          >
            <Text style={styles.quickActionIcon}>📦</Text>
            <Text style={styles.quickActionLabel}>Return Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('RequestReplacement')}
          >
            <Text style={styles.quickActionIcon}>🔄</Text>
            <Text style={styles.quickActionLabel}>Replace Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('RequestRefund')}
          >
            <Text style={styles.quickActionIcon}>💰</Text>
            <Text style={styles.quickActionLabel}>Request Refund</Text>
          </TouchableOpacity>
        </View>

        {/*
          <View style={styles.row}>
            {['All', 'Orders', 'Products', 'Account'].map(category => (
              <TouchableOpacity key={category} style={styles.categoryButton}>
                <Text style={styles.categoryButtonText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        */}
        {fromOrder ? (
          <View style={styles.orderBanner}>
            <Text style={styles.orderBannerTitle}>Order placed successfully</Text>
            <Text style={styles.orderBannerText}>
              Pick any owner chat below for quick SMS support about delivery, address, or product questions.
            </Text>
          </View>
        ) : null}

        <View style={styles.searchBar}>
          <TextInput
            editable={false}
            placeholder="Search support chats"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>
        {!orderedChats.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No product support chats yet</Text>
            <Text style={styles.emptyText}>
              Open support from a product page to start a chat for that specific product.
            </Text>
          </View>
        ) : null}
        {orderedChats.map(chat => {
          const lastMessage = chat.messages[chat.messages.length - 1];
          return (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatRow}
              onPress={() => navigation.navigate('SupportChat', { chatId: chat.id })}
            >
              <View style={[styles.avatar, { backgroundColor: chat.accent }]}>
                <Text style={styles.avatarText}>{chat.name.charAt(0)}</Text>
              </View>

              <View style={styles.chatBody}>
                <View style={styles.chatTopRow}>
                  <Text style={styles.chatName}>{chat.name}</Text>
                  <Text style={styles.chatTime}>
                    {lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : ''}
                  </Text>
                </View>

                <Text style={styles.chatRole}>{chat.role}</Text>
                <Text numberOfLines={1} style={styles.chatPreview}>
                  {lastMessage?.text || 'No messages yet'}
                </Text>
              </View>
              <View style={styles.statusWrap}>
                <Text style={styles.statusText}>{chat.status}</Text>
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    style={styles.rowActionButton}
                    onPress={() => navigation.navigate('SupportCall', { chatId: chat.id, mode: 'voice' })}
                  >
                    <Text style={styles.rowActionIcon}>C</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rowActionButton}
                    onPress={() => navigation.navigate('SupportCall', { chatId: chat.id, mode: 'video' })}
                  >
                    <Text style={styles.rowActionIcon}>V</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    chat.status === 'Online' ? styles.statusOnline : styles.statusAway,
                  ]}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heroCard: {
    marginTop: spacing.lg,
    // backgroundColor: 'red',
    // backgroundColor: colors.surface,
    // borderWidth: 1,
    // borderColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border, 
    padding: spacing.lg,
    borderRadius: 28,
    backgroundColor: colors.primary,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 24,
    // backgroundColor: 'red',
    // padding: spacing.sm,
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    color: '#F1E2D5',
    lineHeight: 22,
  },
  orderBanner: {
    marginTop: spacing.lg,
    padding: spacing.md,
    // backgroundColor: 'red',
    // backgroundColor: colors.surface,
    // borderWidth: 1,
    // borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: '#F2E6DA',
    borderWidth: 1,
    borderColor: '#E3D0BE',
  },
  orderBannerTitle: {
    color: colors.primary,
    fontWeight: '800',
  },
  orderBannerText: {
    marginTop: 6,
    color: colors.text,
    lineHeight: 20,
  },
  searchBar: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    // backgroundColor: 'red',
    //fromOrder ? '#F2E6DA' : colors.surface,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  chatRow: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '800',
  },
  chatBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  chatTime: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  chatRole: {
    marginTop: 4,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  chatPreview: {
    marginTop: 6,
    color: colors.textMuted,
  },
  statusWrap: {
    alignItems: 'center',
    minWidth: 52,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  rowActions: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  rowActionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3E7DB',
    //fromOrder ? '#F2E6DA' : '#F3E7DB',
    // backgroundColor: 'red',
    // backgroundColor: colors.surface,
    // borderWidth: 1,
    // borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  rowActionIcon: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOnline: {
    backgroundColor: '#2E7D32',
  },
  statusAway: {
    backgroundColor: '#D9A441',
  },
  emptyCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 8,
    color: colors.textMuted,
    lineHeight: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});

export default SupportScreen;
