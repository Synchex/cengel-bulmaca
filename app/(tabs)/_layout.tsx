import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { themes } from '../../src/theme/themes';

function TabBarIcon({ name, color }: { name: keyof typeof Ionicons.glyphMap; color: string }) {
    return <Ionicons name={name} size={22} color={color} />;
}

export default function TabsLayout() {
    const themeId = useSettingsStore((s) => s.themeId);
    const th = themes[themeId] ?? themes.purple;
    const isDark = themeId !== 'light';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: th.tabActive,
                tabBarInactiveTintColor: th.tabInactive,
                sceneStyle: { backgroundColor: th.background },
                tabBarLabelStyle: styles.tabLabel,
                tabBarStyle: [
                    styles.tabBar,
                    isDark
                        ? { borderTopColor: 'rgba(255,255,255,0.04)' }
                        : { borderTopColor: '#E5E7EB' },
                ],
                tabBarBackground: () =>
                    isDark ? (
                        <BlurView
                            intensity={50}
                            tint="dark"
                            style={[
                                StyleSheet.absoluteFill,
                                { backgroundColor: 'rgba(10,15,30,0.85)' },
                            ]}
                        />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />
                    ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Ana Sayfa',
                    tabBarIcon: ({ color }) => (
                        <TabBarIcon name="home" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="chapters"
                options={{
                    title: 'Bölümler',
                    tabBarIcon: ({ color }) => (
                        <TabBarIcon name="map-outline" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="questions"
                options={{
                    title: 'Sorular',
                    href: null,
                    tabBarIcon: ({ color }) => (
                        <TabBarIcon name="list-outline" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: 'İstatistik',
                    tabBarIcon: ({ color }) => (
                        <TabBarIcon name="bar-chart-outline" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="generator"
                options={{
                    title: 'Generator',
                    href: null,
                    tabBarIcon: ({ color }) => (
                        <TabBarIcon name="flask-outline" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Ayarlar',
                    tabBarIcon: ({ color }) => (
                        <TabBarIcon name="settings-outline" color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        backgroundColor: 'transparent',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.08)',
        height: Platform.OS === 'ios' ? 88 : 70,
        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        paddingTop: 8,
        elevation: 0,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 0.07,
    },
});
