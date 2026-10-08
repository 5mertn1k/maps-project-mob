import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Map12 from '../components/Map';
import { useMarkers } from '../context/MarkerContext';

export default function MapScreen() {
  const router = useRouter();
  const { markers, addMarker } = useMarkers();

  return (
    <View style={styles.container}>
      <Map12
        markers={markers}
        onLongPress={addMarker}
        onMarkerPress={(id) => router.push(`/marker/${id}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });