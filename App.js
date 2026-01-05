import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Screen 1: The Login Page */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* Screen 2: The Attendance List */}
        <Stack.Screen
          name="Attendance"
          component={AttendanceScreen}
          options={{ title: 'Mark Attendance' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}