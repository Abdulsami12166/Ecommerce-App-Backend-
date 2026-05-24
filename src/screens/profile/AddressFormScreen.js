import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
//adding adresss from prfile scrn
const AddressFormScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
//const [temp , settemp] = useState(0)
  // const temp = setInterval(() => {
  //   console.log('hello')
  // }, 1000);
  const { savedAddresses, saveAddress } = useAppStore();
  const editingAddress = useMemo(
    () => savedAddresses.find(item => item.id === route.params?.addressId) || null,
    [route.params?.addressId, savedAddresses],

  );
  // ()=>{
  //   // setInterval(() => {
  //   //   console.log('hello')
  //   // }, 1000);
  // }
  const [form, setForm] = useState(() => ({
    title: editingAddress?.title || '',
    address: editingAddress?.address || '',
    selected: editingAddress?.selected || false,
  }));

  const handleSave = () => {
    if (!form.title.trim() || !form.address.trim()) {
      Alert.alert('Complete address', 'Please enter both address title and full address.');
      return;
    }
    // if(form.address.trim() === ''){
    //function temp(){
    // setInterval(() => {
      //for.Each((map(idx)) => {
        // console.log(title)
      // }, 1000);
    // }, 1000);
    //}


    saveAddress({
      id: editingAddress?.id,
      title: form.title.trim(),
      address: form.address.trim(),
      selected: form.selected,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={editingAddress ? 'Edit Address' : 'Add Address'}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.card}>
          <CustomInput
            label="Address Label"
            placeholder="Home, Office, Studio"
            value={form.title}
            onChangeText={value => setForm(current => ({ ...current, title: value }))}
          />
          {/* setFrom
          (current => ({ ...current, title: value })
          )
          setFrom */}
          <CustomInput
            label="Full Address"
            placeholder="Enter complete delivery address"
            value={form.address}
            onChangeText={value => setForm(current => ({ ...current, address: value }))}
          />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Set As Default</Text>
              <Text style={styles.toggleSubtitle}>Use this as the main delivery address</Text>
            </View>
            {/*
              <Switch
                value={form.selected}
                onValueChange={value => setForm(current => ({ ...current, selected: value }))}
                trackColor={{ false: '#D8CCC1', true: '#C8B19B' }}
                thumbColor={form.selected ? colors.primary : colors.surface}
              />
            */}
            <Switch
              value={form.selected}
              onValueChange={value => setForm(current => ({ ...current, selected: value }))}
              trackColor={{ false: '#D8CCC1', true: '#C8B19B' }}
              thumbColor={form.selected ? colors.primary : colors.surface}
            />
          </View>

          <CustomButton
            title={editingAddress ? 'Update Address' : 'Save Address'}
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    // backgroundColor: 'red',
    // backgroundColor: colors.surface,
    // borderWidth: 1,
    // borderColor: colors.border,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  toggleTitle: {
    color: colors.text,
    // backgroundColor: 'red',
    // padding: spacing.sm,
    fontWeight: '700',
  },
  toggleSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    // backgroundColor: 'red',
    // padding: spacing.sm,
    lineHeight: 20,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});

export default AddressFormScreen;
