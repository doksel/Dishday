import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Button, Input, Text } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useThemedStyles, type Theme } from '../../src/theme';

export default function LoginScreen() {
  const styles = useThemedStyles(makeStyles);
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
      <Text variant="displayLg">Welcome back</Text>
      <Text variant="bodyMd" color="textSecondary" style={styles.subtitle}>
        Sign in to your Dishday account.
      </Text>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          error={error ?? undefined}
        />
        <Button label="Sign in" onPress={onSubmit} loading={loading} fullWidth size="lg" />
        <Link href="/(auth)/signup" asChild>
          <Button label="No account? Create one" variant="ghost" fullWidth />
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
