import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

export function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchOrder();
  }, [orderId]);

  if (isLoading || !order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order #{order.order_id}</Text>
        <Text style={styles.status}>{order.status.replace(/_/g, ' ')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pickup Details</Text>
        <Text style={styles.detailText}>Date: {order.pickup_date}</Text>
        <Text style={styles.detailText}>Slot: {order.pickup_slot}</Text>
        <Text style={styles.detailText}>Address: {order.customer?.address}</Text>
      </View>

      {order.partner && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Partner Details</Text>
          <Text style={styles.detailText}>{order.partner.name}</Text>
          <Text style={styles.detailText}>+91 {order.partner.phone}</Text>
        </View>
      )}

      {order.scrap_items && order.scrap_items.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Scrap Collected & Invoice</Text>
          {order.scrap_items.map((item: any, idx: number) => (
            <View key={idx} style={styles.lineItem}>
              <Text style={styles.lineItemName}>{item.category_name} ({item.weight_kg} kg)</Text>
              <Text style={styles.lineItemPrice}>₹{item.customer_amount}</Text>
            </View>
          ))}
          <View style={styles.totalLine}>
            <Text style={styles.totalText}>Total Earnings</Text>
            <Text style={styles.totalAmount}>₹{order.invoice?.customer_total || '0.00'}</Text>
          </View>
        </View>
      )}

      {order.status === 'COMPLETED' && !order.rating && (
        <TouchableOpacity 
          style={styles.rateBtn}
          onPress={() => navigation.navigate('Rating', { orderId: order.id })}
        >
          <Text style={styles.rateBtnText}>Rate your experience</Text>
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
  status: { fontSize: 14, color: '#16a34a', marginTop: 8, fontWeight: 'bold' },
  
  card: { marginHorizontal: 24, marginTop: 20, backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 1 },
  sectionTitle: { fontSize: 14, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
  detailText: { fontSize: 16, color: '#374151', marginBottom: 8 },

  lineItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderColor: '#f3f4f6', paddingBottom: 8 },
  lineItemName: { fontSize: 16, color: '#374151' },
  lineItemPrice: { fontSize: 16, color: '#111827', fontWeight: '500' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderColor: '#e5e7eb' },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },

  rateBtn: { margin: 24, backgroundColor: '#111827', padding: 16, borderRadius: 8, alignItems: 'center' },
  rateBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
