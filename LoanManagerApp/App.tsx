import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import AdminDashboard from './screens/admin/AdminDashboard';
import CollectorDashboard from './screens/collector/CollectorDashboard';
import CustomerPortal from './screens/customer/CustomerPortal';
import RecordPaymentScreen from './screens/collector/RecordPaymentScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Customers':
            iconName = focused ? 'people' : 'people-outline';
            break;
          case 'Loans':
            iconName = focused ? 'document-text' : 'document-text-outline';
            break;
          case 'Reports':
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            break;
          case 'Settings':
            iconName = focused ? 'settings' : 'settings-outline';
            break;
          default:
            iconName = 'home-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4A90E2',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={AdminDashboard} />
    <Tab.Screen name="Customers" component={PlaceholderScreen} />
    <Tab.Screen name="Loans" component={PlaceholderScreen} />
    <Tab.Screen name="Reports" component={PlaceholderScreen} />
    <Tab.Screen name="Settings" component={PlaceholderScreen} />
  </Tab.Navigator>
);

const CollectorTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Route':
            iconName = focused ? 'map' : 'map-outline';
            break;
          case 'Collections':
            iconName = focused ? 'cash' : 'cash-outline';
            break;
          case 'History':
            iconName = focused ? 'time' : 'time-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'home-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#50C878',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={CollectorDashboard} />
    <Tab.Screen name="Route" component={PlaceholderScreen} />
    <Tab.Screen name="Collections" component={PlaceholderScreen} />
    <Tab.Screen name="History" component={PlaceholderScreen} />
    <Tab.Screen name="Profile" component={PlaceholderScreen} />
  </Tab.Navigator>
);

const CustomerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'MyLoans':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Payments':
            iconName = focused ? 'card' : 'card-outline';
            break;
          case 'History':
            iconName = focused ? 'time' : 'time-outline';
            break;
          case 'Support':
            iconName = focused ? 'help-circle' : 'help-circle-outline';
            break;
          default:
            iconName = 'home-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#9B59B6',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="MyLoans" component={CustomerPortal} />
    <Tab.Screen name="Payments" component={PlaceholderScreen} />
    <Tab.Screen name="History" component={PlaceholderScreen} />
    <Tab.Screen name="Support" component={PlaceholderScreen} />
  </Tab.Navigator>
);

// Placeholder component for unimplemented screens
const PlaceholderScreen = ({ route }: { route: any }) => {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#f5f7fa' 
    }}>
      <Ionicons name="construct-outline" size={60} color="#ccc" />
      <Text style={{ marginTop: 20, color: '#666', fontSize: 18, fontWeight: 'bold' }}>
        {route.name} Coming Soon
      </Text>
      <Text style={{ color: '#999', textAlign: 'center', margin: 20, fontSize: 14 }}>
        This feature is under development and will be available in the next update.
      </Text>
    </View>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f5f7fa' 
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user.role === 'admin' && (
        <>
          <Stack.Screen name="AdminMain" component={AdminTabs} />
          <Stack.Screen 
            name="AddCustomer" 
            component={PlaceholderScreen}
            options={{ headerShown: true, title: 'Add Customer' }}
          />
          <Stack.Screen 
            name="CreateLoan" 
            component={PlaceholderScreen}
            options={{ headerShown: true, title: 'Create Loan' }}
          />
        </>
      )}
      
      {user.role === 'collector' && (
        <>
          <Stack.Screen name="CollectorMain" component={CollectorTabs} />
          <Stack.Screen 
            name="RecordPayment" 
            component={RecordPaymentScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="CustomerVisit" 
            component={PlaceholderScreen}
            options={{ headerShown: true, title: 'Customer Visit' }}
          />
        </>
      )}
      
      {user.role === 'customer' && (
        <Stack.Screen name="CustomerMain" component={CustomerTabs} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
