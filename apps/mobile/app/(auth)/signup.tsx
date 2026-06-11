import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Button, Input, Text } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useThemedStyles, type Theme } from '../../src/theme';

export default function SignupScreen() {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation('auth');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // TODO: Set up email confirmation and password reset flows in Supabase
  async function onSubmit() {
    setError(null);
    setInfo(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (!data.session) setInfo(t('signup.checkEmail'));
  }

  return (
    <Screen variant="keyboard" centered>
      <Text variant="displayLg">{t('signup.title')}</Text>
      <Text variant="bodyMd" color="textSecondary" style={styles.subtitle}>
        {t('signup.subtitle')}
      </Text>

      <View style={styles.form}>
        <Input
          label={t('signup.name')}
          placeholder={t('signup.namePlaceholder')}
          value={name}
          onChangeText={setName}
        />
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
          placeholder={t('signup.passwordPlaceholder')}
          secureTextEntry
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
          error={error ?? undefined}
          helperText={info ?? undefined}
        />
        <Button label={t('signup.submit')} onPress={onSubmit} loading={loading} fullWidth size="lg" />
        <Link href="/(auth)/login" asChild>
          <Button label={t('signup.toLogin')} variant="ghost" fullWidth />
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
