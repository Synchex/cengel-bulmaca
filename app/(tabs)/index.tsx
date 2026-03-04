import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProgressStore } from '../../src/store/gameStore';
import { useEconomyStore, STREAK_FREEZE_COST } from '../../src/store/useEconomyStore';
import { useMissionsStore, Mission } from '../../src/store/useMissionsStore';
import { useGamificationStore, getXPForNextLevel } from '../../src/store/useGamificationStore';
import { useDailyPuzzleStore } from '../../src/store/useDailyPuzzleStore';
import { useLeagueStore, LEAGUE_META } from '../../src/store/useLeagueStore';
import { DAILY_COIN_REWARD, DAILY_XP_REWARD } from '../../src/data/dailyPuzzles';
import { levels } from '../../src/levels/levels';
import { useTheme, useUIProfile } from '../../src/theme/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { shadows } from '../../src/theme/shadows';
import IconBadge from '../../src/components/ui/IconBadge';
import ContinueButton from '../../src/components/ui/ContinueButton';
import MissionsModalSheet from '../../src/components/MissionsModalSheet';
import { useAchievementsStore } from '../../src/store/useAchievementsStore';
import { ACHIEVEMENTS } from '../../src/achievements/achievementDefs';
import PlayChooserPanel from '../../src/components/PlayChooserPanel';
import DeveloperPanel from '../../src/components/DeveloperPanel';
import { IS_DEV } from '../../src/config/devConfig';
import { usePuzzleProgressStore } from '../../src/store/usePuzzleProgressStore';
import { allPuzzles } from '../../src/cengel/puzzles/index';
import { getResumePuzzleId, getPuzzleLevelNumber, logContinueDecision } from '../../src/utils/continueLevel';

const { width: SW } = Dimensions.get('window');

// FloatingParticles is imported from shared component
import FloatingParticles from '../../src/components/FloatingParticles';


