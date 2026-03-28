import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TeamScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Team</Text>
      <Text style={styles.subtitle}>Gestionează Canvas-ul Echipei Tale</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A12', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#8d99ae', marginTop: 10 }
});
