import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { width, height } = useWindowDimensions();
  const router = useRouter();

  if (!permission) {
    return <View style={styles.container}><Text style={styles.text}>Se inițializează camera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Avem nevoie de acces la cameră pentru a scana afișele din oraș.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permite Accesul</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        
        <View style={styles.overlay}>
          {/* 1. Status Pill (Sus) */}
          <View style={[styles.statusPill, { top: height * 0.1 }]}>
            <Text style={styles.statusText}>Scanning for Canvas...</Text>
          </View>

          {/* 2. Crosshair (Centru) */}
          <View style={[styles.crosshairContainer, { width: width * 0.7, height: height * 0.4 }]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
        </View>

      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A12', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#8d99ae', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  button: { backgroundColor: '#6366f1', padding: 15, borderRadius: 12 },
  buttonText: { color: '#f8fafc', fontWeight: 'bold' },
  
  camera: { flex: 1, width: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  
  statusPill: {
    position: 'absolute',
    backgroundColor: 'rgba(10, 10, 18, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  statusText: { color: '#6366f1', fontWeight: '900', letterSpacing: 1 },
  
  crosshairContainer: { position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#39FF14', borderWidth: 0, opacity: 0.8 },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
  
});