// ═══════════════════════════════════════════════
//  XP PROGRESS RING
// ═══════════════════════════════════════════════
function XPRing({
  level,
  progress,
  size,
  isDark,
  primaryColor,
}: {
  level: number;
  progress: number;
  size: number;
  isDark: boolean;
  primaryColor: string;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.5, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.2, duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const r = 4;
  const inner = size - r * 2 - 4;

  // Build 4-segment ring from progress ratio
  const filled = '#FFFFFF';
  const empty = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)';

  return (
    <Animated.View style={{ transform: [{ scale: pulse }], alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) / 2,
          backgroundColor: primaryColor,
          opacity: glow,
        }}
      />
      {/* Ring */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: r,
          borderTopColor: progress > 0 ? filled : empty,
          borderRightColor: progress > 0.25 ? filled : empty,
          borderBottomColor: progress > 0.5 ? filled : empty,
          borderLeftColor: progress > 0.75 ? filled : empty,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Inner */}
        <View
          style={{
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={rs.num}>{level}</Text>
          <Text style={rs.label}>SEVİYE</Text>
        </View>
      </View>
    </Animated.View>
  );
}
const rs = StyleSheet.create({
  num: { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  label: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 2, marginTop: -2 },
});

// ═══════════════════════════════════════════════
//  MOTIVATIONAL MICROCOPY
// ═══════════════════════════════════════════════
function getMotivation(
  streak: number,
  xpToLevel: number,
  completedToday: boolean,
  totalCompleted: number,
): string {
  if (completedToday) return 'Bugün harika gidiyorsun!';
  if (xpToLevel <= 50) return 'Seviye atlamana az kaldı!';
  if (streak >= 7) return `${streak} gün! Efsane seri!`;
  if (streak >= 3) return 'Serini korumaya devam!';
  if (streak === 0) return 'Bugün serine başla!';
  if (totalCompleted === 0) return 'İlk bulmacana hazır mısın?';
  return 'Yolculuğuna devam et!';
}

// ═══════════════════════════════════════════════
//  MINI PROGRESSION MAP
// ═══════════════════════════════════════════════
function MiniMap({
  progress,
  currentId,
  total,
  primaryColor,
  isDark,
  textColor,
  mutedColor,
  fs,
}: {
  progress: { levelId: number; completed: boolean; stars: number }[];
  currentId: number;
  total: number;
  primaryColor: string;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  fs: number;
}) {
  const mapRef = useRef<ScrollView>(null);
  const nodeSize = Math.round(40 * fs);
  const gap = 8;
  const showCount = Math.min(total, 20); // show max 20 nodes
  const startId = Math.max(1, currentId - 5);
  const nodes = Array.from({ length: showCount }, (_, i) => {
    const id = startId + i;
    const p = progress.find((x) => x.levelId === id);
    return { id, completed: p?.completed ?? false, stars: p?.stars ?? 0, isCurrent: id === currentId, locked: id > currentId };
  });

  useEffect(() => {
    const idx = nodes.findIndex((n) => n.isCurrent);
    if (idx > 2 && mapRef.current) {
      setTimeout(() => mapRef.current?.scrollTo({ x: Math.max(0, (nodeSize + gap) * (idx - 2)), animated: false }), 100);
    }
  }, [currentId]);

  const currentPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(currentPulse, { toValue: 1.15, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(currentPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <ScrollView
      ref={mapRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap, alignItems: 'center', paddingVertical: 8 }}
    >
      {nodes.map((n) => {
        const bg = n.completed
          ? primaryColor
          : n.isCurrent
            ? primaryColor + '30'
            : isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(0,0,0,0.04)';
        const borderCol = n.isCurrent
          ? primaryColor
          : n.completed
            ? 'transparent'
            : isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.06)';
        const txtCol = n.completed ? '#FFF' : n.locked ? mutedColor : textColor;

        const inner = (
          <View
            style={{
              width: nodeSize,
              height: nodeSize,
              borderRadius: nodeSize / 2,
              backgroundColor: bg,
              borderWidth: n.isCurrent ? 2.5 : 1,
              borderColor: borderCol,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: n.locked ? 0.4 : 1,
            }}
          >
            {n.completed ? (
              <Ionicons name="checkmark" size={Math.round(16 * fs)} color="#FFF" />
            ) : n.locked ? (
              <Ionicons name="lock-closed" size={Math.round(12 * fs)} color={mutedColor} />
            ) : (
              <Text style={{ fontSize: Math.round(13 * fs), fontWeight: '700', color: txtCol }}>{n.id}</Text>
            )}
          </View>
        );

        return n.isCurrent ? (
          <Animated.View key={n.id} style={{ transform: [{ scale: currentPulse }] }}>
            {inner}
          </Animated.View>
        ) : (
          <View key={n.id}>{inner}</View>
        );
      })}
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════
//  INLINE MISSION ROW
// ═══════════════════════════════════════════════
function MissionRow({
  mission,
  onClaim,
  t,
  fs,
  isDark,
}: {
  mission: Mission;
  onClaim: (id: string) => void;
  t: any;
  fs: number;
  isDark: boolean;
}) {
  const pct = Math.min(1, mission.progress / mission.target);
  const barColor = mission.difficulty === 'easy' ? t.success : mission.difficulty === 'medium' ? t.accent : t.secondary;

  return (
    <View
      style={[
        missionStyles.row,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        },
      ]}
    >
      <View style={missionStyles.rowLeft}>
        {/* Progress circle */}
        <View
          style={[
            missionStyles.progressCircle,
            {
              borderColor: mission.completed ? barColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
              backgroundColor: mission.completed ? barColor + '15' : 'transparent',
            },
          ]}
        >
          {mission.completed ? (
            <Ionicons name="checkmark" size={14} color={barColor} />
          ) : (
            <Text style={{ fontSize: Math.round(10 * fs), fontWeight: '700', color: t.textSecondary }}>
              {mission.progress}/{mission.target}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              missionStyles.mTitle,
              { color: t.text, fontSize: Math.round(13 * fs) },
              mission.claimed && { textDecorationLine: 'line-through', color: t.textMuted },
            ]}
            numberOfLines={1}
          >
            {mission.title}
          </Text>
          {/* Mini progress bar */}
          {!mission.completed && (
            <View style={[missionStyles.miniBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : t.fill }]}>
              <View style={[missionStyles.miniBarFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
            </View>
          )}
        </View>
      </View>
      {/* Reward / Claim */}
      {mission.completed && !mission.claimed ? (
        <TouchableOpacity
          style={[missionStyles.claimBtn, { backgroundColor: barColor }]}
          onPress={() => onClaim(mission.id)}
        >
          <Text style={missionStyles.claimText}>Al</Text>
        </TouchableOpacity>
      ) : (
        <View style={missionStyles.xpBadge}>
          <Text style={[missionStyles.xpText, { color: t.textMuted, fontSize: Math.round(11 * fs) }]}>
            +{mission.rewardXP}
          </Text>
        </View>
      )}
    </View>
  );
}

const missionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mTitle: { fontWeight: '600' },
  miniBar: { height: 3, borderRadius: 1.5, marginTop: 4, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 1.5 },
  claimBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  claimText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  xpBadge: {},
  xpText: { fontWeight: '700' },
});

// ═══════════════════════════════════════════════
//  MAIN HOME SCREEN
// ═══════════════════════════════════════════════

export default function HomeScreen() {
  const router = useRouter();
  const t = useTheme();
  const ui = useUIProfile();
  const fs = ui.fontScale;
  const isDark = t.id === 'black';
  const isBig = ui.mode === 'accessible';

  // ── Stores ──
  const progress = useProgressStore((s) => s.progress);
  const loaded = useProgressStore((s) => s.loaded);
  const puzzleProgress = usePuzzleProgressStore((s) => s.progress);
  const coins = useEconomyStore((s) => s.coins);
  const buyStreakFreeze = useEconomyStore((s) => s.buyStreakFreeze);
  const missions = useMissionsStore((s) => s.missions);
  const claimMission = useMissionsStore((s) => s.claimMission);
  const ensureDailyMissions = useMissionsStore((s) => s.ensureDailyMissions);
  const { currentStreak, longestStreak, totalXP, weeklyXP, currentLevel: playerLevel, streakFreezes } =
    useGamificationStore();
  const league = useLeagueStore((s) => s.league);
  const ensureWeeklyLeague = useLeagueStore((s) => s.ensureWeeklyLeague);
  const leagueRank = useLeagueStore((s) => s.getRank(weeklyXP));
  const promotionXP = useLeagueStore((s) => s.getPromotionThreshold());
  const leagueMeta = LEAGUE_META[league];
  const completedToday = useDailyPuzzleStore((s) => s.completedToday);
  const todayPuzzle = useDailyPuzzleStore((s) => s.getTodayPuzzle)();

  // ── UI State ──
  const [shopVisible, setShopVisible] = useState(false);
  const [missionsModalVisible, setMissionsModalVisible] = useState(false);
  const [devPanelVisible, setDevPanelVisible] = useState(false);
  const [playModeVisible, setPlayModeVisible] = useState(false);

  useEffect(() => {
    ensureDailyMissions();
    const ws = new Date();
    const d = ws.getDay();
    ws.setDate(ws.getDate() - (d === 0 ? 6 : d - 1));
    ensureWeeklyLeague(ws.toISOString().split('T')[0], weeklyXP);
  }, []);

  // ── Derived ──
  const nextLevelXP = getXPForNextLevel(playerLevel);
  const prevLevelXP = playerLevel === 1 ? 0 : getXPForNextLevel(playerLevel - 1);
  const levelProgress = Math.min(1, Math.max(0, (totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP)));
  const completedCount = progress.filter((p) => p.completed).length;
  const totalStars = progress.reduce((sum, p) => sum + p.stars, 0);

  // Resume target from çengel puzzle progress
  const allPuzzleIds = useMemo(() => allPuzzles.map((p) => p.id), []);
  const resumePuzzleId = useMemo(
    () => getResumePuzzleId(allPuzzleIds, puzzleProgress) ?? allPuzzleIds[0] ?? '1',
    [allPuzzleIds, puzzleProgress],
  );
  const resumeLevelNum = getPuzzleLevelNumber(resumePuzzleId, allPuzzleIds);
  const xpToNext = nextLevelXP - totalXP;
  const completedMissions = missions.filter((m) => m.completed).length;
  const achUnlockedCount = useAchievementsStore((s) => s.unlockedIds.length);
  const achTotal = ACHIEVEMENTS.length;

  // ── Motivational text ──
  const motivation = useMemo(
    () => getMotivation(currentStreak, xpToNext, completedToday, completedCount),
    [currentStreak, xpToNext, completedToday, completedCount],
  );

  // ── Animations ──
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(50)).current;
  const ctaScale = useRef(new Animated.Value(0.85)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const bodyFade = useRef(new Animated.Value(0)).current;
  const bodySlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.stagger(180, [
      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(ctaScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
        Animated.timing(ctaOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(bodyFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(bodySlide, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // ── Handlers ──
  const handleClaimMission = useCallback((id: string) => {
    const r = claimMission(id);
    if (r) Alert.alert('Ödül Alındı', `${r.coins} coin kazandın!`);
  }, [claimMission]);

  const handleBuyFreeze = useCallback(() => {
    if (buyStreakFreeze()) Alert.alert('Satın Alındı', '1 Seri Dondurucu eklendi.');
    else Alert.alert('Yetersiz Coin', `Seri dondurucu ${STREAK_FREEZE_COST} coin gerektirir.`);
  }, [buyStreakFreeze]);

  if (!loaded) {
    return (
      <View style={[s.center, { backgroundColor: t.background }]}>
        <Text style={{ color: t.textSecondary, fontSize: 16 }}>Yükleniyor...</Text>
      </View>
    );
  }

  // ── XP for next level display ──
  const baseXP = 40; // rough XP per puzzle for the preview

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {isDark && <LinearGradient colors={['#0B1020', '#060A14']} style={StyleSheet.absoluteFill} />}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} bounces>
        {/* ╔══════════════════════════════════╗
            ║        HERO SECTION (40%)        ║
            ╚══════════════════════════════════╝ */}
        <LinearGradient
          colors={isDark
            ? ['#1A1040', '#0F1D40', '#0B1020'] as const
            : [...t.gradientPrimary, t.primaryDark] as readonly [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={s.hero}
        >
          <FloatingParticles />
          <SafeAreaView edges={['top']} style={s.heroSafe}>
            <Animated.View style={{ opacity: heroFade, transform: [{ translateY: heroSlide }], alignItems: 'center', width: '100%' }}>
              {/* Top Bar */}
              <View style={s.topBar}>
                <TouchableOpacity
                  style={s.coinPill}
                  activeOpacity={0.7}
                  onLongPress={() => IS_DEV && setDevPanelVisible(true)}
                  delayLongPress={2000}
                >
                  <Ionicons name="wallet" size={13} color="#FFD700" />
                  <Text style={s.coinPillText}>{coins}</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={s.shopPill}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/achievements');
                    }}
                  >
                    <Ionicons name="trophy" size={15} color="#FFD700" />
                    {achTotal > 0 && (
                      <View style={s.achBadge}>
                        <Text style={s.achBadgeText}>{achUnlockedCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.shopPill}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMissionsModalVisible(true);
                    }}
                  >
                    <Ionicons name="checkbox-outline" size={15} color="rgba(255,255,255,0.85)" />
                    <View style={[s.achBadge, completedMissions >= missions.length && completedMissions > 0 ? { backgroundColor: '#34C759' } : {}]}>
                      <Text style={s.achBadgeText}>
                        {completedMissions >= missions.length && completedMissions > 0 ? '✓' : `${completedMissions}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.shopPill} onPress={() => setShopVisible(true)}>
                    <Ionicons name="bag-outline" size={15} color="rgba(255,255,255,0.85)" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* XP Ring + Level */}
              <XPRing
                level={playerLevel}
                progress={levelProgress}
                size={isBig ? 104 : 90}
                isDark={isDark}
                primaryColor={t.primary}
              />

              {/* XP Text */}
              <Text style={[s.xpText, { fontSize: Math.round(12 * fs) }]}>
                {totalXP - prevLevelXP} / {nextLevelXP - prevLevelXP} XP
              </Text>

              {/* Motivational microcopy */}
              <Text style={[s.motivation, { fontSize: Math.round(14 * fs) }]}>{motivation}</Text>

              {/* Badge Chips */}
              <View style={s.chips}>
                {/* Streak */}
                <View style={[s.chip, currentStreak > 0 && { backgroundColor: 'rgba(255,103,35,0.2)' }]}>
                  <Ionicons name="flame" size={Math.round(14 * fs)} color="#FF6723" />
                  <Text style={[s.chipText, { fontSize: Math.round(11 * fs) }]}>
                    {currentStreak > 0 ? `${currentStreak} Gün Seri` : 'Seri Başlat'}
                  </Text>
                </View>
                {/* Stars */}
                <View style={s.chip}>
                  <Ionicons name="star" size={Math.round(13 * fs)} color="#FFD700" />
                  <Text style={[s.chipText, { fontSize: Math.round(12 * fs) }]}>{totalStars}</Text>
                </View>
                {/* League */}
                <View style={[s.chip, { backgroundColor: leagueMeta.color + '22' }]}>
                  <Ionicons name={leagueMeta.icon as any} size={Math.round(13 * fs)} color={leagueMeta.color} />
                  <Text style={[s.chipText, { fontSize: Math.round(11 * fs), color: leagueMeta.color }]}>#{leagueRank}</Text>
                </View>
              </View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        {/* ╔══════════════════════════════════╗
            ║       CONTINUE CTA (dominant)    ║
            ╚══════════════════════════════════╝ */}
        <Animated.View
          style={[
            { opacity: ctaOpacity, transform: [{ scale: ctaScale }] },
          ]}
        >
          <ContinueButton
            title="Yolculuğa Devam"
            subtitle={`Bölüm ${resumeLevelNum}`}
            xpLabel={`+${baseXP} XP`}
            onPress={() => {
              logContinueDecision(resumePuzzleId, resumeLevelNum);
              router.push(`/game/${resumePuzzleId}`);
            }}
            primaryColors={isDark ? ['#5E8BFF', '#7B61FF'] as const : t.gradientPrimary as readonly [string, string]}
            glowColor={t.primary}
            isDark={isDark}
            isBig={isBig}
            fontScale={fs}
            glowEnabled={!!ui.glow}
          />
        </Animated.View>

        {/* ╔══════════════════════════════════╗
            ║       PLAY MODE CARDS            ║
            ╚══════════════════════════════════╝ */}
        <Animated.View style={[s.playRow, { opacity: bodyFade, transform: [{ translateY: bodySlide }] }]}>
          <TouchableOpacity
            style={[s.playCard, { backgroundColor: isDark ? t.surface2 : t.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : t.border },
            isDark && ui.glow && { shadowColor: t.primary, shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
            ]}
            activeOpacity={0.82}
            onPress={() => router.push('/(tabs)/chapters')}
          >
            <View style={[s.playIcon, { backgroundColor: t.primary + '12' }]}>
              <Ionicons name="map-outline" size={Math.round(22 * fs)} color={t.primary} />
            </View>
            <Text style={[s.playTitle, { color: t.text, fontSize: Math.round(13 * fs) }]}>Bölümler</Text>
            <Text style={[s.playSub, { color: t.textSecondary, fontSize: Math.round(10 * fs) }]}>Seviye seviye</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.playCard, { backgroundColor: isDark ? t.surface2 : t.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : t.border },
            isDark && ui.glow && { shadowColor: t.accent, shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
            ]}
            activeOpacity={0.82}
            onPress={() => router.push('/big-puzzle')}
          >
            <View style={[s.playIcon, { backgroundColor: t.accent + '12' }]}>
              <Ionicons name="grid-outline" size={Math.round(22 * fs)} color={t.accent} />
            </View>
            <Text style={[s.playTitle, { color: t.text, fontSize: Math.round(13 * fs) }]}>Büyük Bulmaca</Text>
            <Text style={[s.playSub, { color: t.textSecondary, fontSize: Math.round(10 * fs) }]}>Rastgele boy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.playCard, { backgroundColor: isDark ? t.surface2 : t.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : t.border },
            isDark && ui.glow && { shadowColor: '#34C759', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
            ]}
            activeOpacity={0.82}
            onPress={() => router.push('/practice')}
          >
            <View style={[s.playIcon, { backgroundColor: '#34C75912' }]}>
              <Ionicons name="flash-outline" size={Math.round(22 * fs)} color="#34C759" />
            </View>
            <Text style={[s.playTitle, { color: t.text, fontSize: Math.round(13 * fs) }]}>Alıştırma</Text>
            <Text style={[s.playSub, { color: t.textSecondary, fontSize: Math.round(10 * fs) }]}>Kendini test et</Text>
          </TouchableOpacity>
        </Animated.View>


        {/* ╔══════════════════════════════════╗
            ║     PROGRESSION MAP PREVIEW      ║
            ╚══════════════════════════════════╝ */}
        <Animated.View style={[s.section, { opacity: bodyFade, transform: [{ translateY: bodySlide }] }]}>
          <Text style={[s.sectionTitle, { color: t.text, fontSize: Math.round(16 * fs) }]}>İlerleme Haritası</Text>
          <View style={[s.mapCard, { backgroundColor: isDark ? t.surface2 : t.card, borderColor: isDark ? 'rgba(255,255,255,0.04)' : t.border },
          isDark && ui.glow && { shadowColor: t.primary, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
          ]}>
            <MiniMap
              progress={progress}
              currentId={resumeLevelNum}
              total={levels.length}
              primaryColor={t.primary}
              isDark={isDark}
              textColor={t.text}
              mutedColor={t.textMuted}
              fs={fs}
            />
          </View>
        </Animated.View>

        {/* ╔══════════════════════════════════╗
            ║       DAILY CHALLENGE CARD       ║
            ╚══════════════════════════════════╝ */}
        <Animated.View style={[s.section, { opacity: bodyFade, transform: [{ translateY: bodySlide }] }]}>
          <TouchableOpacity
            style={[s.depthCard, { backgroundColor: isDark ? t.surface2 : t.card, borderColor: isDark ? 'rgba(255,255,255,0.04)' : t.border },
            isDark && ui.glow && { shadowColor: t.accent, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
            ]}
            activeOpacity={0.85}
            onPress={() => !completedToday && router.push('/daily')}
          >
            <View style={s.dcRow}>
              <View style={[s.dcIcon, { backgroundColor: t.accent + '14' }]}>
                <Ionicons name="today-outline" size={Math.round(24 * fs)} color={t.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.dcTitle, { color: t.text, fontSize: Math.round(16 * fs) }]}>Bugünün Bulmacası</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
                  <View style={s.dcReward}>
                    <Ionicons name="sparkles" size={10} color={t.accent} />
                    <Text style={[s.dcRewardText, { color: t.accent }]}>+{DAILY_XP_REWARD} XP</Text>
                  </View>
                  <View style={s.dcReward}>
                    <Ionicons name="wallet-outline" size={10} color={t.textSecondary} />
                    <Text style={[s.dcRewardText, { color: t.textSecondary }]}>+{DAILY_COIN_REWARD}</Text>
                  </View>
                </View>
              </View>
              <View style={[s.dcBadge, completedToday ? { backgroundColor: t.success + '18' } : { backgroundColor: t.accent }]}>
                <Ionicons name={completedToday ? 'checkmark' : 'play'} size={16} color={completedToday ? t.success : '#FFF'} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ╔══════════════════════════════════╗
            ║         LEAGUE + SOCIAL          ║
            ╚══════════════════════════════════╝ */}
        <Animated.View style={[s.section, { opacity: bodyFade, transform: [{ translateY: bodySlide }] }]}>
          <Text style={[s.sectionTitle, { color: t.text, fontSize: Math.round(16 * fs) }]}>Haftalık Lig</Text>
          <View style={[s.depthCard, { backgroundColor: isDark ? t.surface2 : t.card, borderColor: isDark ? 'rgba(255,255,255,0.04)' : t.border },
          isDark && ui.glow && { shadowColor: leagueMeta.color, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
          ]}>
            <View style={s.dcRow}>
              <View style={[s.dcIcon, { backgroundColor: leagueMeta.color + '14' }]}>
                <Ionicons name={leagueMeta.icon as any} size={Math.round(24 * fs)} color={leagueMeta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.dcTitle, { color: t.text, fontSize: Math.round(16 * fs) }]}>{leagueMeta.label} Lig</Text>
                <Text style={[s.dcSubMeta, { color: t.textSecondary, fontSize: Math.round(12 * fs) }]}>
                  #{leagueRank}  ·  {weeklyXP} XP
                </Text>
              </View>
              {leagueRank <= 3 && (
                <View style={[s.top3Badge, { backgroundColor: '#FFD700' + '20' }]}>
                  <Ionicons name="trophy" size={14} color="#FFD700" />
                </View>
              )}
            </View>
            {promotionXP > 0 && (
              <View style={s.leagueBar}>
                <View style={[s.leagueBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : t.fill }]}>
                  <View style={[s.leagueBarFill, { width: `${Math.min(100, (weeklyXP / promotionXP) * 100)}%`, backgroundColor: leagueMeta.color }]} />
                </View>
                <Text style={[s.leagueBarText, { color: t.textMuted, fontSize: Math.round(10 * fs) }]}>
                  {promotionXP} XP
                </Text>
              </View>
            )}
            <View style={s.leagueHint}>
              <Ionicons name="information-circle-outline" size={12} color={t.textMuted} />
              <Text style={[s.leagueHintText, { color: t.textMuted, fontSize: Math.round(11 * fs) }]}>
                İlk 3 bonus XP kazanır
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ╔══════════════════════════════════╗
            ║         STREAK CARD              ║
            ╚══════════════════════════════════╝ */}
        <Animated.View style={[s.section, { opacity: bodyFade, transform: [{ translateY: bodySlide }] }]}>
          <View style={[s.depthCard, { backgroundColor: isDark ? t.surface2 : t.card, borderColor: isDark ? 'rgba(255,255,255,0.04)' : t.border },
          isDark && ui.glow && { shadowColor: '#FF6723', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
          ]}>
            <View style={s.dcRow}>
              <View style={[s.dcIcon, { backgroundColor: '#FF672314' }]}>
                <Ionicons name="flame" size={Math.round(24 * fs)} color="#FF6723" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.dcTitle, { color: t.text, fontSize: Math.round(16 * fs) }]}>
                  {currentStreak} Günlük Seri
                </Text>
                <Text style={[s.dcSubMeta, { color: t.textSecondary, fontSize: Math.round(12 * fs) }]}>
                  {longestStreak > 0 ? `En uzun: ${longestStreak} gün` : 'Her gün oyna!'}
                </Text>
              </View>
              <View style={s.streakFireNum}>
                <Text style={[s.streakNumText, { color: '#FF6723', fontSize: Math.round(20 * fs) }]}>{currentStreak}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ════ MODALS ════ */}

      <Modal visible={shopVisible} transparent animationType="slide" onRequestClose={() => setShopVisible(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShopVisible(false)}>
          <View style={[s.shopSheet, { backgroundColor: isDark ? t.surface : t.card }]}>
            <View style={[s.handle, { backgroundColor: t.fill }]} />
            <Text style={[s.shopTitle, { color: t.text }]}>Mağaza</Text>
            <View style={s.shopCoinsRow}>
              <Ionicons name="wallet" size={14} color={t.accent} />
              <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600', marginLeft: 4 }}>{coins} Coin</Text>
            </View>
            <TouchableOpacity style={[s.shopItem, { backgroundColor: isDark ? t.surface2 : t.cardAlt }]} onPress={handleBuyFreeze}>
              <View style={s.shopItemL}>
                <IconBadge name="snow" size={18} color="#5AC8FA" backgroundColor="#5AC8FA14" badgeSize={38} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.shopItemT, { color: t.text }]}>Seri Dondurucu</Text>
                  <Text style={[s.shopItemD, { color: t.textSecondary }]}>Mevcut: {streakFreezes}</Text>
                </View>
              </View>
              <View style={[s.shopPrice, { backgroundColor: t.primary }]}>
                <Text style={s.shopPriceT}>{STREAK_FREEZE_COST}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[s.shopClose, { backgroundColor: t.primarySoft }]} onPress={() => setShopVisible(false)}>
              <Text style={[s.shopCloseT, { color: t.primary }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <PlayChooserPanel
        visible={playModeVisible}
        onClose={() => setPlayModeVisible(false)}
        options={[
          { title: 'Bölümler', subtitle: 'Seviye seviye ilerle', icon: 'map-outline', iconColor: t.primary, onPress: () => router.push('/(tabs)/chapters') },
          { title: 'Büyük Bulmaca', subtitle: 'Rastgele, büyük boy', icon: 'grid-outline', iconColor: t.accent, onPress: () => router.push('/big-puzzle') },
        ]}
      />

      <MissionsModalSheet
        visible={missionsModalVisible}
        missions={missions}
        onClaim={handleClaimMission}
        onClose={() => setMissionsModalVisible(false)}
      />

      <DeveloperPanel visible={devPanelVisible} onClose={() => setDevPanelVisible(false)} />
    </View>
  );
}

// ═══════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 20 },

  // Hero
  hero: { paddingBottom: 30, overflow: 'hidden' },
  heroSafe: { alignItems: 'center', paddingTop: 4 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, marginBottom: 10 },
  coinPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  coinPillText: { fontSize: 13, fontWeight: '700', color: '#FFD700' },
  shopPill: { backgroundColor: 'rgba(255,255,255,0.1)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  achBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF6723', minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  achBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF' },

  xpText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 10 },
  motivation: { color: '#FFFFFF', fontWeight: '700', marginTop: 6, textAlign: 'center', letterSpacing: -0.2 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  chipText: { color: '#FFF', fontWeight: '700' },

  // CTA
  ctaOuter: { marginHorizontal: 20, marginTop: -18 },
  ctaGlow: { position: 'absolute', top: 6, left: 24, right: 24, height: '100%', borderRadius: 24, opacity: 0.2, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  ctaBtn: { borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, ...shadows.lg },
  ctaContent: { gap: 3 },
  ctaTitle: { color: '#FFF', fontWeight: '800', letterSpacing: -0.3 },
  ctaMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaMeta: { color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  ctaXpChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  ctaXpText: { color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
  ctaArrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  // Play
  playRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, gap: 12 },
  playCard: { flex: 1, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 10, gap: 4, ...shadows.sm },
  playIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  playTitle: { fontWeight: '700', textAlign: 'center', letterSpacing: -0.2 },
  playSub: { textAlign: 'center' },

  // Sections
  section: { marginHorizontal: 20, marginTop: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontWeight: '800', letterSpacing: -0.3, marginBottom: 8 },
  sectionBadge: { fontWeight: '800' },

  // Depth Cards
  depthCard: { borderRadius: 22, padding: 16, borderWidth: StyleSheet.hairlineWidth, ...shadows.sm, gap: 12 },
  dcRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dcIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dcTitle: { fontWeight: '700', letterSpacing: -0.2 },
  dcSubMeta: { fontWeight: '500', marginTop: 2 },
  dcReward: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dcRewardText: { fontSize: 11, fontWeight: '700' },
  dcBadge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  // Map
  mapCard: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 10, ...shadows.sm },

  // League
  leagueBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leagueBarTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  leagueBarFill: { height: '100%', borderRadius: 3 },
  leagueBarText: { fontWeight: '600' },
  leagueHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leagueHintText: { fontWeight: '500' },
  top3Badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  // Streak
  streakFireNum: { backgroundColor: '#FF672312', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  streakNumText: { fontWeight: '900' },

  // Modal / Shop
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  shopSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  shopTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  shopCoinsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 20 },
  shopItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16, marginBottom: 10 },
  shopItemL: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  shopItemT: { fontSize: 15, fontWeight: '600' },
  shopItemD: { fontSize: 12, marginTop: 2 },
  shopPrice: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  shopPriceT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  shopClose: { alignItems: 'center', paddingVertical: 14, borderRadius: 14, marginTop: 10 },
  shopCloseT: { fontSize: 15, fontWeight: '700' },
});
