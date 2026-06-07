import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { supabase } from '../../src/lib/supabase';
import { useTheme, useThemedStyles, type Theme } from '../../src/theme';

export default function LoginScreen() {
  const theme = useTheme();
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
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to your Dishday account.</Text>

      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          placeholderTextColor={theme.colors.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={theme.colors.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable
          onPress={onSubmit}
          disabled={loading}
          style={[styles.submit, loading && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={styles.submitText}>Sign in</Text>
          )}
        </Pressable>
        <Link href="/(auth)/signup" asChild>
          <Pressable>
            <Text style={styles.link}>No account? Create one</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    title: { fontSize: 28, fontWeight: '700', color: theme.colors.text },
    subtitle: { marginTop: 4, color: theme.colors.textSecondary },
    form: { marginTop: theme.spacing.xl, gap: theme.spacing.md },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.inputBackground,
      color: theme.colors.text,
      padding: 12,
      borderRadius: theme.radius.md,
      fontSize: 16,
    },
    error: { color: theme.colors.danger },
    submit: {
      backgroundColor: theme.colors.primary,
      padding: 14,
      borderRadius: theme.radius.md,
      alignItems: 'center',
    },
    submitText: { color: theme.colors.onPrimary, fontWeight: '600' },
    disabled: { opacity: 0.6 },
    link: { textAlign: 'center', color: theme.colors.primary },
  });
}
