import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { api } from '../api';
import { useStore } from '../store';

export function PendingApprovalScreen() {
  const profile = useStore((state) => state.profile);
  const setProfile = useStore((state) => state.setProfile);
  const clearAuth = useStore((state) => state.clearAuth);
  const [isChecking, setIsChecking] = useState(false);

  // Poll for status update or let user manual refresh
  const handleRefresh = async () => {
    setIsChecking(true);
    try {
      const res = await api.get('/auth/profile/partner/');
      if (res.data.success) {
         setProfile(res.data.data); // If it changed to APPROVED, the router will automatically switch screens
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>Under Review</Text>
      <Text style={styles.subtitle}>
        Your profile and documents are currently being verified by the Kabadi Man admin team. 
        This usually takes 24 hours.
      </Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRefresh}
        disabled={isChecking}
      >
        <Text style={styles.buttonText}>{isChecking ? 'Checking...' : 'Check Status'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={clearAuth}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#9ca3af', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  button: { backgroundColor: '#374151', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8, marginBottom: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutBtn: { padding: 12 },
  logoutText: { color: '#ef4444', fontSize: 16 },
});
