import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Alert, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveOrder'>;

export function ActiveOrderScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');

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
  }, [orderId]);

  const handleAction = async (action: string, data = {}) => {
    setIsLoading(true);
    try {
      const res = await api.post(`/orders/partner/${orderId}/${action}/`, data);
      if (res.data.success) {
        await fetchOrder();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || `Failed to perform ${action}`);
      setIsLoading(false); // only toggle off if error, otherwise fetchOrder toggles it
    }
  };

  if (isLoading && !order) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#34d399" /></View>;
  }

  if (!order) return <View style={styles.center}><Text style={{color: '#fff'}}>Not Found.</Text></View>;

  const renderActionButtons = () => {
    switch (order.status) {
      case 'ASSIGNED':
        return (
          <View style={styles.rowActions}>
            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleAction('reject')}>
              <Text style={styles.btnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => handleAction('accept')}>
              <Text style={styles.btnText}>Accept Order</Text>
            </TouchableOpacity>
          </View>
        );
      case 'ACCEPTED':
        return (
          <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => handleAction('start')}>
            <Text style={styles.btnText}>Start Journey</Text>
          </TouchableOpacity>
        );
      case 'ON_THE_WAY':
        return (
          <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => handleAction('arrive')}>
            <Text style={styles.btnText}>Mark Arrived</Text>
          </TouchableOpacity>
        );
      case 'ARRIVED':
        return (
          <View style={styles.otpBox}>
            <Text style={styles.label}>Ask customer for OTP to verify pickup</Text>
            <TextInput style={styles.input} keyboardType="numeric" maxLength={6} value={otpInput} onChangeText={setOtpInput} placeholder="123456" placeholderTextColor="#4b5563" />
            <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => handleAction('verify_otp', { otp: otpInput })}>
              <Text style={styles.btnText}>Verify & Start Collecting</Text>
            </TouchableOpacity>
          </View>
        );
      case 'COLLECTING':
        return (
          <View style={styles.otpBox}>
            <Text style={styles.label}>Log scrap weights</Text>
            <Text style={styles.note}>Due to spec limits, we auto-populate a dummy weight of 10kg Iron for this step in demo.</Text>
             <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => handleAction('submit_scrap', { 
               items: [{ category_slug: 'iron', weight_kg: 10 }] 
             })}>
               <Text style={styles.btnText}>Generate Invoice</Text>
             </TouchableOpacity>
          </View>
        );
      case 'PAYMENT_PENDING':
        return (
          <View style={styles.otpBox}>
             <Text style={styles.label}>Pay Customer: ₹{order.invoice?.customer_total}</Text>
             <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => handleAction('confirm_payment')}>
               <Text style={styles.btnText}>I have paid the customer</Text>
             </TouchableOpacity>
          </View>
        );
      case 'COMPLETED':
        return <Text style={styles.successText}>Order Complete! Earned ₹{order.invoice?.partner_total}</Text>;
      default:
        return <Text style={styles.note}>Waiting on Admin...</Text>;
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34d399" />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Pickup #{order.order_id}</Text>
        <Text style={styles.status}>{order.status.replace(/_/g, ' ')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Customer Details</Text>
        <Text style={styles.detailTitle}>{order.customer?.name}</Text>
        <Text style={styles.text}>📞 {order.customer?.phone}</Text>
        <Text style={styles.text}>📍 {order.customer?.address}</Text>
        
        <Text style={[styles.label, { marginTop: 16 }]}>Scheduled For</Text>
        <Text style={styles.text}>{order.pickup_date} | {order.pickup_slot}</Text>
        
        {order.scrap_description && (
          <Text style={[styles.text, { marginTop: 8, fontStyle: 'italic' }]}>"{order.scrap_description}"</Text>
        )}
      </View>

      <View style={styles.actionContainer}>
         {isLoading ? <ActivityIndicator color="#34d399" /> : renderActionButtons()}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#030712', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#030712' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#111827', borderBottomWidth: 1, borderColor: '#1f2937' },
  backBtn: { fontSize: 16, color: '#34d399', fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f9fafb' },
  status: { fontSize: 14, color: '#fbbf24', marginTop: 8, fontWeight: 'bold' },
  
  card: { margin: 24, backgroundColor: '#1f2937', padding: 20, borderRadius: 12, elevation: 1 },
  label: { fontSize: 12, color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  detailTitle: { fontSize: 20, color: '#f9fafb', fontWeight: 'bold', marginBottom: 4 },
  text: { fontSize: 16, color: '#d1d5db', marginBottom: 4 },
  note: { color: '#9ca3af', fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
  
  actionContainer: { marginHorizontal: 24, marginBottom: 40 },
  rowActions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  primaryBtn: { backgroundColor: '#34d399' },
  acceptBtn: { backgroundColor: '#34d399' },
  rejectBtn: { backgroundColor: '#374151' },
  btnText: { color: '#064e3b', fontSize: 16, fontWeight: 'bold' },
  
  otpBox: { backgroundColor: '#1f2937', padding: 20, borderRadius: 12 },
  input: { borderWidth: 1, borderColor: '#374151', backgroundColor: '#111827', borderRadius: 8, paddingHorizontal: 16, height: 64, marginBottom: 16, fontSize: 24, color: '#f9fafb', textAlign: 'center', letterSpacing: 8 },
  successText: { color: '#34d399', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});
