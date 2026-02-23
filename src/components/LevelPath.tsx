import React, { useRef, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { levels } from '../levels/levels';
import { useProgressStore } from '../store/gameStore';
import LevelNode from './ui/LevelNode';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { LevelProgress } from '../game/types';
import { DEV_UNLOCK_ALL } from '../config/devConfig';

const { width: SCREEN_W } = Dimensions.get('window');

// Zigzag offsets — sinusoidal wave for a premium path feel
const WAVE_AMPLITUDE = 55;
const getOffset = (index: number): number =>
    Math.round(Math.sin((index * Math.PI) / 2.5) * WAVE_AMPLITUDE);

// Vertical spacing between nodes
const NODE_GAP = 28;
const CONNECTOR_HEIGHT = NODE_GAP;

export default function LevelPath() {
    const router = useRouter();
    const progress = useProgressStore((s) => s.progress);
    const scrollRef = useRef<ScrollView>(null);

    // Find the next playable level
    const nextLevelId =
        progress.find((p) => !p.completed)?.levelId ?? levels.length + 1;

    // Auto-scroll to current level on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            const idx = Math.max(0, nextLevelId - 2);
            // Each node row ≈ nodeHeight + connector
            scrollRef.current?.scrollTo({
                y: idx * (120 + CONNECTOR_HEIGHT),
                animated: true,
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [nextLevelId]);

    const handleNodePress = useCallback(
        (levelId: number, unlocked: boolean) => {
            if (!unlocked) {
                Alert.alert(
                    'Kilitli 🔒',
                    'Kilidi açmak için önce önceki seviyeyi tamamla.'
                );
                return;
            }
            router.push(`/game/${levelId}`);
        },
        [router]
    );

    return (
        <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            {levels.map((level, index) => {
                const p: LevelProgress | undefined = progress.find(
                    (pr) => pr.levelId === level.id
                );
                const unlocked = DEV_UNLOCK_ALL || (p?.unlocked ?? false);
                const completed = p?.completed ?? false;
                const stars = p?.stars ?? 0;
                const isNext = level.id === nextLevelId;
                const offset = getOffset(index);

                // Previous level completion for connector coloring
                const prevCompleted =
                    index > 0 &&
                    (progress.find((pr) => pr.levelId === levels[index - 1].id)
                        ?.completed ??
                        false);

                return (
                    <View key={level.id} style={styles.nodeRow}>
                        {/* Connector line */}
                        {index > 0 && (
                            <View style={styles.connectorWrap}>
                                <View
                                    style={[
                                        styles.connector,
                                        (prevCompleted || completed) && styles.connectorActive,
                                    ]}
                                />
                                {/* Decorative dot at connector midpoint */}
                                <View
                                    style={[
                                        styles.connectorDot,
                                        (prevCompleted || completed) && styles.connectorDotActive,
                                    ]}
                                />
                            </View>
                        )}

                        {/* Node with wave offset */}
                        <View style={[styles.nodeWrapper, { marginLeft: offset }]}>
                            <LevelNode
                                levelId={level.id}
                                title={level.title}
                                difficulty={level.difficulty}
                                gridSize={level.gridSize}
                                unlocked={unlocked}
                                completed={completed}
                                stars={stars}
                                isNext={isNext}
                                index={index}
                                onPress={() => handleNodePress(level.id, unlocked)}
                            />
                        </View>
                    </View>
                );
            })}

            {/* Bottom padding */}
            <View style={{ height: 80 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingTop: spacing.md,
        paddingBottom: spacing.xxl,
    },
    nodeRow: {
        alignItems: 'center',
        width: '100%',
    },
    connectorWrap: {
        height: CONNECTOR_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connector: {
        width: 4,
        height: '100%',
        backgroundColor: colors.border,
        borderRadius: 2,
    },
    connectorActive: {
        backgroundColor: colors.success + '80',
    },
    connectorDot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.border,
    },
    connectorDotActive: {
        backgroundColor: colors.success,
    },
    nodeWrapper: {
        alignItems: 'center',
    },
});
