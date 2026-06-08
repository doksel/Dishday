import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Button, Input, Text } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useThemedStyles, type Theme } from '../../src/theme';

export default function SignupScreen() {
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // TODO: Set up email confirmation and password reset flows in Supabase and handle them here
  // https://supabase.com/dashboard/project/[project_id]/auth/smtp
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
    if (!data.session) setInfo('Check your email to confirm.');
  }

  return (
    <Screen variant="keyboard" centered>
      <Text variant="displayLg">Create your account</Text>
      <Text variant="bodyMd" color="textSecondary" style={styles.subtitle}>
        A few seconds — and you're cooking.
      </Text>

      <View style={styles.form}>
        <Input label="Name" placeholder="Your name" value={name} onChangeText={setName} />
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
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
          error={error ?? undefined}
          helperText={info ?? undefined}
        />
        <Button label="Create account" onPress={onSubmit} loading={loading} fullWidth size="lg" />
        <Link href="/(auth)/login" asChild>
          <Button label="Already have an account? Sign in" variant="ghost" fullWidth />
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
