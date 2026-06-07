import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../../src/components/Screen';
import { useThemedStyles, type Theme } from '../../src/theme';

export default function ScanScreen() {
  const styles = useThemedStyles(makeStyles);
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  if (!permission) {
    return (
      <Screen centered>
        <Text style={styles.text}>Loading camera…</Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen centered>
        <Text style={styles.permissionText}>
          Dishday needs camera access to scan grocery barcodes.
        </Text>
        <Pressable onPress={requestPermission} style={styles.grantBtn}>
          <Text style={styles.grantBtnText}>Grant permission</Text>
        </Pressable>
      </Screen>
    );
  }

  // Camera view is full-bleed with an absolutely-positioned overlay,
  // so it can't use <Screen> (different layout from the other tabs).
  return (
    <View style={styles.fullBleed}>
      <CameraView
        facing="back"
        style={styles.camera}
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
      <SafeAreaView style={styles.bottomBar}>
        <View style={styles.bottomCard}>
          <Text style={styles.bottomTitle}>
            {code ? `Scanned: ${code}` : 'Point at a barcode…'}
          </Text>
          {code && (
            <Pressable
              onPress={() => {
                setCode(null);
                setScanning(true);
              }}
              style={styles.rescanBtn}
            >
              <Text style={styles.rescanText}>Scan another</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    text: { color: theme.colors.text, textAlign: 'center' },
    permissionText: { fontSize: 16, textAlign: 'center', color: theme.colors.text },
    grantBtn: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.radius.md,
      alignSelf: 'center',
    },
    grantBtnText: { color: theme.colors.onPrimary, fontWeight: '600' },
    fullBleed: { flex: 1, backgroundColor: theme.colors.background },
    camera: { flex: 1 },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: theme.spacing.xl,
    },
    bottomCard: {
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
    },
    bottomTitle: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
    rescanBtn: { marginTop: theme.spacing.sm },
    rescanText: { color: '#a5b4fc' },
  });
}
