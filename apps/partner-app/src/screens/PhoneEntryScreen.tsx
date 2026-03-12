import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneEntry'>;

export function PhoneEntryScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Input', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/send-otp/', { phone: phone, purpose: 'LOGIN' });
      if (res.data.success) {
        navigation.navigate('OTPVerify', { phone });
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Partner Login</Text>
        <Text style={styles.subtitle}>Enter your registered mobile number</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          maxLength={10}
          placeholder="Mobile Number"
          placeholderTextColor="#6b7280"
          value={phone}
          onChangeText={setPhone}
          editable={!isLoading}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleSendOTP}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#111827" />
        ) : (
          <Text style={styles.buttonText}>Get OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  header: { marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#9ca3af', marginTop: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#374151', backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 16, height: 56, marginBottom: 24 },
  prefix: { fontSize: 18, color: '#9ca3af', marginRight: 12, fontWeight: '500' },
  input: { flex: 1, fontSize: 18, color: '#fff' },
  button: { backgroundColor: '#34d399', height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { backgroundColor: '#a7f3d0' },
  buttonText: { color: '#064e3b', fontSize: 18, fontWeight: 'bold' },
});
