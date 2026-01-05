import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Import the Icon library
import { TEACHERS } from '../data/users';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // ✅ NEW: State to handle password visibility
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    const teacher = TEACHERS.find(
      (user) => user.username === username && user.password === password
    );

    if (teacher) {
      navigation.replace('Attendance', {
        teacherName: teacher.username,
        className: teacher.className,
        section: teacher.section
      });
    } else {
      Alert.alert("Error", "Invalid Username or Password");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        {/* Ensure logo.png is in assets folder */}
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.schoolName}>Shaheer Jamal Academy</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Teacher Login</Text>

        {/* Username Input */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
        />

        {/* ✅ NEW: Password Input Container with Icon */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword} // Toggles true/false
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 120, height: 120, marginBottom: 10 },
  schoolName: { fontSize: 24, fontWeight: 'bold', color: '#1a237e' },

  form: { paddingHorizontal: 30 },
  label: { fontSize: 18, color: '#555', marginBottom: 20, textAlign: 'center' },

  // Standard Input Style (For Username)
  input: {
    backgroundColor: '#f5f6fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#dcdde1',
    fontSize: 16
  },

  // ✅ NEW: Password Container Style (Mimics the input style but holds icon too)
  passwordContainer: {
    flexDirection: 'row', // Aligns input and icon side-by-side
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#dcdde1',
  },

  // The actual text input inside the container
  passwordInput: {
    flex: 1, // Takes up all available space
    padding: 15,
    fontSize: 16,
    color: '#000'
  },

  // The clickable eye icon area
  eyeIcon: {
    padding: 10,
    marginRight: 5
  },

  button: {
    backgroundColor: '#1a237e',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});