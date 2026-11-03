import * as SQLite from 'expo-sqlite';
import { Marker, MarkerImage } from '../types';

export async function insertMarker(db: SQLite.SQLiteDatabase, latitude: number, longitude: number): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO markers (latitude, longitude) VALUES (?, ?)',
    latitude,
    longitude
  );
  return result.lastInsertRowId;
}

export async function removeMarker(db: SQLite.SQLiteDatabase, id: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM markers WHERE id = ?', id);
  });
}

export function fetchMarkers(db: SQLite.SQLiteDatabase): Promise<Marker[]> {
  return db.getAllAsync<Marker>('SELECT * FROM markers ORDER BY id');
}

export function fetchMarker(db: SQLite.SQLiteDatabase, id: number): Promise<Marker | null> {
  return db.getFirstAsync<Marker>('SELECT * FROM markers WHERE id = ?', id);
}

export async function insertImage(db: SQLite.SQLiteDatabase, markerId: number, uri: string): Promise<void> {
  await db.runAsync('INSERT INTO marker_images (marker_id, uri) VALUES (?, ?)', markerId, uri);
}

export async function removeImage(db: SQLite.SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM marker_images WHERE id = ?', id);
}

export function fetchMarkerImages(db: SQLite.SQLiteDatabase, markerId: number): Promise<MarkerImage[]> {
  return db.getAllAsync<MarkerImage>(
    'SELECT * FROM marker_images WHERE marker_id = ? ORDER BY id',
    markerId
  );
}