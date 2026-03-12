import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const profile = useStore((state) => state.profile);
  const clearAuth = useStore((state) => state.clearAuth);
  
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveOrder = async () => {
    try {
      const res = await api.get('/orders/customer/current/');
      if (res.data.success && res.data.data) {
        setActiveOrder(res.data.data);
      } else {
        setActiveOrder(null);
      }
    } catch {
      setActiveOrder(null);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveOrder();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchActiveOrder();
    const interval = setInterval(fetchActiveOrder, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.name?.split(' ')[0]}</Text>
          <Text style={styles.city}>📍 {profile?.city === 1 ? 'Belgaum' : 'Platform'} Zone</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={clearAuth}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Active Order Banner */}
      {activeOrder ? (
        <TouchableOpacity 
          style={styles.activeOrderCard}
          onPress={() => navigation.navigate('CurrentOrder', { orderId: activeOrder.id })}
        >
          <View style={styles.activeHeader}>
            <Text style={styles.activeLabel}>🔥 Active Pickup</Text>
            <Text style={styles.activeStatus}>{activeOrder.status.replace(/_/g, ' ')}</Text>
          </View>
          <Text style={styles.orderId}>ID: {activeOrder.order_id}</Text>
          <Text style={styles.orderDate}>{activeOrder.pickup_date} | {activeOrder.pickup_slot}</Text>
          <Text style={styles.tapToTrack}>Tap to track live status →</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Got Scrap?</Text>
          <Text style={styles.emptyDesc}>Recycle from home and earn rewards</Text>
          <TouchableOpacity 
            style={styles.createBtn}
            onPress={() => navigation.navigate('CreatePickup')}
          >
            <Text style={styles.createBtnText}>Schedule a Pickup</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick Links</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('OrderHistory')}>
          <Text style={styles.gridIcon}>📦</Text>
          <Text style={styles.gridText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Pricing')}>
          <Text style={styles.gridIcon}>₹</Text>
          <Text style={styles.gridText}>Pricing</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.gridIcon}>👤</Text>
          <Text style={styles.gridText}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.gridIcon}>🔔</Text>
          <Text style={styles.gridText}>Alerts</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  city: { fontSize: 14, color: '#16a34a', marginTop: 4, fontWeight: '600' },
  logoutBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 6 },
  logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 12 },
  
  activeOrderCard: { margin: 24, backgroundColor: '#111827', padding: 20, borderRadius: 16, elevation: 4 },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  activeLabel: { color: '#fff', fontWeight: 'bold' },
  activeStatus: { color: '#fbbf24', fontWeight: 'bold', fontSize: 12, backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  orderId: { color: '#9ca3af', fontSize: 14, marginBottom: 4 },
  orderDate: { color: '#e5e7eb', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  tapToTrack: { color: '#34d399', fontSize: 14, fontWeight: '600' },

  emptyState: { margin: 24, backgroundColor: '#fff', padding: 32, borderRadius: 16, alignItems: 'center', elevation: 2 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  emptyDesc: { fontSize: 14, color: '#6b7280', marginTop: 8, marginBottom: 24, textAlign: 'center' },
  createBtn: { backgroundColor: '#16a34a', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8, width: '100%', alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  sectionTitle: { paddingHorizontal: 24, fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 40 },
  gridCard: { width: '45%', backgroundColor: '#fff', margin: '2.5%', padding: 20, borderRadius: 12, alignItems: 'center', elevation: 1 },
  gridIcon: { fontSize: 28, marginBottom: 8 },
  gridText: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
});
