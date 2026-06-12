import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme';

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation('common');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.tabBarBorder,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.today'),
          tabBarIcon: ({ color, size }) => <Ionicons name="today" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: t('nav.planner'),
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: t('nav.recipes'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('nav.scan'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barcode-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
