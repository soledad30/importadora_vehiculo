import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { inspeccionarPedido } from '../api/pedidos';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Inspeccion'>;

export function InspeccionScreen({ route }: Props) {
  const { pedidoId } = route.params;
  const [uri, setUri] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a cámara o galería');
      return;
    }

    const picker = fromCamera
      ? ImagePicker.launchCameraAsync({ quality: 0.8 })
      : ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    const res = await picker;
    if (!res.canceled && res.assets[0]) {
      setUri(res.assets[0].uri);
      setResultado(null);
    }
  };

  const enviar = async () => {
    if (!uri) return;
    setLoading(true);
    try {
      const data = await inspeccionarPedido(pedidoId, uri);
      setResultado(data);
      Alert.alert('Inspección completada', 'MS-1 orquestó el análisis con MS-3');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Falló la inspección');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inspección pedido #{pedidoId}</Text>
      <Text style={styles.sub}>
        La foto se envía a MS-1 → MS-3 (OCR, daños, modelo).
      </Text>

      <View style={styles.row}>
        <Pressable style={styles.secondaryBtn} onPress={() => pickImage(true)}>
          <Text style={styles.secondaryText}>Cámara</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => pickImage(false)}>
          <Text style={styles.secondaryText}>Galería</Text>
        </Pressable>
      </View>

      {uri ? (
        <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Sin imagen seleccionada</Text>
        </View>
      )}

      <Pressable
        style={[styles.btn, !uri && styles.btnDisabled]}
        onPress={enviar}
        disabled={!uri || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Enviar a inspección IA</Text>
        )}
      </Pressable>

      {resultado ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Resultado MS-3</Text>
          <Text style={styles.json}>{JSON.stringify(resultado, null, 2)}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a237e' },
  sub: { color: '#666', marginTop: 8, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  secondaryBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
    alignItems: 'center',
  },
  secondaryText: { color: '#1a237e', fontWeight: '600' },
  preview: { width: '100%', height: 220, borderRadius: 8, backgroundColor: '#eee' },
  placeholder: {
    height: 220,
    borderRadius: 8,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { color: '#888' },
  btn: {
    marginTop: 16,
    backgroundColor: '#1a237e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '600' },
  result: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resultTitle: { fontWeight: '700', marginBottom: 8 },
  json: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 },
});
