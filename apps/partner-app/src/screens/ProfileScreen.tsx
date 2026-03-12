import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const profile = useStore((state) => state.profile);
  const clearAuth = useStore((state) => state.clearAuth);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Partner Profile</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Legal Name</Text>
          <Text style={styles.value}>{profile?.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Mobile</Text>
          <Text style={styles.value}>+91 {profile?.phone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>KYC Status</Text>
          <Text style={[styles.value, { color: '#34d399' }]}>{profile?.approval_status}</Text>
        </View>
        <View style={styles.row}>
           <Text style={styles.label}>Overall Rating</Text>
           <Text style={[styles.value, { color: '#fbbf24' }]}>⭐ {profile?.rating} / 5</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={clearAuth}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionInfo}>Kabadi Man Partner App v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#111827', borderBottomWidth: 1, borderColor: '#1f2937' },
  backBtn: { fontSize: 16, color: '#34d399', fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f9fafb' },
  card: { margin: 24, backgroundColor: '#1f2937', borderRadius: 12, padding: 20, elevation: 1 },
  row: { marginBottom: 16, borderBottomWidth: 1, borderColor: '#374151', paddingBottom: 16 },
  label: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  value: { fontSize: 16, color: '#f9fafb', fontWeight: '500' },
  logoutBtn: { marginHorizontal: 24, backgroundColor: '#7f1d1d', padding: 16, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#fca5a5', fontSize: 16, fontWeight: 'bold' },
  versionInfo: { textAlign: 'center', color: '#4b5563', marginTop: 32, fontSize: 12 },
});
