import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useProgressStore } from '../src/store/gameStore';
import { useGamificationStore } from '../src/store/useGamificationStore';
import { useMissionsStore } from '../src/store/useMissionsStore';
import { useDailyPuzzleStore } from '../src/store/useDailyPuzzleStore';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import AchievementToast from '../src/components/AchievementToast';

function AppContent() {
  const t = useTheme();
  const loadProgress = useProgressStore((s) => s.loadProgress);
  const checkDailyStreak = useGamificationStore((s) => s.checkDailyStreak);
  const ensureDailyMissions = useMissionsStore((s) => s.ensureDailyMissions);
  const hydrateDaily = useDailyPuzzleStore((s) => s.hydrate);

  useEffect(() => {
    loadProgress();
    checkDailyStreak();
    ensureDailyMissions();
    hydrateDaily();
  }, []);

  return (
    <>
      <StatusBar style={t.id !== 'light' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game/[id]" />
        <Stack.Screen name="result/[id]" />
        <Stack.Screen name="daily" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="practice" />
      </Stack>
      <AchievementToast />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

