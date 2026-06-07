import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/theme';

export default function LoginScreen() {
  const theme = useTheme();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.xl }}
      >
        <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.text }}>
          Welcome back
        </Text>
        <Text style={{ marginTop: 4, color: theme.colors.textSecondary }}>
          Sign in to your Dishday account.
        </Text>

        <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.md }}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={theme.colors.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.inputBorder,
              backgroundColor: theme.colors.inputBackground,
              color: theme.colors.text,
              padding: 12,
              borderRadius: theme.radius.md,
              fontSize: 16,
            }}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.colors.placeholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.inputBorder,
              backgroundColor: theme.colors.inputBackground,
              color: theme.colors.text,
              padding: 12,
              borderRadius: theme.radius.md,
              fontSize: 16,
            }}
          />
          {error && <Text style={{ color: theme.colors.danger }}>{error}</Text>}
          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={{
              backgroundColor: theme.colors.primary,
              padding: 14,
              borderRadius: theme.radius.md,
              alignItems: 'center',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Text style={{ color: theme.colors.onPrimary, fontWeight: '600' }}>Sign in</Text>
            )}
          </Pressable>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text style={{ textAlign: 'center', color: theme.colors.primary }}>
                No account? Create one
              </Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
