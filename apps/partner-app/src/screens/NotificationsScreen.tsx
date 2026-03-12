import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/');
        if (res.data.success) {
          setNotifications(res.data.data);
          api.post('/notifications/mark-read/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, !item.is_read && styles.unreadCard]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, !item.is_read && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>System Alerts</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#34d399" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No recent alerts.</Text>
          }
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
  
  card: { backgroundColor: '#1f2937', padding: 20, borderRadius: 12, marginBottom: 12, elevation: 1 },
  unreadCard: { borderLeftWidth: 4, borderColor: '#34d399' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#d1d5db', flex: 1 },
  unreadText: { color: '#f9fafb', fontWeight: 'bold' },
  date: { fontSize: 12, color: '#6b7280' },
  body: { fontSize: 14, color: '#9ca3af', lineHeight: 20 },
  
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
});
