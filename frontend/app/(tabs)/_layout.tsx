import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function HUDTabBar({ state, navigation }: { state: any; navigation: any }) {
  const { width, height } = useWindowDimensions();

  // Aflăm pe ce pagină este userul ca să-i aprindem iconița
  const currentRouteName = state.routeNames[state.index];
  const isProfile = currentRouteName === 'profile';
  const isCamera = currentRouteName === 'index';
  const isTeam = currentRouteName === 'team';

  // Logica de "bilă activă" (mingea albastră se mută pe butonul activ)
  const getButtonStyle = (isActive: boolean) => {
    if (isActive) {
      return {
        backgroundColor: '#6366f1', // Bila albastră Indigo
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center' as const, // Forțează centrarea iconiței
        alignItems: 'center' as const,
        elevation: 8,
        shadowColor: '#6366f1',
        shadowOpacity: 0.6,
        shadowRadius: 8,
      };
    }
    return {
      width: 60,
      height: 60,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    };
  };

  return (
    // Mutăm exact HUD-ul genial, doar că la nivelul de Navigator!
    <View style={[styles.hudBar, { bottom: height * 0.05, width: width * 0.9, left: width * 0.05 }]}>
      
      {/* Buton Stânga Profil */}
      <TouchableOpacity style={getButtonStyle(isProfile)} onPress={() => navigation.navigate('profile')}>
        <Ionicons name="person" size={30} color="#f8fafc" />
      </TouchableOpacity>

      {/* Buton Centru Camera */}
      <TouchableOpacity style={getButtonStyle(isCamera)} onPress={() => navigation.navigate('index')}>
        <Ionicons name="camera" size={34} color="#f8fafc" />
      </TouchableOpacity>

      {/* Buton Dreapta Echipa */}
      <TouchableOpacity style={getButtonStyle(isTeam)} onPress={() => navigation.navigate('team')}>
        <Ionicons name="people" size={30} color="#f8fafc" />
      </TouchableOpacity>

    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <HUDTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="team" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  hudBar: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between', // Garantează spațierea perfectă
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 18, 0.85)',
    height: 80,
    borderRadius: 40,
    paddingHorizontal: 30, // Ține butoanele lateriale la distanță de marginile ecranului
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)'
  }
});
