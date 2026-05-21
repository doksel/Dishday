import { SafeAreaView, ScrollView, Text } from 'react-native';

export default function PlannerScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Weekly planner</Text>
        <Text style={{ marginTop: 4, color: '#71717a' }}>7×4 grid here (next iteration).</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
