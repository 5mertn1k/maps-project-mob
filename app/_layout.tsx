import { Stack } from 'expo-router';
import { MarkerProvider } from '../context/MarkerContext';

export default function RootLayout() {
  return (
    <MarkerProvider>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ title: 'Моя Карта' }} 
        />
        <Stack.Screen 
          name="marker/[id]" 
          options={{ title: 'Детали места' }} 
        />
      </Stack>
    </MarkerProvider>
  );
}