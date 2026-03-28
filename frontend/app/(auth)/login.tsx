import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  message?: string;
  user?: User;
  error?: string;
}

// Import server address from the .env file
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [feedback, setFeedback] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  const { width, height } = useWindowDimensions();

  // Clear alert automatically after 2 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 2000);
      return () => clearTimeout(timer); // Prevent memory leaks
    }
  }, [feedback]);

  const handleLogin = async () => {
    setFeedback(null);
    Keyboard.dismiss();

    try {
      if (!email || !password) {
        setFeedback({ message: "Please fill in all the fields.", type: 'error' });
        return;
      }

      setIsLoading(true);

      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as AuthResponse;

      if (response.ok && data.user) {
        console.log("User logged in:", data.user);
        setFeedback({ message: `Authentication successful! Welcome, ${data.user.name}.`, type: 'success' });
      } else {
        setFeedback({ message: data.error || "Invalid email or password.", type: 'error' });
      }
    } catch (error) {
      setFeedback({ message: "Cannot connect to the server.", type: 'error' });
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.wrapper,
            { paddingTop: height * 0.12, paddingHorizontal: width * 0.08 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleContainer}>
            <Text style={[styles.titleMain, { fontSize: width * 0.11 }]}>APP</Text>
            {/* Removed the marginLeft so it perfectly centers below APP */}
            <Text style={[styles.titleAccent, { fontSize: width * 0.11 }]}>NAME</Text>
          </View>


          {/* IN-APP ALERT BANNER */}
          <View style={styles.feedbackContainerStateful}>
            {feedback ? (
              <View style={[
                styles.feedbackBanner,
                feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess
              ]}>
                <Text style={styles.feedbackText}>{feedback.message}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.modernInput, { fontSize: width * 0.04 }]}
              placeholder="Email address"
              placeholderTextColor="#8d99ae"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.modernInput, { fontSize: width * 0.04 }]}
              placeholder="Password"
              placeholderTextColor="#8d99ae"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { fontSize: width * 0.042 }]}>
              {isLoading ? "Connecting..." : "Log In"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.linkButton, { marginTop: height * 0.04 }]} onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.linkText, { fontSize: width * 0.035 }]}>Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
  },
  wrapper: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 40,
  },
  titleContainer: {
    paddingTop: "15%",
    marginBottom: '2%',
    alignItems: 'center', // Center aligned perfectly
  },
  titleMain: {
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
  },
  titleAccent: {
    fontWeight: '800',
    color: '#6366f1',
    marginTop: -8,
    letterSpacing: 2,
  },
  subtitle: {
    color: '#8d99ae',
    marginBottom: '4%',
    fontWeight: '400',
    textAlign: 'center', // Centered properly
  },
  feedbackContainerStateful: {
    minHeight: 45,
    justifyContent: 'center',
    marginBottom: '6%',
  },
  feedbackBanner: {
    padding: 12,
    borderRadius: 12,
  },
  feedbackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  feedbackText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: '5%',
  },
  modernInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: '#f8fafc',
    paddingVertical: '4.5%',
    paddingHorizontal: '5%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: '5.2%',
    borderRadius: 14,
    marginTop: '6%',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#8d99ae',
  },
  linkHighlight: {
    color: '#6366f1',
    fontWeight: '700',
  }
});
