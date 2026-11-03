import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, migrateDatabase } from '../database/schema';
import * as ops from '../database/operations';
import { Marker, MarkerImage } from '../types';

interface DatabaseContextType {
  addMarker: (latitude: number, longitude: number) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  getMarkers: () => Promise<Marker[]>;
  getMarker: (id: number) => Promise<Marker | null>;
  addImage: (markerId: number, uri: string) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  getMarkerImages: (markerId: number) => Promise<MarkerImage[]>;
  isLoading: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);


async function run<T>(
  db: SQLite.SQLiteDatabase | null,
  name: string,
  fn: (database: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  try {
    if (!db) throw new Error('База данных не инициализирована');
    if (__DEV__) console.log(`[DB] ${name}`);
    return await fn(db);
  } catch (e) {
    console.error(`[DB] ${name}: ошибка`, e);
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(`Ошибка базы данных (${name}): ${reason}`);
  }
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0); 

  useEffect(() => {
    let cancelled = false;
    let opened: SQLite.SQLiteDatabase | null = null;

    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
        opened = database;
        await migrateDatabase(database);
        if (cancelled) {
          await database.closeAsync();
          return;
        }
        setDb(database);
      } catch (e) {
        console.error('[DB] Ошибка инициализации', e);
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();


    return () => {
      cancelled = true;
      opened?.closeAsync().catch(() => {});
    };
  }, [attempt]);

  const value = useMemo<DatabaseContextType>(
    () => ({
      addMarker: (lat, lng) => run(db, 'addMarker', (d) => ops.insertMarker(d, lat, lng)),
      deleteMarker: (id) => run(db, 'deleteMarker', (d) => ops.removeMarker(d, id)),
      getMarkers: () => run(db, 'getMarkers', (d) => ops.fetchMarkers(d)),
      getMarker: (id) => run(db, 'getMarker', (d) => ops.fetchMarker(d, id)),
      addImage: (markerId, uri) => run(db, 'addImage', (d) => ops.insertImage(d, markerId, uri)),
      deleteImage: (id) => run(db, 'deleteImage', (d) => ops.removeImage(d, id)),
      getMarkerImages: (markerId) => run(db, 'getMarkerImages', (d) => ops.fetchMarkerImages(d, markerId)),
      isLoading,
      error,
    }),
    [db, isLoading, error]
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Подготовка базы данных…</Text>
      </View>
    );
  }

  if (error || !db) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Не удалось открыть базу данных.</Text>
        <Text style={styles.detail}>{error?.message}</Text>
        <Pressable style={styles.button} onPress={() => setAttempt((a) => a + 1)}>
          <Text style={styles.buttonText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase можно использовать только внутри DatabaseProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 16, textAlign: 'center', marginTop: 12 },
  detail: { fontSize: 13, color: '#666', textAlign: 'center', marginVertical: 12 },
  button: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16 },
});