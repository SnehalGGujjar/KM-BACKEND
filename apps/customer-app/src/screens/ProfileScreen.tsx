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
        <Text style={styles.title}>My Profile</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{profile?.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Mobile</Text>
          <Text style={styles.value}>+91 {profile?.phone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{profile?.address}</Text>
        </View>
        <View style={styles.row}>
           <Text style={styles.label}>GPS Sync</Text>
           <Text style={styles.value}>Verified ({profile?.lat?.toFixed(4)}, {profile?.lng?.toFixed(4)})</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={clearAuth}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backBtn: { fontSize: 16, color: '#16a34a', fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  card: { margin: 24, backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 1 },
  row: { marginBottom: 16, borderBottomWidth: 1, borderColor: '#f3f4f6', paddingBottom: 16 },
  label: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  value: { fontSize: 16, color: '#111827', fontWeight: '500' },
  logoutBtn: { marginHorizontal: 24, backgroundColor: '#fee2e2', padding: 16, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#dc2626', fontSize: 16, fontWeight: 'bold' },
});
