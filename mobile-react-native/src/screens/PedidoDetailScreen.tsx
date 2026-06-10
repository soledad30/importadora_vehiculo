import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { obtenerPedido, Pedido } from '../api/pedidos';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PedidoDetail'>;

export function PedidoDetailScreen({ route, navigation }: Props) {
  const { pedidoId } = route.params;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerPedido(pedidoId)
      .then(setPedido)
      .catch((e) =>
        Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cargar el pedido'),
      )
      .finally(() => setLoading(false));
  }, [pedidoId]);

  if (loading || !pedido) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.code}>{pedido.codigo}</Text>
      <Text style={styles.title}>{pedido.vehiculoTitulo}</Text>
      <Text style={styles.meta}>VIN: {pedido.vehiculoVin}</Text>
      <Text style={styles.meta}>Estado: {pedido.estado}</Text>
      <Text style={styles.meta}>Cliente: {pedido.clienteNombre}</Text>

      <View style={styles.box}>
        <Text>Precio base: ${Number(pedido.precioBase).toLocaleString()}</Text>
        <Text>Impuestos: ${Number(pedido.impuestos).toLocaleString()}</Text>
        <Text>Envío: ${Number(pedido.envio).toLocaleString()}</Text>
        <Text style={styles.total}>Total: ${Number(pedido.total).toLocaleString()}</Text>
      </View>

      {pedido.notas ? <Text style={styles.notes}>Notas: {pedido.notas}</Text> : null}

      <Pressable
        style={styles.btn}
        onPress={() => navigation.navigate('Inspeccion', { pedidoId: pedido.id })}
      >
        <Text style={styles.btnText}>Inspección con IA (foto → MS-3)</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20 },
  code: { fontSize: 22, fontWeight: '700', color: '#1a237e' },
  title: { fontSize: 18, marginTop: 8 },
  meta: { color: '#666', marginTop: 6 },
  box: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 6,
  },
  total: { fontWeight: '700', marginTop: 8, fontSize: 16 },
  notes: { marginTop: 16, color: '#444' },
  btn: {
    marginTop: 24,
    backgroundColor: '#283593',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
