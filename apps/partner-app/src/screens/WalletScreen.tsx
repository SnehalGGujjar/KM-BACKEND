import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'Wallet'>;

export function WalletScreen({ navigation }: Props) {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, txRes] = await Promise.all([
           api.get('/wallet/'),
           api.get('/wallet/history/')
        ]);
        if (walletRes.data.success) setWallet(walletRes.data.data);
        if (txRes.data.success) setTransactions(txRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderTx = ({ item }: { item: any }) => {
    const isDeduct = item.type === 'COMMISSION_DEDUCTION';
    return (
      <View style={styles.txCard}>
        <View style={styles.txLeft}>
          <Text style={styles.txType}>{item.type.replace(/_/g, ' ')}</Text>
          <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={[styles.txAmount, isDeduct ? styles.txNegative : styles.txPositive]}>
          {isDeduct ? '-' : '+'}₹{item.amount}
        </Text>
      </View>
    );
  };

  const isLowBalance = wallet && parseFloat(wallet.balance) < 200;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Wallet & Commission</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#34d399" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={[styles.balanceCard, isLowBalance && styles.balanceRed]}>
             <Text style={styles.balanceLabel}>Current Balance</Text>
             <Text style={styles.balanceText}>₹{wallet?.balance || '0.00'}</Text>
             {isLowBalance && (
               <Text style={styles.lowBalanceWarning}>⚠️ Balance critically low. Please recharge to continue accepting orders.</Text>
             )}
          </View>

          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTx}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No wallet transactions found.</Text>}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#111827', borderBottomWidth: 1, borderColor: '#1f2937' },
  backBtn: { fontSize: 16, color: '#34d399', fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f9fafb' },
  
  balanceCard: { margin: 24, backgroundColor: '#1f2937', padding: 32, borderRadius: 16, alignItems: 'center' },
  balanceRed: { borderColor: '#ef4444', borderWidth: 2 },
  balanceLabel: { color: '#9ca3af', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  balanceText: { color: '#f9fafb', fontSize: 48, fontWeight: 'bold', marginTop: 8 },
  lowBalanceWarning: { color: '#ef4444', marginTop: 16, textAlign: 'center', fontSize: 14, fontWeight: '500' },

  sectionTitle: { paddingHorizontal: 24, fontSize: 18, fontWeight: 'bold', color: '#f9fafb', marginBottom: 16 },
  
  txCard: { backgroundColor: '#111827', padding: 16, borderRadius: 8, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txLeft: { flex: 1 },
  txType: { color: '#d1d5db', fontSize: 14, fontWeight: '600' },
  txDate: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: 'bold' },
  txPositive: { color: '#34d399' },
  txNegative: { color: '#ef4444' },

  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});
