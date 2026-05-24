import { PermissionsAndroid, Platform } from 'react-native';

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'ios') {
    return true;
  }
// // if(android){
//  permissions = await PermissionsAndroid.check(
//     PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
//   );
  if (Platform.Version < 33) {
    return true;
  }

  const alreadyGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  if (alreadyGranted) {
    return true;
  }
//if(not enabled){
//  request permission and then if granted +1
// }else {
//   map through notifications and +1 for each
// }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const getNotificationPermissionStatus = async () => {
  if (Platform.OS === 'ios') {
    return true;
  }

  if (Platform.Version<33) {
    return true;
  }
// if(android){
//  return await PermissionsAndroid.check(
//     PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
//   );
  return await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
};

export const showLocalNotification=async () => {
  return requestNotificationPermission();
};
