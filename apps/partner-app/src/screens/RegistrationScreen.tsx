import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { RootStackParamList } from '../navigation';
import { api } from '../api';
import { useStore } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Registration'>;

export function RegistrationScreen({ navigation }: Props) {
  const setProfile = useStore((state) => state.setProfile);
  
  const [name, setName] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  
  // Document placeholders for the MVP spec
  const [aadhaarUrl, setAadhaarUrl] = useState<string | null>(null);
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.get('/cities/public/')
      .then(res => setCities(res.data.data))
      .catch(err => console.error(err));
  }, []);

  const pickDocument = async (type: 'aadhaar' | 'license') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled && result.assets.length > 0) {
        if (type === 'aadhaar') setAadhaarUrl('uploaded_doc_ref_' + Date.now());
        if (type === 'license') setLicenseUrl('uploaded_doc_ref_' + Date.now());
      }
    } catch (err) {
      console.log('Document picker error', err);
    }
  };

  const handleSubmit = async () => {
    if (!name || !cityId || !aadhaarUrl || !licenseUrl) {
      Alert.alert('Missing Fields', 'Please fill all required fields and upload documents.');
      return;
    }

    setIsLoading(true);
    try {
      // Create profile sets status to PENDING
      const payload = {
        name,
        city: cityId,
        document_aadhaar_url: aadhaarUrl,
        document_license_url: licenseUrl,
      };

      const res = await api.put('/auth/profile/partner/', payload);
      
      if (res.data.success) {
        setProfile({ ...res.data.data, approval_status: 'PENDING' });
      }
    } catch (err: any) {
      Alert.alert('Registration Error', err.response?.data?.error || 'Failed to submit registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Partner Onboarding</Text>
      <Text style={styles.subtitle}>Complete KYC and start earning today.</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Legal Name *</Text>
        <TextInput 
           style={styles.input} 
           value={name} 
           onChangeText={setName} 
           placeholder="As per Aadhaar" 
           placeholderTextColor="#4b5563"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Operating City *</Text>
        <View style={styles.cityGrid}>
          {cities.map(c => (
            <TouchableOpacity 
               key={c.id} 
               style={[styles.cityCard, cityId === c.id && styles.cityCardActive]}
               onPress={() => setCityId(c.id)}
            >
               <Text style={[styles.cityText, cityId === c.id && styles.cityTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Aadhaar Card (PDF/Image) *</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickDocument('aadhaar')}>
           <Text style={styles.uploadBtnText}>
             {aadhaarUrl ? '✅ Document Attached' : '⬆️ Upload Aadhaar'}
           </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Driving License or Vehicle Doc *</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickDocument('license')}>
           <Text style={styles.uploadBtnText}>
             {licenseUrl ? '✅ Document Attached' : '⬆️ Upload License'}
           </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color="#111827" /> : <Text style={styles.buttonText}>Submit for Verification</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 24, paddingBottom: 60, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#9ca3af', marginTop: 8, marginBottom: 32 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#d1d5db', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#374151', backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 16, height: 50, fontSize: 16, color: '#fff' },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cityCard: { padding: 12, borderWidth: 1, borderColor: '#374151', borderRadius: 8, backgroundColor: '#1f2937' },
  cityCardActive: { borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)' },
  cityText: { fontSize: 14, color: '#9ca3af' },
  cityTextActive: { color: '#34d399', fontWeight: 'bold' },
  uploadBtn: { borderWidth: 1, borderColor: '#374151', borderRadius: 8, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f2937', borderStyle: 'dashed' },
  uploadBtnText: { color: '#9ca3af', fontSize: 16, fontWeight: '500' },
  button: { backgroundColor: '#34d399', height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonDisabled: { backgroundColor: '#a7f3d0' },
  buttonText: { color: '#064e3b', fontSize: 16, fontWeight: 'bold' },
});
