import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { MarkerData } from '../types';

interface MapProps {
  markers: MarkerData[];
  onLongPress: (latitude: number, longitude: number) => void;
  onMarkerPress: (markerId: string) => void;
}

type MapMessage =
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'longPress'; latitude: number; longitude: number }
  | { type: 'markerPress'; id: string };

const INITIAL_CENTER = { latitude: 55.751244, longitude: 37.618423, zoom: 11 };

const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    body { -webkit-user-select: none; user-select: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
  <script>
    function send(data) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }

    if (typeof L === 'undefined') {
      send({ type: 'error', message: 'Не удалось загрузить библиотеку карты. Проверьте интернет.' });
    } else {
      var map = L.map('map', { zoomControl: true }).setView(
        [${INITIAL_CENTER.latitude}, ${INITIAL_CENTER.longitude}],
        ${INITIAL_CENTER.zoom}
      );

      var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      var tileErrors = 0;
      tiles.on('tileerror', function () {
        tileErrors++;
        if (tileErrors === 5) {
          send({ type: 'error', message: 'Плитки карты не загружаются. Проверьте интернет.' });
        }
      });
      tiles.on('tileload', function () { tileErrors = 0; });

      var layer = L.layerGroup().addTo(map);

      window.setMarkers = function (list) {
        layer.clearLayers();
        list.forEach(function (m) {
          var marker = L.marker([m.latitude, m.longitude]).addTo(layer);
          marker.on('click', function () { send({ type: 'markerPress', id: m.id }); });
        });
      };

      var timer = null;
      var start = null;
      var el = map.getContainer();

      function cancel() {
        if (timer) { clearTimeout(timer); timer = null; }
      }

      el.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) { cancel(); return; }
        var t = e.touches[0];
        start = { x: t.clientX, y: t.clientY };
        cancel();
        timer = setTimeout(function () {
          timer = null;
          var latlng = map.mouseEventToLatLng({ clientX: start.x, clientY: start.y });
          send({ type: 'longPress', latitude: latlng.lat, longitude: latlng.lng });
        }, 600);
      }, { passive: true });

      el.addEventListener('touchmove', function (e) {
        if (!timer || !start) return;
        var t = e.touches[0];
        if (Math.abs(t.clientX - start.x) > 10 || Math.abs(t.clientY - start.y) > 10) cancel();
      }, { passive: true });

      el.addEventListener('touchend', cancel);
      el.addEventListener('touchcancel', cancel);
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); });

      send({ type: 'ready' });
    }
  </script>
</body>
</html>
`;

export default function Map({ markers, onLongPress, onMarkerPress }: MapProps) {
  const webViewRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!ready) return;
    const payload = markers.map((m) => ({ id: m.id, latitude: m.latitude, longitude: m.longitude }));
    webViewRef.current?.injectJavaScript(
      `window.setMarkers(${JSON.stringify(payload)}); true;`
    );
  }, [markers, ready]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg: MapMessage = JSON.parse(event.nativeEvent.data);
        switch (msg.type) {
          case 'ready':
            setReady(true);
            break;
          case 'error':
            setError(msg.message);
            break;
          case 'longPress':
            onLongPress(msg.latitude, msg.longitude);
            break;
          case 'markerPress':
            onMarkerPress(msg.id);
            break;
        }
      } catch (e) {
        console.warn('Не удалось разобрать сообщение карты', e);
      }
    },
    [onLongPress, onMarkerPress]
  );

  const retry = () => {
    setError(null);
    setReady(false);
    setReloadKey((k) => k + 1);
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.button} onPress={retry}>
          <Text style={styles.buttonText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        key={reloadKey}
        ref={webViewRef}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: MAP_HTML, baseUrl: 'https://localhost/' }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onError={() => setError('Не удалось загрузить карту. Проверьте интернет.')}
        onHttpError={() => setError('Сервер карты вернул ошибку.')}
      />
      {!ready && (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16 },
});