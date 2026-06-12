import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/ui';
import { useThemedStyles, type Theme } from '../../src/theme';

export default function ScanScreen() {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation('scan');
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  if (!permission) {
    return (
      <Screen centered>
        <Text variant="bodyMd">{t('loading')}</Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen centered>
        <Text variant="bodyMd" align="center">{t('permissionPrompt')}</Text>
        <Pressable onPress={requestPermission} style={styles.grantBtn}>
          <Text variant="bodyLg" color="onPrimary">{t('grantPermission')}</Text>
        </Pressable>
      </Screen>
    );
  }

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
          <Text variant="bodyLg" style={styles.bottomTitle}>
            {code ? t('scanned', { code }) : t('pointAt')}
          </Text>
          {code && (
            <Pressable
              onPress={() => {
                setCode(null);
                setScanning(true);
              }}
              style={styles.rescanBtn}
            >
              <Text variant="bodyMd" style={styles.rescanText}>{t('scanAnother')}</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    grantBtn: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.radius.full,
      alignSelf: 'center',
    },
    fullBleed: { flex: 1, backgroundColor: theme.colors.background },
    camera: { flex: 1 },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: theme.spacing.md,
    },
    bottomCard: {
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
    },
    bottomTitle: { color: '#ffffff', fontWeight: '600' },
    rescanBtn: { marginTop: theme.spacing.sm },
    rescanText: { color: '#a5b4fc' },
  });
}
