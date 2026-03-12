import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { api } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'Rating'>;

export function RatingScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await api.post(`/orders/customer/${orderId}/rate/`, {
        rating,
        feedback,
      });
      if (res.data.success) {
        Alert.alert('Thank You', 'Your rating helps us improve our service.');
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit rating.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rate Experience</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.prompt}>How was the pickup partner?</Text>
        
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
              <Text style={[styles.star, star <= rating && styles.starActive]}>
                {star <= rating ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>{rating} out of 5</Text>

        <TextInput
          style={styles.input}
          placeholder="Any additional feedback? (Optional)"
          value={feedback}
          onChangeText={setFeedback}
          multiline
        />

        <TouchableOpacity 
          style={[styles.submitBtn, isLoading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Rating</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backBtn: { fontSize: 16, color: '#16a34a', fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  content: { padding: 24 },
  prompt: { fontSize: 18, color: '#374151', textAlign: 'center', marginBottom: 24, fontWeight: '500' },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12 },
  starBtn: { padding: 4 },
  star: { fontSize: 48, color: '#d1d5db' },
  starActive: { color: '#fbbf24' },
  ratingText: { textAlign: 'center', color: '#6b7280', fontSize: 16, marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 16, height: 100, textAlignVertical: 'top', backgroundColor: '#fff', marginBottom: 24 },
  submitBtn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
