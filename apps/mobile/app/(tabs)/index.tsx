import { SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function TodayScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Today</Text>
        <Text style={{ color: '#71717a' }}>Your meals for {new Date().toLocaleDateString()}.</Text>

        {['Breakfast', 'Lunch', 'Dinner'].map((slot) => (
          <View
            key={slot}
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#e4e4e7',
            }}
          >
            <Text style={{ fontSize: 12, color: '#71717a' }}>{slot.toUpperCase()}</Text>
            <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '600' }}>—</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
