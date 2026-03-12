import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';
import { useStore } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Pricing'>;

export function PricingScreen({ navigation }: Props) {
  const profile = useStore((state) => state.profile);
  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await api.get('/pricing/customer/', {
          params: { city_id: profile?.city }
        });
        if (res.data.success) {
          setRates(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (profile?.city) {
      fetchRates();
    } else {
      setIsLoading(false);
    }
  }, [profile?.city]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.categoryName}>{item.category_name}</Text>
      <Text style={styles.price}>₹{item.price_per_kg} / kg</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scrap Rates</Text>
        <Text style={styles.subtitle}>Current prices in your city</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rates}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No rates available for your current city.</Text>
          }
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
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 12, elevation: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryName: { fontSize: 18, fontWeight: '600', color: '#374151' },
  price: { fontSize: 20, color: '#16a34a', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
});
