import { Redirect } from 'expo-router';

export default function StartPage() {
  // Când cineva deschide aplicația (Ruta "/"), îi aruncăm automat spre ecranul de Login!
  return <Redirect href="/(auth)/login" />;
}
