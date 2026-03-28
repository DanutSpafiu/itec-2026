import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <Text style={styles.subtitle}>Statistici și Scoruri Graffiti</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A12', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#8d99ae', marginTop: 10 }
});
