import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { RootStackParamList } from '../navigation';
import { api } from '../api';
import { useStore } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

export function ProfileSetupScreen({ navigation }: Props) {
  const setProfile = useStore((state) => state.setProfile);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  useEffect(() => {
    // Fetch available cities
    api.get('/cities/public/')
      .then(res => setCities(res.data.data))
      .catch(err => console.error('Failed to load cities', err));
  }, []);

  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to detect your address.');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      Alert.alert('Success', 'Location captured successfully.');
    } catch (error) {
       Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name || !address || !cityId || !location) {
      Alert.alert('Missing Info', 'Please fill all required fields and capture location.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.put('/auth/profile/customer/', {
        name,
        email,
        address,
        city: cityId,
        lat: location.lat,
        lng: location.lng
      });
      
      if (res.data.success) {
        setProfile(res.data.data); // This updates Zustand and triggers RootNavigator to switch to Home
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Complete Profile</Text>
      <Text style={styles.subtitle}>Let us know where to collect your scrap.</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address (Optional)</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="john@example.com" keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Operating City *</Text>
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

      <View style={styles.formGroup}>
        <Text style={styles.label}>Complete Address *</Text>
        <TextInput 
           style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
           value={address} 
           onChangeText={setAddress} 
           placeholder="Flat No, Building Name, Street..." 
           multiline 
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>GPS Location *</Text>
        {location ? (
          <Text style={styles.successText}>✓ GPS Location Captured ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</Text>
        ) : (
          <TouchableOpacity style={styles.locationBtn} onPress={handleGetLocation} disabled={isFetchingLocation}>
            {isFetchingLocation ? <ActivityIndicator color="#16a34a" /> : <Text style={styles.locationBtnText}>📍 Detect My Location</Text>}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleSaveProfile}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Profile</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 8, marginBottom: 32 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, height: 50, fontSize: 16, color: '#111827' },
  cityCard: { padding: 14, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 8 },
  cityCardActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  cityText: { fontSize: 16, color: '#374151' },
  cityTextActive: { color: '#16a34a', fontWeight: 'bold' },
  locationBtn: { borderWidth: 1, borderColor: '#16a34a', borderRadius: 8, height: 50, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  locationBtnText: { color: '#16a34a', fontSize: 16, fontWeight: '600' },
  successText: { color: '#16a34a', fontSize: 14, fontWeight: '500' },
  button: { backgroundColor: '#16a34a', height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonDisabled: { backgroundColor: '#86efac' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
