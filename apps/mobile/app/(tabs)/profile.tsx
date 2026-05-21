import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <View style={{ padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Profile</Text>
        <Pressable
          onPress={() => supabase.auth.signOut()}
          style={{
            backgroundColor: '#fff',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#e4e4e7',
          }}
        >
          <Text style={{ color: '#dc2626', fontWeight: '600' }}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
