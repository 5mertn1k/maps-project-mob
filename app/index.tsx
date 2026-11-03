import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Map from '../components/Map';
import { useDatabase } from '../contexts/DatabaseContext';
import { Marker } from '../types';

export default function MapScreen() {
  const router = useRouter();
  const { getMarkers, addMarker } = useDatabase();
  const [markers, setMarkers] = useState<Marker[]>([]);

  const loadMarkers = useCallback(async () => {
    try {
      setMarkers(await getMarkers());
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось загрузить маркеры');
    }
  }, [getMarkers]);

  useFocusEffect(
    useCallback(() => {
      loadMarkers();
    }, [loadMarkers])
  );

  const handleLongPress = async (latitude: number, longitude: number) => {
    try {
      await addMarker(latitude, longitude);
      await loadMarkers();
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось добавить маркер');
    }
  };

  return (
    <View style={styles.container}>
      <Map
        markers={markers}
        onLongPress={handleLongPress}
        onMarkerPress={(id) => router.push(`/marker/${id}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });