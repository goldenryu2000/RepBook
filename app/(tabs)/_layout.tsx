import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopColor: '#18181b',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#4ade80', // green-400
        tabBarInactiveTintColor: '#52525b', // zinc-600
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
      screenListeners={{
        state: () => {
          Haptics.selectionAsync();
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Log',
          tabBarIcon: ({ color }) => <Feather name="plus-circle" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'Templates',
          tabBarIcon: ({ color }) => <Feather name="bookmark" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <Feather name="trending-up" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
