import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../src/theme/ThemeContext';
import { allPuzzles } from '../../src/cengel/puzzles/index';
import { usePuzzleProgressStore } from '../../src/store/usePuzzleProgressStore';
import { useGamificationStore } from '../../src/store/useGamificationStore';
import MapLevelNode, { NodeState } from '../../src/components/map/MapLevelNode';
import MapPath from '../../src/components/map/MapPath';
import PathEnergyFlow from '../../src/components/map/PathEnergyFlow';
import WorldBanner from '../../src/components/map/WorldBanner';
import {
    NODE_POSITIONS,
    BANNER_POSITIONS,
    MAP_HEIGHT,
    MAP_PADDING_TOP,
    NODE_SIZE,
    BOSS_NODE_SIZE,
    TOTAL_LEVELS,
} from '../../src/components/map/mapLayout';
import JourneyBackground from '../../src/components/map/JourneyBackground';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

const SECTION_LABELS: Record<number, string> = {
    1: 'Temel Kavramlar',
    11: 'Orta Seviye',
    21: 'İleri Düzey',
    31: 'Uzman Seviye',
};

export default function ChaptersScreen() {
    const router = useRouter();
    const theme = useTheme();
    const scrollRef = useRef<ScrollView>(null);
    const isDark = theme.id === 'black';

    const progress = usePuzzleProgressStore((s) => s.progress);
    const { currentStreak, weeklyXP } = useGamificationStore();

    // Derive level states
    const levelStates = useMemo(() => {
        return allPuzzles.map((puzzle, index) => {
            const p = progress[puzzle.id];
            const completed = p?.completed ?? false;
            const stars = p?.stars ?? 0;

            const unlocked = index === 0 || (progress[allPuzzles[index - 1]?.id]?.completed ?? false);

            let state: NodeState;
            if (completed) {
                state = 'completed';
            } else if (unlocked) {
                const isFirst = !allPuzzles.slice(0, index).some((prev) => {
                    const pp = progress[prev.id];
                    return !(pp?.completed);
                }) || index === 0;
                state = isFirst ? 'current' : 'unlocked';
            } else {
                state = 'locked';
            }

            return { puzzleId: puzzle.id, state, stars, index };
        });
    }, [progress]);

    const completedCount = useMemo(
        () => levelStates.filter(l => l.state === 'completed').length,
        [levelStates],
    );

    const totalStars = useMemo(
        () => levelStates.reduce((sum, l) => sum + l.stars, 0),
        [levelStates],
    );

    const currentIndex = useMemo(() => {
        const idx = levelStates.findIndex(l => l.state === 'current');
        return idx >= 0 ? idx : 0;
    }, [levelStates]);

    const firstLockedIndex = useMemo(() => {
        const idx = levelStates.findIndex(l => l.state === 'locked');
        return idx >= 0 ? idx : levelStates.length;
    }, [levelStates]);

    // Auto-scroll to current level
    useEffect(() => {
        const timer = setTimeout(() => {
            const node = NODE_POSITIONS[currentIndex];
            if (node && scrollRef.current) {
                const scrollY = Math.max(0, node.y - SCREEN_H / 2);
                scrollRef.current.scrollTo({ y: scrollY, animated: true });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [currentIndex]);

    const handleNodePress = useCallback((puzzleId: string) => {
        router.push(`/game/${puzzleId}`);
    }, [router]);

    return (
        <View style={styles.container}>
            {/* Cinematic space background */}
            <JourneyBackground />

            <SafeAreaView style={styles.flex} edges={['top']}>
                {/* ── Premium Header ── */}
                <View style={styles.headerOuter}>
                    <BlurView intensity={40} tint="dark" style={styles.headerBlur}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.headerInner}>
                            <View style={styles.headerTextBlock}>
                                <Text style={[styles.headerTitle, { color: isDark ? '#F9FAFB' : theme.text }]}>
                                    Bölüm Yolculuğun
                                </Text>
                                <View style={styles.progressRow}>
                                    <View style={styles.progressBarBg}>
                                        <LinearGradient
                                            colors={['#818CF8', '#6366F1']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[
                                                styles.progressBarFill,
                                                { width: `${Math.max(2, (completedCount / TOTAL_LEVELS) * 100)}%` as any },
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.progressText, { color: isDark ? '#9CA3AF' : theme.textSecondary }]}>
                                        {completedCount}/{TOTAL_LEVELS}
                                    </Text>
                                </View>
                            </View>

                            {/* Stat pills */}
                            <View style={styles.chipRow}>
                                <View style={styles.chip}>
                                    <Ionicons name="star" size={12} color="#FBBF24" />
                                    <Text style={styles.chipText}>{totalStars}</Text>
                                </View>
                                {currentStreak > 0 && (
                                    <View style={styles.chip}>
                                        <Ionicons name="flame" size={12} color="#F97316" />
                                        <Text style={styles.chipText}>{currentStreak}</Text>
                                    </View>
                                )}
                                {weeklyXP > 0 && (
                                    <View style={styles.chip}>
                                        <Ionicons name="flash" size={12} color="#818CF8" />
                                        <Text style={styles.chipText}>{weeklyXP}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </BlurView>
                </View>

                {/* ── Map ScrollView ── */}
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={[
                        styles.mapContent,
                        { height: MAP_HEIGHT + MAP_PADDING_TOP },
                    ]}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    <View style={styles.mapContainer}>
                        {/* Curved path lines */}
                        <MapPath
                            nodes={NODE_POSITIONS}
                            firstLockedIndex={firstLockedIndex}
                        />
                        <PathEnergyFlow
                            nodes={NODE_POSITIONS}
                            firstLockedIndex={firstLockedIndex}
                        />

                        {/* World banners */}
                        {BANNER_POSITIONS.map((bp) => (
                            <WorldBanner
                                key={`world-${bp.worldIndex}`}
                                worldIndex={bp.worldIndex}
                                y={bp.y}
                            />
                        ))}

                        {/* Milestone badges (every 5th level) */}
                        {NODE_POSITIONS.map((nodePos) => {
                            const lvl = nodePos.index + 1;
                            if (lvl % 5 !== 0) return null;
                            const badgeSize = 22;
                            const offset = BOSS_NODE_SIZE / 2 + 14;
                            return (
                                <View
                                    key={`ms-${lvl}`}
                                    style={[
                                        styles.milestoneBadge,
                                        {
                                            left: nodePos.x + offset,
                                            top: nodePos.y - badgeSize / 2,
                                            width: badgeSize,
                                            height: badgeSize,
                                            borderRadius: badgeSize / 2,
                                        },
                                    ]}
                                >
                                    <Text style={styles.milestoneText}>{lvl}</Text>
                                </View>
                            );
                        })}
                        {/* Section labels (every 10 levels) */}
                        {Object.entries(SECTION_LABELS).map(([lvlStr, label]) => {
                            const lvl = parseInt(lvlStr, 10);
                            const nodeIdx = lvl - 1;
                            const nodePos = NODE_POSITIONS[nodeIdx];
                            if (!nodePos) return null;
                            const isLeft = nodePos.x > SCREEN_W / 2;
                            return (
                                <View
                                    key={`sec-${lvl}`}
                                    style={[
                                        styles.sectionLabel,
                                        {
                                            top: nodePos.y - 8,
                                            ...(isLeft
                                                ? { left: 16 }
                                                : { right: 16 }),
                                        },
                                    ]}
                                >
                                    <Text style={styles.sectionLabelText}>{label}</Text>
                                </View>
                            );
                        })}

                        {/* Level nodes */}
                        {NODE_POSITIONS.map((nodePos) => {
                            const levelState = levelStates[nodePos.index];
                            if (!levelState) return null;

                            const nodeSize = nodePos.isBoss ? BOSS_NODE_SIZE : NODE_SIZE;
                            const currentBoost = levelState.state === 'current' ? 8 : 0;

                            return (
                                <View
                                    key={`node-${nodePos.index}`}
                                    style={[
                                        styles.nodeWrapper,
                                        {
                                            left: nodePos.x - (nodeSize + currentBoost) / 2 - 16,
                                            top: nodePos.y - (nodeSize + currentBoost) / 2 - 16,
                                            width: nodeSize + currentBoost + 32,
                                            height: nodeSize + currentBoost + 36,
                                        },
                                    ]}
                                >
                                    <MapLevelNode
                                        levelNumber={nodePos.index + 1}
                                        state={levelState.state}
                                        stars={levelState.stars}
                                        isBoss={nodePos.isBoss}
                                        onPress={() => handleNodePress(levelState.puzzleId)}
                                    />
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    // ── Premium Header ──
    headerOuter: {
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 12,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    headerBlur: {
        overflow: 'hidden',
        borderRadius: 18,
    },
    headerInner: {
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    headerTextBlock: {
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    progressBarBg: {
        flex: 1,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 6,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    chipText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 0.1,
    },
    // ── Map ──
    mapContent: {
        position: 'relative',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    nodeWrapper: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    // ── Milestone badges ──
    milestoneBadge: {
        position: 'absolute',
        zIndex: 5,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    milestoneText: {
        fontSize: 8,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: -0.2,
    },
    // ── Section labels ──
    sectionLabel: {
        position: 'absolute',
        zIndex: 4,
        paddingHorizontal: 10,
        paddingVertical: 3,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    sectionLabelText: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: 'rgba(165,180,252,0.35)',
        textTransform: 'uppercase',
    },
});
