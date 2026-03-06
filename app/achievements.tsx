import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useUIProfile } from '../src/theme/ThemeContext';
import { shadows } from '../src/theme/shadows';
import { ACHIEVEMENTS, AchievementDef } from '../src/achievements/achievementDefs';
import { useAchievementsStore } from '../src/store/useAchievementsStore';

type FilterTab = 'all' | 'inProgress' | 'completed';

function AchievementCard({
    def,
    progress,
    isUnlocked,
    t,
    fs,
    isDark,
}: {
    def: AchievementDef;
    progress: number;
    isUnlocked: boolean;
    t: any;
    fs: number;
    isDark: boolean;
}) {
    const pct = Math.min(1, progress / def.target);
    const isHidden = def.hidden && !isUnlocked && pct < 0.5;

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? t.surface2 : t.card,
                    borderColor: isUnlocked
                        ? t.success + '44'
                        : isDark
                            ? 'rgba(255,255,255,0.05)'
                            : t.border,
                },
                isUnlocked && {
                    borderWidth: 1.5,
                },
                isDark && {
                    shadowColor: isUnlocked ? t.success : t.primary,
                    shadowOpacity: isUnlocked ? 0.12 : 0.06,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                },
            ]}
        >
            {/* Icon */}
            <View
                style={[
                    styles.iconContainer,
                    {
                        backgroundColor: isUnlocked
                            ? t.success + '14'
                            : isHidden
                                ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)')
                                : t.primary + '10',
                    },
                ]}
            >
                {isHidden ? (
                    <Ionicons
                        name="help-outline"
                        size={Math.round(24 * fs)}
                        color={t.textMuted}
                    />
                ) : (
                    <Ionicons
                        name={def.icon}
                        size={Math.round(24 * fs)}
                        color={isUnlocked ? t.success : t.primary}
                    />
                )}
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
                <Text
                    style={[
                        styles.cardTitle,
                        {
                            color: isHidden ? t.textMuted : t.text,
                            fontSize: Math.round(15 * fs),
                        },
                    ]}
                    numberOfLines={1}
                >
                    {isHidden ? '???' : def.title}
                </Text>
                <Text
                    style={[
                        styles.cardDesc,
                        {
                            color: t.textSecondary,
                            fontSize: Math.round(12 * fs),
                        },
                    ]}
                    numberOfLines={2}
                >
                    {isHidden ? 'Gizli başarım — keşfet!' : def.description}
                </Text>

                {/* Progress bar or completed badge */}
                {isUnlocked ? (
                    <View style={[styles.completedBadge, { backgroundColor: t.success + '12' }]}>
                        <Ionicons name="checkmark-circle" size={14} color={t.success} />
                        <Text style={[styles.completedText, { color: t.success, fontSize: Math.round(11 * fs) }]}>
                            Tamamlandı
                        </Text>
                    </View>
                ) : (
                    <View style={styles.progressRow}>
                        <View
                            style={[
                                styles.progressTrack,
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : t.fill },
                            ]}
                        >
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${pct * 100}%`,
                                        backgroundColor: t.primary,
                                    },
                                ]}
                            />
                        </View>
                        <Text
                            style={[
                                styles.progressText,
                                { color: t.textMuted, fontSize: Math.round(11 * fs) },
                            ]}
                        >
                            {Math.min(progress, def.target)}/{def.target}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

export default function AchievementsScreen() {
    const router = useRouter();
    const t = useTheme();
    const ui = useUIProfile();
    const fs = ui.fontScale;
    const isDark = t.id !== 'light';

    const achProgress = useAchievementsStore((s) => s.progress);
    const unlockedIds = useAchievementsStore((s) => s.unlockedIds);

    const [filter, setFilter] = useState<FilterTab>('all');

    const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);

    const filteredAchievements = useMemo(() => {
        return ACHIEVEMENTS.filter((a) => {
            const isUnlocked = unlockedSet.has(a.id);
            if (filter === 'completed') return isUnlocked;
            if (filter === 'inProgress') return !isUnlocked;
            return true;
        });
    }, [filter, unlockedSet]);

    const totalCount = ACHIEVEMENTS.length;
    const unlockedCount = unlockedIds.length;
    const overallPct = Math.round((unlockedCount / totalCount) * 100);

    const FILTERS: { key: FilterTab; label: string }[] = [
        { key: 'all', label: 'Tümü' },
        { key: 'inProgress', label: 'Devam Eden' },
        { key: 'completed', label: 'Tamamlanan' },
    ];

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backBtn, { backgroundColor: t.fill }]}
                >
                    <Ionicons name="chevron-back" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: t.text, fontSize: Math.round(20 * fs) }]}>
                    Başarımlar
                </Text>
                <View style={[styles.countBadge, { backgroundColor: t.primary + '14' }]}>
                    <Text style={[styles.countText, { color: t.primary, fontSize: Math.round(13 * fs) }]}>
                        {unlockedCount}/{totalCount}
                    </Text>
                </View>
            </View>

            {/* Summary bar */}
            <View style={[styles.summaryBar, { backgroundColor: isDark ? t.surface2 : t.card, borderColor: isDark ? 'rgba(255,255,255,0.04)' : t.border }]}>
                <View style={styles.summaryLeft}>
                    <Ionicons name="trophy" size={Math.round(28 * fs)} color={t.primary} />
                    <View>
                        <Text style={[styles.summaryCount, { color: t.text, fontSize: Math.round(22 * fs) }]}>
                            {unlockedCount}
                        </Text>
                        <Text style={[styles.summaryLabel, { color: t.textSecondary, fontSize: Math.round(11 * fs) }]}>
                            Başarım Açıldı
                        </Text>
                    </View>
                </View>
                <View style={styles.summaryRight}>
                    <View style={[styles.summaryProgress, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : t.fill }]}>
                        <View
                            style={[
                                styles.summaryProgressFill,
                                { width: `${overallPct}%`, backgroundColor: t.primary },
                            ]}
                        />
                    </View>
                    <Text style={[styles.summaryPct, { color: t.textSecondary, fontSize: Math.round(11 * fs) }]}>
                        %{overallPct}
                    </Text>
                </View>
            </View>

            {/* Filter tabs */}
            <View style={[styles.filterRow, { backgroundColor: isDark ? t.surface2 : t.fill }]}>
                {FILTERS.map((f) => {
                    const active = filter === f.key;
                    return (
                        <TouchableOpacity
                            key={f.key}
                            style={[
                                styles.filterTab,
                                active && {
                                    backgroundColor: isDark ? t.primary + '20' : t.card,
                                    ...(active ? shadows.sm : {}),
                                },
                            ]}
                            onPress={() => setFilter(f.key)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    {
                                        color: active ? t.primary : t.textMuted,
                                        fontSize: Math.round(13 * fs),
                                    },
                                    active && { fontWeight: '700' },
                                ]}
                            >
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Achievement list */}
            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredAchievements.map((a) => (
                    <AchievementCard
                        key={a.id}
                        def={a}
                        progress={achProgress[a.id] ?? 0}
                        isUnlocked={unlockedSet.has(a.id)}
                        t={t}
                        fs={fs}
                        isDark={isDark}
                    />
                ))}
                {filteredAchievements.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="flag-outline" size={48} color={t.textMuted} />
                        <Text style={[styles.emptyText, { color: t.textMuted, fontSize: Math.round(14 * fs) }]}>
                            {filter === 'completed'
                                ? 'Henüz başarım açılmadı'
                                : 'Tüm başarımlar tamamlandı!'}
                        </Text>
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    countBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
    countText: {
        fontWeight: '800',
    },

    // Summary bar
    summaryBar: {
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        ...shadows.sm,
        marginBottom: 12,
    },
    summaryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    summaryCount: {
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    summaryLabel: {
        fontWeight: '500',
    },
    summaryRight: {
        flex: 1,
        alignItems: 'flex-end',
        gap: 4,
    },
    summaryProgress: {
        width: 80,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    summaryProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
    summaryPct: {
        fontWeight: '700',
    },

    // Filter
    filterRow: {
        flexDirection: 'row',
        marginHorizontal: 16,
        borderRadius: 14,
        padding: 3,
        marginBottom: 16,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 11,
        alignItems: 'center',
    },
    filterText: {
        fontWeight: '600',
    },

    // List
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        gap: 10,
    },

    // Card
    card: {
        flexDirection: 'row',
        borderRadius: 18,
        padding: 14,
        borderWidth: StyleSheet.hairlineWidth,
        ...shadows.sm,
        gap: 14,
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        flex: 1,
        gap: 4,
    },
    cardTitle: {
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    cardDesc: {
        fontWeight: '400',
        lineHeight: 16,
    },

    // Progress
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    progressTrack: {
        flex: 1,
        height: 5,
        borderRadius: 2.5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2.5,
    },
    progressText: {
        fontWeight: '700',
        minWidth: 36,
        textAlign: 'right',
    },

    // Completed badge
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    completedText: {
        fontWeight: '700',
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontWeight: '600',
        textAlign: 'center',
    },
});
