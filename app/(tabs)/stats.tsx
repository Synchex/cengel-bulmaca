import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStatsStore, computeDerived } from '../../src/store/useStatsStore';
import { useGamificationStore, getXPForNextLevel } from '../../src/store/useGamificationStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
import { typography } from '../../src/theme/typography';

// ── Animated Bar ──
function AnimatedBar({ value, maxValue, color, trackColor }: { value: number; maxValue: number; color: string; trackColor: string }) {
    const widthAnim = useRef(new Animated.Value(0)).current;
    const percent = maxValue > 0 ? Math.min(1, value / maxValue) : 0;

    useEffect(() => {
        Animated.timing(widthAnim, {
            toValue: percent,
            duration: 800,
            delay: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [percent]);

    return (
        <View style={[barStyles.track, { backgroundColor: trackColor }]}>
            <Animated.View
                style={[
                    barStyles.fill,
                    {
                        backgroundColor: color,
                        width: widthAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                        }),
                    },
                ]}
            />
        </View>
    );
}

const barStyles = StyleSheet.create({
    track: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        flex: 1,
    },
    fill: {
        height: '100%',
        borderRadius: 4,
    },
});

// ── Format Time ──
function formatTime(sec: number): string {
    if (sec === 0) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Main Stats Screen ──
export default function StatsScreen() {
    const t = useTheme();
    const isDark = t.id !== 'light';

    const stats = useStatsStore();
    const { currentStreak, longestStreak, totalXP, currentLevel } = useGamificationStore();
    const { accuracyPercent, averageSolveTimeSec } = computeDerived(stats);
    const nextLevelXP = getXPForNextLevel(currentLevel);

    // Find max count in last7Days for bar scaling
    const maxDayCount = Math.max(1, ...stats.last7Days.map((d) => d.count));

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // ── Dynamic colors ──
    const cardBg = isDark ? t.surface2 : t.card;
    const cardBorder = isDark ? 'rgba(255,255,255,0.04)' : t.border;
    const trackColor = isDark ? 'rgba(255,255,255,0.06)' : t.borderLight;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <View style={[styles.levelBadge, { backgroundColor: t.primary }]}>
                            <Text style={styles.levelText}>{currentLevel}</Text>
                        </View>
                        <View>
                            <Text style={[styles.headerTitle, { color: t.text }]}>İstatistikler</Text>
                            <Text style={[styles.headerSub, { color: t.textSecondary }]}>{totalXP} XP · Seviye {currentLevel}</Text>
                        </View>
                    </View>

                    {/* ── Streak Card ── */}
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                        <Text style={[styles.cardTitle, { color: t.text }]}>🔥 Seri</Text>
                        <View style={styles.row}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statBig, { color: t.primary }]}>{currentStreak}</Text>
                                <Text style={[styles.statLabel, { color: t.textSecondary }]}>Güncel Seri</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : t.border }]} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statBig, { color: t.primary }]}>{longestStreak}</Text>
                                <Text style={[styles.statLabel, { color: t.textSecondary }]}>En Uzun</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Performance Card ── */}
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                        <Text style={[styles.cardTitle, { color: t.text }]}>📊 Performans</Text>
                        <View style={styles.perfRow}>
                            <View style={styles.perfItem}>
                                <Text style={[styles.perfValue, { color: t.text }, accuracyPercent >= 80 && { color: t.success }]}>
                                    %{accuracyPercent}
                                </Text>
                                <Text style={[styles.perfLabel, { color: t.textSecondary }]}>Doğruluk</Text>
                            </View>
                            <View style={styles.perfItem}>
                                <Text style={[styles.perfValue, { color: t.text }]}>{formatTime(averageSolveTimeSec)}</Text>
                                <Text style={[styles.perfLabel, { color: t.textSecondary }]}>Ort. Süre</Text>
                            </View>
                            <View style={styles.perfItem}>
                                <Text style={[styles.perfValue, { color: t.accent }]}>
                                    {formatTime(stats.fastestSolveTimeSec)}
                                </Text>
                                <Text style={[styles.perfLabel, { color: t.textSecondary }]}>En Hızlı</Text>
                            </View>
                        </View>

                        <View style={styles.accuracyBar}>
                            <Text style={[styles.accuracyLabel, { color: t.textMuted }]}>Doğruluk</Text>
                            <AnimatedBar value={accuracyPercent} maxValue={100} color={t.success} trackColor={trackColor} />
                            <Text style={[styles.accuracyPct, { color: t.textMuted }]}>{accuracyPercent}%</Text>
                        </View>
                    </View>

                    {/* ── Totals Card ── */}
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                        <Text style={[styles.cardTitle, { color: t.text }]}>🏆 Toplamlar</Text>
                        <View style={styles.totalsGrid}>
                            <View style={[styles.totalItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : t.cardAlt }]}>
                                <Text style={[styles.totalValue, { color: t.text }]}>{stats.totalPuzzlesSolved}</Text>
                                <Text style={[styles.totalLabel, { color: t.textSecondary }]}>Bulmaca</Text>
                            </View>
                            <View style={[styles.totalItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : t.cardAlt }]}>
                                <Text style={[styles.totalValue, { color: t.text }]}>{stats.totalDailySolved}</Text>
                                <Text style={[styles.totalLabel, { color: t.textSecondary }]}>Günlük</Text>
                            </View>
                            <View style={[styles.totalItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : t.cardAlt }]}>
                                <Text style={[styles.totalValue, { color: t.text }]}>{stats.totalCorrectWords}</Text>
                                <Text style={[styles.totalLabel, { color: t.textSecondary }]}>Doğru Kelime</Text>
                            </View>
                            <View style={[styles.totalItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : t.cardAlt }]}>
                                <Text style={[styles.totalValue, { color: t.text }]}>{stats.totalMistakes}</Text>
                                <Text style={[styles.totalLabel, { color: t.textSecondary }]}>Hata</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Last 7 Days Mini Bars ── */}
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                        <Text style={[styles.cardTitle, { color: t.text }]}>📅 Son 7 Gün</Text>
                        {stats.last7Days.length === 0 ? (
                            <Text style={[styles.emptyText, { color: t.textMuted }]}>Henüz veri yok. Bulmaca çözerek başla!</Text>
                        ) : (
                            <View style={styles.barsContainer}>
                                {stats.last7Days.map((day) => {
                                    const barHeight = Math.max(8, (day.count / maxDayCount) * 80);
                                    const dayLabel = day.dateKey.slice(5); // MM-DD
                                    return (
                                        <View key={day.dateKey} style={styles.barColumn}>
                                            <Text style={[styles.barCount, { color: t.textMuted }]}>{day.count}</Text>
                                            <View style={[styles.bar, { height: barHeight, backgroundColor: t.primary }]} />
                                            <Text style={[styles.barDate, { color: t.textMuted }]}>{dayLabel}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    scroll: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    levelBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    },
    headerTitle: {
        ...typography.h1,
    },
    headerSub: {
        ...typography.caption,
        marginTop: 2,
    },
    // ── Card ──
    card: {
        borderRadius: radius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
    },
    cardTitle: {
        ...typography.h3,
        marginBottom: spacing.md,
    },
    // ── Streak ──
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xl,
    },
    statItem: {
        alignItems: 'center',
    },
    statBig: {
        fontSize: 36,
        fontWeight: '800',
    },
    statLabel: {
        ...typography.caption,
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 40,
    },
    // ── Performance ──
    perfRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.md,
    },
    perfItem: {
        alignItems: 'center',
    },
    perfValue: {
        fontSize: 22,
        fontWeight: '800',
    },
    perfLabel: {
        ...typography.caption,
        marginTop: 2,
    },
    accuracyBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: spacing.sm,
    },
    accuracyLabel: {
        ...typography.caption,
        width: 60,
    },
    accuracyPct: {
        ...typography.caption,
        width: 35,
        textAlign: 'right',
    },
    // ── Totals ──
    totalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    totalItem: {
        width: '47%',
        borderRadius: radius.lg,
        padding: spacing.md,
        alignItems: 'center',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    totalLabel: {
        ...typography.caption,
        marginTop: 2,
    },
    // ── Last 7 Days ──
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: 110,
        paddingTop: spacing.sm,
    },
    barColumn: {
        alignItems: 'center',
        flex: 1,
    },
    barCount: {
        ...typography.caption,
        marginBottom: 4,
        fontSize: 10,
    },
    bar: {
        width: 24,
        borderRadius: 4,
    },
    barDate: {
        ...typography.caption,
        marginTop: 4,
        fontSize: 9,
    },
    emptyText: {
        ...typography.body,
        textAlign: 'center',
        paddingVertical: spacing.md,
    },
});
