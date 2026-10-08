import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMarkers } from '../../context/MarkerContext';
import ImageList from '../../components/ImageList';
import { MarkerRouteParams } from '../../types';

export default function MarkerDetailsScreen() {
  const { id } = useLocalSearchParams<MarkerRouteParams>();
  const router = useRouter();
  const { markers, addImage, removeImage } = useMarkers();
  const [picking, setPicking] = useState(false);

  const marker = markers.find((m) => m.id === id);

  const goBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (e) {
      console.warn('Ошибка навигации', e);
      Alert.alert('Ошибка', 'Не удалось вернуться к карте.');
    }
  };

  const pickImage = async () => {
    if (!marker) return;
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Нет доступа', 'Разрешите доступ к галерее в настройках телефона.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        addImage(marker.id, result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Ошибка выбора изображения', e);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение. Попробуйте ещё раз.');
    } finally {
      setPicking(false);
    }
  };

  if (!marker) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Маркер не найден' }} />
        <Text style={styles.notFound}>Маркер не найден. Возможно, он был удалён.</Text>
        <Pressable style={styles.button} onPress={goBack}>
          <Text style={styles.buttonText}>К карте</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Детали маркера' }} />

      <View style={styles.info}>
        <Text style={styles.label}>Координаты</Text>
        <Text style={styles.coords}>Широта: {marker.latitude.toFixed(6)}</Text>
        <Text style={styles.coords}>Долгота: {marker.longitude.toFixed(6)}</Text>
        <Text style={styles.count}>Изображений: {marker.images.length}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, picking && styles.buttonDisabled]} onPress={pickImage} disabled={picking}>
          {picking ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Добавить изображение</Text>}
        </Pressable>
        <Pressable style={styles.buttonSecondary} onPress={goBack}>
          <Text style={styles.buttonSecondaryText}>Назад к карте</Text>
        </Pressable>
      </View>

      <ImageList images={marker.images} onRemove={(imageId) => removeImage(marker.id, imageId)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFound: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  info: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd' },
  label: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  coords: { fontSize: 15, color: '#333' },
  count: { fontSize: 15, color: '#666', marginTop: 6 },
  actions: { padding: 16, gap: 10 },
  button: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center', paddingHorizontal: 20 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16 },
  buttonSecondary: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#2563eb' },
  buttonSecondaryText: { color: '#2563eb', fontSize: 16 },
});