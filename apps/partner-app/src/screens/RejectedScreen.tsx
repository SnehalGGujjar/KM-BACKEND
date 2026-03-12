import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Rejected'>;

export function RejectedScreen({ route, navigation }: Props) {
  const { reason } = route.params;
  const clearAuth = useStore((state) => state.clearAuth);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>❌</Text>
      <Text style={styles.title}>Application Rejected</Text>
      <Text style={styles.subtitle}>
        Unfortunately, your partner application was not approved.
      </Text>

      <View style={styles.reasonBox}>
        <Text style={styles.reasonLabel}>Reason from Admin:</Text>
        <Text style={styles.reasonText}>{reason}</Text>
      </View>

      <Text style={styles.infoText}>
        If you believe this is a mistake or if you need to re-upload documents, please contact support.
      </Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={clearAuth}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ef4444', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#9ca3af', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  reasonBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', padding: 16, borderRadius: 8, width: '100%', marginBottom: 32 },
  reasonLabel: { color: '#ef4444', fontWeight: 'bold', marginBottom: 8 },
  reasonText: { color: '#fff', fontSize: 16 },
  infoText: { color: '#6b7280', textAlign: 'center', marginBottom: 40 },
  logoutBtn: { backgroundColor: '#374151', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
