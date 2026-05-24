import React, { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const friends = [
  {
    id: 'friend-1',
    name: 'Isabella Davis',
    phone: '(212) 555-0147',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'friend-2',
    name: 'Olivia Williams',
    phone: '(310) 555-0265',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'friend-3',
    name: 'Harper Jackson',
    phone: '(202) 555-0129',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'friend-4',
    name: 'Evelyn White',
    phone: '(718) 555-0246',
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'friend-5',
    name: 'Mia Anderson',
    phone: '(617) 555-0152',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'friend-6',
    name: 'Charlotte Taylor',
    phone: '629.555.0129',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'friend-7',
    name: 'Ralph Edwards',
    phone: '(646) 555-0234',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'friend-8',
    name: 'Ronald Richards',
    phone: '(305) 555-0176',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
  },
];

const InviteFriendsScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [invitedIds, setInvitedIds] = useState([]);

  const handleInvite = friend => {
    setInvitedIds(current => (current.includes(friend.id) ? current : [...current, friend.id]));
    Alert.alert('Invite sent', `${friend.name} has been invited to join the app.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Invite Friends" onBack={() => navigation.goBack()} />

        {friends.map(friend => {
          const invited = invitedIds.includes(friend.id);

          return (
            <View key={friend.id} style={styles.friendRow}>
              <View style={styles.friendMain}>
                <Image source={{ uri: friend.image }} style={styles.avatar} />
                <View style={styles.friendCopy}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendPhone}>{friend.phone}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.inviteChip, invited && styles.inviteChipDone]}
                onPress={() => handleInvite(friend)}
              >
                <Text style={[styles.inviteText, invited && styles.inviteTextDone]}>
                  {invited ? 'Invited' : 'Invite'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  friendRow: {
    marginTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  friendCopy: {
    marginLeft: spacing.md,
    flex: 1,
  },
  friendName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  friendPhone: {
    marginTop: 4,
    color: colors.textMuted,
  },
  inviteChip: {
    minWidth: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  inviteChipDone: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteText: {
    color: colors.surface,
    fontWeight: '700',
  },
  inviteTextDone: {
    color: colors.primary,
  },
});

export default InviteFriendsScreen;
