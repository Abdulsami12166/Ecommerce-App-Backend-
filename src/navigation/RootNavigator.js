import React from 'react'
  import { createNativeStackNavigator } from '@react-navigation/native-stack'

import Login from '../screens/auth/Login'
import ForgotPassword from '../screens/auth/ForgotPassword'
   import OTP from '../screens/auth/OTP'
  import Register from '../screens/auth/Register'
// Admin screens disabled in main ecommerce app (use separate admin-app instead)
import AdminLoginScreen from '../screens/admin/AdminLoginScreen'

// Admin screens (embedded into main ecommerce app)
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen'



import CartScreen from '../screens/cart/CartScreen'

    import CheckoutScreen from '../screens/checkout/CheckoutScreen'
import PaymentScreen from '../screens/checkout/PaymentScreen'

import CategoriesScreen from '../screens/home/CategoriesScreen'
import HomeScreen from '../screens/home/HomeScreen'
   import ProductDetails from '../screens/home/ProductDetails'
import SearchScreen from '../screens/home/SearchScreen'
  import SpecialOffersScreen from '../screens/home/SpecialOffersScreen'

import NotificationScreen from '../screens/notifications/NotificationScreen'

 import Screen1 from '../screens/onboarding/Screen1'
   import Screen2 from '../screens/onboarding/Screen2'
 import Screen3 from '../screens/onboarding/Screen3'
  import SplashScreen from '../screens/onboarding/SplashScreen'

import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen'
  import OrdersScreen from '../screens/orders/OrdersScreen'
 import OrderSuccessScreen from '../screens/orders/OrderSuccessScreen'
   import TrackOrderScreen from '../screens/orders/TrackOrderScreen'

 import AddressFormScreen from '../screens/profile/AddressFormScreen'
 import AddMoneyScreen from '../screens/profile/AddMoneyScreen'
   import AddressesScreen from '../screens/profile/AddressesScreen'
 import CustomerCareScreen from '../screens/profile/CustomerCareScreen'
 import InviteFriendsScreen from '../screens/profile/InviteFriendsScreen'
 import WalletScreen from '../screens/profile/WalletScreen'
 import PaymentMethodFormScreen from '../screens/profile/PaymentMethodFormScreen'
 import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen'
 import PrivacyPolicyScreen from '../screens/profile/PrivacyPolicyScreen'
   import ProfileScreen from '../screens/profile/ProfileScreen'
 import SupportCallScreen from '../screens/profile/SupportCallScreen'
 import SupportChatScreen from '../screens/profile/SupportChatScreen'
  import SupportScreen from '../screens/profile/SupportScreen'

import WishlistScreen from '../screens/wishlist/WishlistScreen'

const Stack = createNativeStackNavigator()

          const RootNavigator = () => {

   
   // keeping all into root navgtr 

  return (

      <Stack.Navigator
 initialRouteName='Splash'

    screenOptions={{
 headerShown:false,
    
        //animation:'fade_from_bottom',
 
     animation:'slide_from_right'
    }}

>

{/* first intro screens stuff */}
{/* component={ordersScreen} */}

      <Stack.Screen
      name="Splash"
      component={SplashScreen}
      />

   <Stack.Screen name="Screen1" component={Screen1} />
  <Stack.Screen name="Screen2" component={Screen2} />
   <Stack.Screen name="Screen3" component={Screen3} />

{/* login register flow */}

   <Stack.Screen name="Login" component={Login} />
<Stack.Screen name="ForgotPassword" component={ForgotPassword} />
<Stack.Screen name="Register" component={Register} />
<Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
<Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />



{/* otp screen  later  connectt to firbse */}
  <Stack.Screen
    name="OTP"
  component={OTP}
/>

{/* app main side */}

    <Stack.Screen name="Home" component={HomeScreen} />

       <Stack.Screen
    name="ProductDetails"
     component={ProductDetails}
    />

     <Stack.Screen name="Search" component={SearchScreen} />

<Stack.Screen
      name="Categories"
component={CategoriesScreen}
/>

   <Stack.Screen
name="SpecialOffers"
    component={SpecialOffersScreen}
/>

{/* cart and payment */}

   <Stack.Screen name="Cart" component={CartScreen} />

       <Stack.Screen
         name="Checkout"
             component={CheckoutScreen}
/>

<Stack.Screen name="Payment" component={PaymentScreen} />

     <Stack.Screen
    name="Wishlist"
      component={WishlistScreen}
/>

    <Stack.Screen
    name="Notifications"
    component={NotificationScreen}
    />

    {/* profile screens */}

    <Stack.Screen name="Profile" component={ProfileScreen} />

          <Stack.Screen
          name="PaymentMethods"
          component={PaymentMethodsScreen}
          />

    <Stack.Screen
    name="PaymentMethodForm"
    component={PaymentMethodFormScreen}
    />

      <Stack.Screen
      name="Addresses"
      component={AddressesScreen}
      />

    <Stack.Screen
    name="AddressForm"
    component={AddressFormScreen}
    />

    <Stack.Screen
    name="AddMoney"
    component={AddMoneyScreen}
    />

    <Stack.Screen
    name="CustomerCare"
    component={CustomerCareScreen}
    />

    <Stack.Screen
    name="InviteFriends"
    component={InviteFriendsScreen}
    />

    <Stack.Screen
    name="PrivacyPolicy"
    component={PrivacyPolicyScreen}
    />

    <Stack.Screen
    name="Wallet"
    component={WalletScreen}
    />

{/* support page not fully completed still */}
<Stack.Screen name="Support" component={SupportScreen} />
<Stack.Screen name="SupportChat" component={SupportChatScreen} />
<Stack.Screen name="SupportCall" component={SupportCallScreen} />

{/* orders area */}

     <Stack.Screen name="Orders" component={OrdersScreen} />

                <Stack.Screen
                name="OrderDetails"
                component={OrderDetailsScreen}
                />

            <Stack.Screen
            name="OrderSuccess"
            component={OrderSuccessScreen}
            />

          <Stack.Screen
          name="TrackOrder"
          component={TrackOrderScreen}
          />

</Stack.Navigator>

  )
}

export default RootNavigator
