import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CatalogScreen } from '../screens/CatalogScreen';
import { InspeccionScreen } from '../screens/InspeccionScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PedidoDetailScreen } from '../screens/PedidoDetailScreen';
import { PedidosScreen } from '../screens/PedidosScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen
            name="Catalog"
            component={CatalogScreen}
            options={({ navigation }) => ({
              title: 'Catálogo',
              headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Pressable onPress={() => navigation.navigate('Pedidos')}>
                    <Text style={{ color: '#1a237e', fontWeight: '600' }}>Pedidos</Text>
                  </Pressable>
                  <Pressable onPress={signOut}>
                    <Text style={{ color: '#c62828', fontWeight: '600' }}>Salir</Text>
                  </Pressable>
                </View>
              ),
            })}
          />
          <Stack.Screen name="Pedidos" component={PedidosScreen} options={{ title: 'Mis pedidos' }} />
          <Stack.Screen
            name="PedidoDetail"
            component={PedidoDetailScreen}
            options={{ title: 'Detalle pedido' }}
          />
          <Stack.Screen
            name="Inspeccion"
            component={InspeccionScreen}
            options={{ title: 'Inspección IA' }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
