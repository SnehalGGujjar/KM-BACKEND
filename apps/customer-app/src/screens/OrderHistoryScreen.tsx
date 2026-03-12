import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderHistory'>;

export function OrderHistoryScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'COMPLETED' | 'CANCELLED'>('COMPLETED');

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/orders/customer/history/');
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

  const filteredOrders = orders.filter(o => o.status === activeTab);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>{item.order_id}</Text>
        <Text style={styles.date}>{item.pickup_date}</Text>
      </View>
      <Text style={styles.amount}>
        {item.status === 'COMPLETED' ? `Earned: ₹${item.invoice?.customer_total || '0.00'}` : 'Cancelled'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order History</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'COMPLETED' && styles.activeTab]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'CANCELLED' && styles.activeTab]}
          onPress={() => setActiveTab('CANCELLED')}
        >
          <Text style={[styles.tabText, activeTab === 'CANCELLED' && styles.activeTabText]}>Cancelled</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No {activeTab.toLowerCase()} orders.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backBtn: { fontSize: 16, color: '#16a34a', fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderColor: '#16a34a' },
  tabText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  activeTabText: { color: '#16a34a', fontWeight: 'bold' },

  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  date: { fontSize: 14, color: '#6b7280' },
  amount: { fontSize: 18, color: '#16a34a', fontWeight: 'bold' },
  
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
});
