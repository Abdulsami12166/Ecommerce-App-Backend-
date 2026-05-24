/* global jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-geolocation-service', () => ({
  requestAuthorization: jest.fn(() => Promise.resolve('granted')),
  getCurrentPosition: jest.fn(success =>
    success({
      coords: {
        latitude: 12.9716,
        longitude: 77.5946,
      },
    }),
  ),
}));
