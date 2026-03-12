import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'CurrentOrder'>;

export function CurrentOrderScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}/`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchOrder();
    // 30s polling for live tracking
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancel = async () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this pickup?', [
      { text: 'No, Keep it', style: 'cancel' },
      { 
        text: 'Yes, Cancel', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/orders/customer/${orderId}/cancel/`);
            Alert.alert('Cancelled', 'Order has been cancelled.');
            navigation.replace('Home');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'Cannot cancel this order right now.');
          }
        }
      }
    ]);
  };

  if (isLoading && !order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Order not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: '#16a34a' }}>Go Back</Text></TouchableOpacity>
      </View>
    );
  }

  const isTerminal = ['COMPLETED', 'CANCELLED'].includes(order.status);
  const canCancel = ['NEW', 'ASSIGNED', 'ON_THE_WAY'].includes(order.status);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Home')}>
           <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Live Track: #{order.order_id}</Text>
      </View>

      <View style={styles.statusBanner}>
        <Text style={styles.statusLabel}>CURRENT STATUS</Text>
        <Text style={styles.statusText}>{order.status.replace(/_/g, ' ')}</Text>
        
        {['ARRIVED', 'COLLECTING'].includes(order.status) && order.arrival_otp && (
          <View style={styles.otpBox}>
            <Text style={styles.otpLabel}>Give this OTP to Partner</Text>
            <Text style={styles.otpText}>{order.arrival_otp}</Text>
          </View>
        )}
      </View>

      {order.partner ? (
        <View style={styles.partnerCard}>
          <Text style={styles.sectionTitle}>Your Partner</Text>
          <Text style={styles.partnerName}>{order.partner.name}</Text>
          <Text style={styles.partnerPhone}>📞 +91 {order.partner.phone}</Text>
          <Text style={styles.partnerRating}>⭐ {order.partner.rating} / 5</Text>
        </View>
      ) : (
        <View style={styles.partnerCard}>
          <Text style={styles.sectionTitle}>Partner Assignment</Text>
          <Text style={styles.partnerDesc}>Finding a partner nearby...</Text>
        </View>
      )}

      {isTerminal && (
         <View style={styles.actionCard}>
           <TouchableOpacity 
             style={styles.rateBtn}
             onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
           >
             <Text style={styles.rateBtnText}>View Final Details & Invoice</Text>
           </TouchableOpacity>
         </View>
      )}

      {canCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel Pickup</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backBtn: { fontSize: 16, color: '#16a34a', fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  
  statusBanner: { margin: 24, padding: 24, backgroundColor: '#111827', borderRadius: 16 },
  statusLabel: { color: '#9ca3af', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  statusText: { color: '#34d399', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  
  otpBox: { marginTop: 24, backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, alignItems: 'center' },
  otpLabel: { color: '#e5e7eb', fontSize: 14, marginBottom: 8 },
  otpText: { color: '#fff', fontSize: 32, fontWeight: 'bold', letterSpacing: 8 },

  partnerCard: { marginHorizontal: 24, backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 1 },
  sectionTitle: { fontSize: 14, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
  partnerName: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  partnerPhone: { fontSize: 16, color: '#374151', marginTop: 4 },
  partnerRating: { fontSize: 16, color: '#fbbf24', marginTop: 8, fontWeight: '600' },
  partnerDesc: { fontSize: 16, color: '#374151', fontStyle: 'italic' },

  actionCard: { margin: 24 },
  rateBtn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, alignItems: 'center' },
  rateBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  cancelBtn: { marginHorizontal: 24, marginTop: 12, marginBottom: 40, padding: 16, alignItems: 'center' },
  cancelBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
