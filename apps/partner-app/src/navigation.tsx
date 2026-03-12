import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from './store';

import { SplashScreen } from './screens/SplashScreen';
import { PhoneEntryScreen } from './screens/PhoneEntryScreen';
import { OTPVerifyScreen } from './screens/OTPVerifyScreen';
import { RegistrationScreen } from './screens/RegistrationScreen';
import { PendingApprovalScreen } from './screens/PendingApprovalScreen';
import { RejectedScreen } from './screens/RejectedScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ActiveOrderScreen } from './screens/ActiveOrderScreen';
import { OrderHistoryScreen } from './screens/OrderHistoryScreen';
import { WalletScreen } from './screens/WalletScreen';
import { PricingScreen } from './screens/PricingScreen';
import { RateRequestScreen } from './screens/RateRequestScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { ProfileScreen } from './screens/ProfileScreen';

export type RootStackParamList = {
  Splash: undefined;
  PhoneEntry: undefined;
  OTPVerify: { phone: string };
  Registration: undefined;
  PendingApproval: undefined;
  Rejected: { reason: string };
  Dashboard: undefined;
  ActiveOrder: { orderId: number };
  OrderHistory: undefined;
  Wallet: undefined;
  Pricing: undefined;
  RateRequest: undefined;
  Notifications: undefined;
  Profile: undefined;
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
          // Logged In Flow - Strict Gating by approval_status
          profile?.approval_status === 'APPROVED' ? (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="ActiveOrder" component={ActiveOrderScreen} />
              <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
              <Stack.Screen name="Wallet" component={WalletScreen} />
              <Stack.Screen name="Pricing" component={PricingScreen} />
              <Stack.Screen name="RateRequest" component={RateRequestScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </>
          ) : profile?.approval_status === 'PENDING' ? (
            <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
          ) : profile?.approval_status === 'REJECTED' ? (
            <Stack.Screen name="Rejected" component={RejectedScreen} initialParams={{ reason: profile.rejection_reason || 'Document verification failed.' }} />
          ) : (
            // INCOMPLETE or missing
            <Stack.Screen name="Registration" component={RegistrationScreen} />
          )
        ) : (
          // Unauthenticated Flow
          <>
            <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
            <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
