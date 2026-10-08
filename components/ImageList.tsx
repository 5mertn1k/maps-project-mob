import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ImageData } from '../types';

interface ImageListProps {
  images: ImageData[];
  onRemove: (imageId: string) => void;
}

export default function ImageList({ images, onRemove }: ImageListProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const confirmRemove = (imageId: string) => {
    Alert.alert('Удалить изображение?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => onRemove(imageId) },
    ]);
  };

  if (images.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Изображений пока нет. Нажмите «Добавить изображение».</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Pressable onPress={() => setPreview(item.uri)}>
              <Image source={{ uri: item.uri }} style={styles.image} />
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={() => confirmRemove(item.id)}>
              <Text style={styles.deleteText}>Удалить</Text>
            </Pressable>
          </View>
        )}
      />

      <Modal visible={preview !== null} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPreview(null)}>
          {preview && <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="contain" />}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 8 },
  row: { justifyContent: 'space-between' },
  item: { flex: 1, margin: 6, maxWidth: '48%' },
  image: { width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: '#eee' },
  deleteButton: { marginTop: 6, paddingVertical: 6, borderRadius: 6, backgroundColor: '#fee2e2', alignItems: 'center' },
  deleteText: { color: '#b91c1c', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 15, color: '#666', textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '80%' },
});