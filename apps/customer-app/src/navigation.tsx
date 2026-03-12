import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from './store';

// Importing screens (to be created next)
import { SplashScreen } from './screens/SplashScreen';
import { PhoneEntryScreen } from './screens/PhoneEntryScreen';
import { OTPVerifyScreen } from './screens/OTPVerifyScreen';
import { ProfileSetupScreen } from './screens/ProfileSetupScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CreatePickupScreen } from './screens/CreatePickupScreen';
import { CurrentOrderScreen } from './screens/CurrentOrderScreen';
import { OrderHistoryScreen } from './screens/OrderHistoryScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import { PricingScreen } from './screens/PricingScreen';
import { RatingScreen } from './screens/RatingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { RecyclingInfoScreen } from './screens/RecyclingInfoScreen';

export type RootStackParamList = {
  Splash: undefined;
  PhoneEntry: undefined;
  OTPVerify: { phone: string };
  ProfileSetup: undefined;
  Home: undefined;
  CreatePickup: undefined;
  CurrentOrder: { orderId: number };
  OrderHistory: undefined;
  OrderDetail: { orderId: number };
  Pricing: undefined;
  Rating: { orderId: number };
  Profile: undefined;
  Notifications: undefined;
  RecyclingInfo: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isHydrated, isAuthenticated, profile } = useStore();

  if (!isHydrated) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Logged In Flow
          profile?.is_active ? (
            // Profile Setup Complete
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="CreatePickup" component={CreatePickupScreen} />
              <Stack.Screen name="CurrentOrder" component={CurrentOrderScreen} />
              <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
              <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
              <Stack.Screen name="Pricing" component={PricingScreen} />
              <Stack.Screen name="Rating" component={RatingScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="RecyclingInfo" component={RecyclingInfoScreen} />
            </>
          ) : (
             // Missing Profile Info
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          )
        ) : (
          // Auth Flow
          <>
            <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
            <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
