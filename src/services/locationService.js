import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export const getLocationPermissionStatus = async () => {
  if (Platform.OS==='ios') {
    const status = await Geolocation.requestAuthorization('whenInUse');
    return status === 'granted';
  }
  // //if(android){
  //  statues = await PermissionsAndroid.check(
  //   PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  // );

const fineGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  const coarseGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  );

  return fineGranted||coarseGranted;
};

export const requestLocationPermission = async () => {
  if (Platform.OS==='ios') {
    const status = await Geolocation.requestAuthorization('whenInUse');
    return status==='granted';
  }

  const fineGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  const coarseGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  );

  if (fineGranted || coarseGranted) {
    return true;
  }

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);

  return (
    result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED ||
    result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED
  );
};

export const getCurrentLocation = async () => {
  const granted = await requestLocationPermission();

  if (!granted) {
    throw new Error(
      'Location permission was denied. Please enable it in app settings.',
    );
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve(position);
      },
      error => {
        if (error?.code === 5) {
          reject(
            new Error(
              'Location service is turned off on this device. Please enable GPS/location and try again.',
            ),
          );
          return;
        }

        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  });
};
