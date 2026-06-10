import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { crearPedido } from '../api/pedidos';
import { listarVehiculos, Vehiculo } from '../api/vehiculos';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Catalog'>;

export function CatalogScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listarVehiculos();
      setVehiculos(data.filter((v) => v.estado === 'DISPONIBLE'));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cargar el catálogo');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onPedir = (vehiculo: Vehiculo) => {
    if (!user?.clienteId) {
      Alert.alert('Error', 'Su usuario no tiene cliente asociado');
      return;
    }

    Alert.alert(
      'Confirmar pedido',
      `¿Solicitar ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pedir',
          onPress: async () => {
            try {
              const pedido = await crearPedido({
                clienteId: user.clienteId!,
                vehiculoId: vehiculo.id,
                notas: 'Pedido desde app móvil',
              });
              Alert.alert('Pedido creado', `Código: ${pedido.codigo}`);
              navigation.navigate('Pedidos');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear el pedido');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  return (
    <FlatList
      data={vehiculos}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No hay vehículos disponibles</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {item.marca} {item.modelo} {item.anio}
          </Text>
          <Text style={styles.cardMeta}>VIN: {item.vin}</Text>
          <Text style={styles.cardMeta}>Color: {item.color}</Text>
          <Text style={styles.price}>${Number(item.precio).toLocaleString()}</Text>
          <Pressable style={styles.btn} onPress={() => onPedir(item)}>
            <Text style={styles.btnText}>Crear pedido</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#222' },
  cardMeta: { color: '#666', marginTop: 4 },
  price: { fontSize: 20, fontWeight: '700', color: '#1a237e', marginTop: 8 },
  btn: {
    marginTop: 12,
    backgroundColor: '#1a237e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
