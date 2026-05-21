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

export default function SignupScreen() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', padding: 24 }}
      >
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Create your account</Text>

        <View style={{ marginTop: 24, gap: 12 }}>
          <TextInput placeholder="Name" value={name} onChangeText={setName} style={inputStyle} />
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={inputStyle}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={inputStyle}
          />
          {error && <Text style={{ color: '#dc2626' }}>{error}</Text>}
          {info && <Text style={{ color: '#059669' }}>{info}</Text>}
          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={{
              backgroundColor: '#4f46e5',
              padding: 14,
              borderRadius: 10,
              alignItems: 'center',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Create account</Text>}
          </Pressable>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={{ textAlign: 'center', color: '#4f46e5' }}>Already have an account? Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: '#d4d4d8',
  padding: 12,
  borderRadius: 10,
  fontSize: 16,
} as const;
