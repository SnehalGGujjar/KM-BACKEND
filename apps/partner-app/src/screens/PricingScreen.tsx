import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'Pricing'>;

export function PricingScreen({ navigation }: Props) {
  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await api.get('/pricing/partner/rates/');
        if (res.data.success) {
          setRates(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRates();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View>
         <Text style={styles.categoryName}>{item.category_name}</Text>
         {item.is_custom ? (
           <Text style={styles.badge}>Custom Rate Active</Text>
         ) : (
           <Text style={styles.badgeSecondary}>Platform Default</Text>
         )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
         <Text style={styles.priceLabel}>You pay:</Text>
         <Text style={styles.price}>₹{item.price_per_kg}/kg</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
           <TouchableOpacity onPress={() => navigation.goBack()}>
             <Text style={styles.backBtn}>← Back</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => navigation.navigate('RateRequest')}>
             <Text style={styles.requestBtn}>Request Change</Text>
           </TouchableOpacity>
        </View>
        <Text style={styles.title}>Your Buying Rates</Text>
        <Text style={styles.subtitle}>These rates represent the deduction from your wallet per kg collected.</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#34d399" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rates}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Rates not yet synchronized.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#111827', borderBottomWidth: 1, borderColor: '#1f2937' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { fontSize: 16, color: '#34d399', fontWeight: 'bold' },
  requestBtn: { fontSize: 14, color: '#f9fafb', backgroundColor: '#374151', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f9fafb' },
  subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 8, lineHeight: 20 },
  
  card: { backgroundColor: '#1f2937', padding: 20, borderRadius: 12, marginBottom: 12, elevation: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryName: { fontSize: 18, fontWeight: '600', color: '#f9fafb', marginBottom: 6 },
  badge: { fontSize: 10, color: '#064e3b', backgroundColor: '#34d399', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', fontWeight: 'bold' },
  badgeSecondary: { fontSize: 10, color: '#d1d5db', backgroundColor: '#374151', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', fontWeight: '600' },
  
  priceLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  price: { fontSize: 20, color: '#34d399', fontWeight: 'bold' },

  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
});
