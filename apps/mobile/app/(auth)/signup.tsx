import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { supabase } from '../../src/lib/supabase';
import { useTheme, useThemedStyles, type Theme } from '../../src/theme';

export default function SignupScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      <Text style={styles.title}>Create your account</Text>

      <View style={styles.form}>
        <TextInput
          placeholder="Name"
          placeholderTextColor={theme.colors.placeholder}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
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
        {info && <Text style={styles.info}>{info}</Text>}
        <Pressable
          onPress={onSubmit}
          disabled={loading}
          style={[styles.submit, loading && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={styles.submitText}>Create account</Text>
          )}
        </Pressable>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    title: { fontSize: 28, fontWeight: '700', color: theme.colors.text },
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
    info: { color: theme.colors.success },
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
