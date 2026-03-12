import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderHistory'>;

export function OrderHistoryScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/orders/partner/history/');
        if (res.data.success) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>{item.order_id}</Text>
        <Text style={styles.date}>{item.pickup_date}</Text>
      </View>
      <Text style={styles.amount}>
        {item.status === 'COMPLETED' ? `Paid Platform: ₹${item.invoice?.partner_total || '0'}` : item.status.replace(/_/g, ' ')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#34d399" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No historical pickups.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#111827', borderBottomWidth: 1, borderColor: '#1f2937' },
  backBtn: { fontSize: 16, color: '#34d399', fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f9fafb' },
  
  card: { backgroundColor: '#1f2937', padding: 20, borderRadius: 12, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#f9fafb' },
  date: { fontSize: 14, color: '#9ca3af' },
  amount: { fontSize: 16, color: '#34d399', fontWeight: 'bold' },
  
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
