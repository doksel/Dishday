import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Button, Input, Text } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useThemedStyles, type Theme } from '../../src/theme';

export default function LoginScreen() {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <Screen variant="keyboard" centered>
      <Text variant="displayLg">{t('login.title')}</Text>
      <Text variant="bodyMd" color="textSecondary" style={styles.subtitle}>
        {t('login.subtitle')}
      </Text>

      <View style={styles.form}>
        <Input
          label={t('login.email')}
          placeholder={t('login.emailPlaceholder')}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label={t('login.password')}
          placeholder={t('login.passwordPlaceholder')}
          secureTextEntry
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          error={error ?? undefined}
        />
        <Button label={t('login.submit')} onPress={onSubmit} loading={loading} fullWidth size="lg" />
        <Link href="/(auth)/signup" asChild>
          <Button label={t('login.toSignup')} variant="ghost" fullWidth />
        </Link>
      </View>
    </Screen>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    subtitle: { marginTop: theme.spacing.xs },
    form: { marginTop: theme.spacing.xl, gap: theme.spacing.md },
  });
}
