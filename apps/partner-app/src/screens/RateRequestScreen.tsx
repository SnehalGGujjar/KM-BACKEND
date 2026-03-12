import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'RateRequest'>;

export function RateRequestScreen({ navigation }: Props) {
  const [categoryId, setCategoryId] = useState<string>('');
  const [requestedPrice, setRequestedPrice] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!categoryId || !requestedPrice || !reason) {
      Alert.alert('Incomplete', 'Please fill all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/pricing/partner/requests/', {
        category_id: parseInt(categoryId, 10),
        requested_rate: parseFloat(requestedPrice),
        reason
      });
      if (res.data.success) {
        Alert.alert('Submitted', 'Your rate bump request has been sent to the admin.');
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backBtn}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rate Bump Request</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.helper}>
          If you are unable to fulfill orders at the current platform rates, you can request a dedicated rate bump. 
          Admins will review this request.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Scrap Category ID (Temp Input)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={categoryId} onChangeText={setCategoryId} placeholder="e.g. 1" placeholderTextColor="#6b7280" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Requested Price (₹/kg) *</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={requestedPrice} onChangeText={setRequestedPrice} placeholder="e.g. 12.50" placeholderTextColor="#6b7280" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Reason for change *</Text>
          <TextInput 
             style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
             multiline 
             value={reason} 
             onChangeText={setReason} 
             placeholder="Explain why you need this rate..." 
             placeholderTextColor="#6b7280" 
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, isLoading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#111827" /> : <Text style={styles.submitText}>Submit Request</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#111827', borderBottomWidth: 1, borderColor: '#1f2937' },
  backBtn: { fontSize: 16, color: '#34d399', fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f9fafb' },
  content: { padding: 24 },
  helper: { color: '#9ca3af', lineHeight: 22, marginBottom: 32 },
  
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#d1d5db', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: '#374151', backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 16, height: 50, fontSize: 16, color: '#f9fafb' },
  
  submitBtn: { backgroundColor: '#34d399', height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  submitText: { color: '#064e3b', fontSize: 16, fontWeight: 'bold' },
});
