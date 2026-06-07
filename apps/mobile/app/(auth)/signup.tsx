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

export default function SignupScreen() {
  const theme = useTheme();
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

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    padding: 12,
    borderRadius: theme.radius.md,
    fontSize: 16,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.xl }}
      >
        <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.text }}>
          Create your account
        </Text>

        <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.md }}>
          <TextInput
            placeholder="Name"
            placeholderTextColor={theme.colors.placeholder}
            value={name}
            onChangeText={setName}
            style={inputStyle}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor={theme.colors.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={inputStyle}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.colors.placeholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={inputStyle}
          />
          {error && <Text style={{ color: theme.colors.danger }}>{error}</Text>}
          {info && <Text style={{ color: theme.colors.success }}>{info}</Text>}
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
              <Text style={{ color: theme.colors.onPrimary, fontWeight: '600' }}>
                Create account
              </Text>
            )}
          </Pressable>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={{ textAlign: 'center', color: theme.colors.primary }}>
                Already have an account? Sign in
              </Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
