import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, type Theme } from '../../src/theme';

export default function ScanScreen() {
  const styles = useThemedStyles(makeStyles);
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  if (!permission) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.text}>Loading camera…</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centeredPadded}>
        <Text style={styles.permissionText}>
          Dishday needs camera access to scan grocery barcodes.
        </Text>
        <Pressable onPress={requestPermission} style={styles.grantBtn}>
          <Text style={styles.grantBtnText}>Grant permission</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
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
    screen: { flex: 1, backgroundColor: theme.colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    centeredPadded: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.background,
    },
    text: { color: theme.colors.text },
    permissionText: { fontSize: 16, textAlign: 'center', color: theme.colors.text },
    grantBtn: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.radius.md,
    },
    grantBtnText: { color: theme.colors.onPrimary, fontWeight: '600' },
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
