import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { useTheme } from '../../src/theme';

export default function ScanScreen() {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  if (!permission) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <Text style={{ color: theme.colors.text }}>Loading camera…</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.xl,
          backgroundColor: theme.colors.background,
        }}
      >
        <Text style={{ fontSize: 16, textAlign: 'center', color: theme.colors.text }}>
          Dishday needs camera access to scan grocery barcodes.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{
            marginTop: theme.spacing.lg,
            backgroundColor: theme.colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: theme.radius.md,
          }}
        >
          <Text style={{ color: theme.colors.onPrimary, fontWeight: '600' }}>Grant permission</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
      <SafeAreaView
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: theme.spacing.xl }}
      >
        <View
          style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
            {code ? `Scanned: ${code}` : 'Point at a barcode…'}
          </Text>
          {code && (
            <Pressable
              onPress={() => {
                setCode(null);
                setScanning(true);
              }}
              style={{ marginTop: theme.spacing.sm }}
            >
              <Text style={{ color: '#a5b4fc' }}>Scan another</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
