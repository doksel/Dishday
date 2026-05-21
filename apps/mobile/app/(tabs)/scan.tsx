import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  if (!permission) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading camera…</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, textAlign: 'center' }}>
          Dishday needs camera access to scan grocery barcodes.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{
            marginTop: 16,
            backgroundColor: '#4f46e5',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Grant permission</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        facing="back"
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
        onBarcodeScanned={
          scanning
            ? (result) => {
                setCode(result.data);
                setScanning(false);
              }
            : undefined
        }
      />
      <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
        <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 16 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {code ? `Scanned: ${code}` : 'Point at a barcode…'}
          </Text>
          {code && (
            <Pressable
              onPress={() => {
                setCode(null);
                setScanning(true);
              }}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: '#a5b4fc' }}>Scan another</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
