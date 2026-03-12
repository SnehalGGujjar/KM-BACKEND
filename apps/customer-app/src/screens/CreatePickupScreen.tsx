import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePickup'>;

// Assuming shared-constants later
const PREFERRED_SLOTS = ['09:00 AM - 12:00 PM', '12:00 PM - 03:00 PM', '03:00 PM - 06:00 PM'];

export function CreatePickupScreen({ navigation }: Props) {
  const [dateStr, setDateStr] = useState(''); // simple input for MVP, e.g. "2026-10-31"
  const [slot, setSlot] = useState(PREFERRED_SLOTS[0]);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!dateStr || !slot) {
      Alert.alert('Required Fields', 'Please select a date and slot.');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app we'd upload the photo to Cloudinary first and send the URL
      // For this spec sprint, we assume Cloudinary happens via Multer or direct SDK
      
      const payload = {
        pickup_date: dateStr, // YYYY-MM-DD
        pickup_slot: slot,
        scrap_description: description,
        // scrap_photo_urls: [] 
      };

      const res = await api.post('/orders/customer/create/', payload);
      if (res.data.success) {
        Alert.alert('Success', 'Pickup scheduled successfully!');
        navigation.replace('Home');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to schedule pickup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Schedule Pickup</Text>
      <Text style={styles.subtitle}>Select when you want us to arrive.</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Pickup Date (YYYY-MM-DD) *</Text>
        <TextInput 
          style={styles.input} 
          value={dateStr} 
          onChangeText={setDateStr} 
          placeholder="e.g. 2026-03-15"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Preferred Time Slot *</Text>
        <View style={styles.slotGrid}>
          {PREFERRED_SLOTS.map((s) => (
            <TouchableOpacity 
              key={s} 
              style={[styles.slotCard, slot === s && styles.slotCardActive]}
              onPress={() => setSlot(s)}
            >
              <Text style={[styles.slotText, slot === s && styles.slotTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Scrap Photo (Optional)</Text>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        ) : (
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <Text style={styles.photoBtnText}>📷 Upload Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput 
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
          value={description} 
          onChangeText={setDescription} 
          placeholder="e.g. Have around 15kgs of old newspapers and some iron." 
          multiline 
        />
      </View>

      <TouchableOpacity 
        style={[styles.submitBtn, isLoading && { opacity: 0.7 }]} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Confirm Pickup</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { marginTop: 30, marginBottom: 20 },
  backText: { fontSize: 16, color: '#16a34a', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 8, marginBottom: 32 },
  
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, height: 50, fontSize: 16 },
  
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotCard: { paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb' },
  slotCardActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  slotText: { fontSize: 14, color: '#4b5563' },
  slotTextActive: { color: '#16a34a', fontWeight: 'bold' },

  photoBtn: { height: 100, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  photoBtnText: { color: '#6b7280', fontSize: 16 },
  previewImage: { width: '100%', height: 200, borderRadius: 8 },

  submitBtn: { backgroundColor: '#16a34a', height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
