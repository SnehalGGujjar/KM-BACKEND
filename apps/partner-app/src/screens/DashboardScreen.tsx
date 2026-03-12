import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const profile = useStore((state) => state.profile);
  const setProfile = useStore((state) => state.setProfile);
  
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/orders/partner/assigned/');
      if (res.data.success) {
        setAssignedOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !profile?.is_online;
      const res = await api.put('/auth/profile/partner/', { is_online: newStatus });
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34d399" />}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hey, {profile?.name?.split(' ')[0]}</Text>
            <Text style={styles.rating}>⭐ {profile?.rating} / 5</Text>
          </View>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>{profile?.is_online ? 'ACCEPTING' : 'OFFLINE'}</Text>
            <Switch
              trackColor={{ false: '#374151', true: '#059669' }}
              thumbColor={profile?.is_online ? '#34d399' : '#9ca3af'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleOnlineStatus}
              value={profile?.is_online}
            />
          </View>
        </View>

        <View style={styles.navGrid}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('OrderHistory')}>
             <Text style={styles.navIcon}>📊</Text>
             <Text style={styles.navText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Wallet')}>
             <Text style={styles.navIcon}>💳</Text>
             <Text style={styles.navText}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Pricing')}>
             <Text style={styles.navIcon}>🏷️</Text>
             <Text style={styles.navText}>Rates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
             <Text style={styles.navIcon}>⚙️</Text>
             <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Active & Assigned Pickups</Text>
        
        {assignedOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No pickups currently assigned.</Text>
            <Text style={styles.emptySub}>Ensure you are ONLINE to receive new requests.</Text>
          </View>
        ) : (
          assignedOrders.map(order => (
            <TouchableOpacity 
              key={order.id} 
              style={styles.orderCard}
              onPress={() => navigation.navigate('ActiveOrder', { orderId: order.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>{order.order_id}</Text>
                <Text style={styles.statusBadge}>{order.status.replace(/_/g, ' ')}</Text>
              </View>
              <Text style={styles.slotText}>📅 {order.pickup_date} ({order.pickup_slot})</Text>
              <Text style={styles.addressText} numberOfLines={2}>📍 {order.customer?.address}</Text>
              <View style={styles.cardAction}>
                <Text style={styles.actionText}>Process Pickup →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { backgroundColor: '#111827', padding: 24, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#f9fafb' },
  rating: { fontSize: 16, color: '#fbbf24', marginTop: 4, fontWeight: '600' },
  toggleContainer: { alignItems: 'center' },
  toggleText: { color: '#9ca3af', fontSize: 10, fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 },
  
  navGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  navItem: { alignItems: 'center' },
  navIcon: { fontSize: 24, marginBottom: 8, backgroundColor: '#1f2937', padding: 12, borderRadius: 12 },
  navText: { color: '#d1d5db', fontSize: 12, fontWeight: '500' },

  content: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#f9fafb', marginBottom: 16 },
  
  emptyCard: { backgroundColor: '#1f2937', padding: 32, borderRadius: 16, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#374151' },
  emptyText: { color: '#d1d5db', fontSize: 16, fontWeight: '500' },
  emptySub: { color: '#6b7280', fontSize: 12, marginTop: 8 },

  orderCard: { backgroundColor: '#1f2937', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#f9fafb' },
  statusBadge: { fontSize: 10, fontWeight: 'bold', color: '#064e3b', backgroundColor: '#34d399', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  slotText: { fontSize: 14, color: '#d1d5db', marginBottom: 8 },
  addressText: { fontSize: 14, color: '#9ca3af', lineHeight: 20 },
  cardAction: { borderTopWidth: 1, borderColor: '#374151', marginTop: 16, paddingTop: 16, alignItems: 'center' },
  actionText: { color: '#34d399', fontWeight: 'bold', fontSize: 16 },
});
