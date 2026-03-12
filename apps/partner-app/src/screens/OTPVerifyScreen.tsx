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
        const { access_token, refresh_token, is_new_user, has_customer_profile, has_partner_profile } = res.data.data;
        
        // Partners only app
        if (has_customer_profile && !has_partner_profile && !is_new_user) {
          Alert.alert('Invalid Account', 'This number is registered as a Customer. Please use the Customer app.');
          return;
        }

        await setAuth(access_token, refresh_token);

        try {
           const profileRes = await api.get('/auth/profile/partner/');
           if (profileRes.data.success) {
               setProfile(profileRes.data.data);
           }
        } catch {
           // New partner, profile not found.
           // Zustand defaults to INCOMPLETE which routes to RegistrationScreen
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
        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>Enter OTP sent to +91 {phone}</Text>
      </View>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        maxLength={6}
        placeholder="------"
        placeholderTextColor="#6b7280"
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
          <ActivityIndicator color="#111827" />
        ) : (
          <Text style={styles.buttonText}>Verify & Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Wrong number?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  header: { marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#9ca3af', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#374151', backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 16, height: 64, marginBottom: 24, fontSize: 24, color: '#fff', textAlign: 'center', letterSpacing: 8 },
  button: { backgroundColor: '#34d399', height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  buttonDisabled: { backgroundColor: '#a7f3d0' },
  buttonText: { color: '#064e3b', fontSize: 16, fontWeight: 'bold' },
  backButton: { alignItems: 'center', padding: 12 },
  backButtonText: { color: '#9ca3af', fontSize: 15 },
});
