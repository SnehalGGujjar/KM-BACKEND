import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RecyclingInfo'>;

export function RecyclingInfoScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recycling Guide</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Why Recycle with Kabadi Man?</Text>
        <Text style={styles.paragraph}>
          By recycling your household scrap, you are directly contributing to a cleaner environment,
          reducing landfill waste, and empowering local collection partners with sustainable income.
        </Text>
        
        <Text style={styles.heading}>What we accept:</Text>
        <Text style={styles.bullet}>• Newspapers & Magazines</Text>
        <Text style={styles.bullet}>• Cardboard Boxes</Text>
        <Text style={styles.bullet}>• Iron & Scrap Metals</Text>
        <Text style={styles.bullet}>• Plastic Bottles (PET)</Text>
        <Text style={styles.bullet}>• Old Electronics (E-Waste)</Text>
        <Text style={styles.bullet}>• Copper & Brass items</Text>

        <Text style={styles.heading}>Preparation Tips:</Text>
        <Text style={styles.paragraph}>
          Please try to keep paper dry. Separate plastics from metals if possible. Electronic items should be unplugged.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backBtn: { fontSize: 16, color: '#16a34a', fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  
  card: { margin: 24, backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 1 },
  heading: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 16, marginBottom: 8 },
  paragraph: { fontSize: 15, color: '#4b5563', lineHeight: 24, marginBottom: 8 },
  bullet: { fontSize: 15, color: '#4b5563', lineHeight: 24, marginLeft: 8 },
});
