import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>KABADI MAN</Text>
      <Text style={styles.subtitle}>Customer App</Text>
      <ActivityIndicator size="large" color="#16a34a" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a', // green-600
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280', // gray-500
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  loader: {
    marginTop: 40,
  },
});
