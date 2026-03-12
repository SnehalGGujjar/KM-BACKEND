import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>KABADI MAN</Text>
      <Text style={styles.subtitle}>Partner App</Text>
      <ActivityIndicator size="large" color="#16a34a" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Darker theme for partners
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#34d399',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  loader: {
    marginTop: 40,
  },
});
