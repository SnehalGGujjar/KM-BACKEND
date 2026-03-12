import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';
import { useStore } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'OTPVerify'>;

export function OTPVerifyScreen({ route, navigation }: Props) {
  const { phone } = route.params;
  const setAuth = useStore((state) => state.setAuth);
  const setProfile = useStore((state) => state.setProfile);
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the complete OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp/', { 
        phone, 
        otp, 
        purpose: 'LOGIN' 
      });
      
      if (res.data.success) {
        const { access_token, refresh_token, is_new_user, has_partner_profile, has_customer_profile } = res.data.data;
        
        // Customers only app
        if (has_partner_profile && !has_customer_profile && !is_new_user) {
          Alert.alert('Invalid Account', 'This number is registered as a Partner. Please use the Partner app.');
          return;
        }

        await setAuth(access_token, refresh_token);

        // Fetch profile
        try {
           const profileRes = await api.get('/auth/profile/customer/');
           if (profileRes.data.success) {
               setProfile(profileRes.data.data);
           }
        } catch {
           // Ignore, handled by router (it will force ProfileSetup if profile is null)
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify Mobile</Text>
        <Text style={styles.subtitle}>Enter the OTP sent to +91 {phone}</Text>
      </View>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        maxLength={6}
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        editable={!isLoading}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleVerify}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify & Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Change Mobile Number</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#16a34a',
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#86efac',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: '#4b5563',
    fontSize: 15,
  },
});
