import { createContext, useState, useContext, ReactNode } from 'react';
import { MarkerData, ImageData } from '../types';

interface MarkerContextType {
  markers: MarkerData[];
  addMarker: (latitude: number, longitude: number) => void;
  addImage: (markerId: string, imageUri: string) => void;
  removeImage: (markerId: string, imageId: string) => void;
}

const MarkerContext = createContext<MarkerContextType | undefined>(undefined);

export function MarkerProvider({ children }: { children: ReactNode }) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);


  const addMarker = (latitude: number, longitude: number) => {
    const newMarker: MarkerData = {
      id: Date.now().toString(), 
      latitude,
      longitude,
      images: [], 
    };
    setMarkers((prev) => [...prev, newMarker]);
  };


  const addImage = (markerId: string, imageUri: string) => {
    setMarkers((prev) =>
      prev.map((marker) => {
        if (marker.id === markerId) {
          const newImage: ImageData = { id: Date.now().toString(), uri: imageUri };
          return { ...marker, images: [...marker.images, newImage] };
        }
        return marker;
      })
    );
  };


  const removeImage = (markerId: string, imageId: string) => {
    setMarkers((prev) =>
      prev.map((marker) => {
        if (marker.id === markerId) {
          return {
            ...marker,
            images: marker.images.filter((img) => img.id !== imageId),
          };
        }
        return marker;
      })
    );
  };

  return (
    <MarkerContext.Provider value={{ markers, addMarker, addImage, removeImage }}>
      {children}
    </MarkerContext.Provider>
  );
}


export function useMarkers() {
  const context = useContext(MarkerContext);
  if (context === undefined) {
    throw new Error('useMarkers можно использовать только внутри MarkerProvider');
  }
  return context;
}