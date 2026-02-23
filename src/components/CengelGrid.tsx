import React, { memo, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GameCell, Entry } from '../cengel/types';
import type { UIProfile } from '../theme/uiProfiles';
import type { ThemeColors } from '../theme/themes';
import type { CellFeedback } from '../hooks/useCellFeedback';
import { cellKey } from '../hooks/useCellFeedback';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface CengelGridProps {
    gameGrid: GameCell[][];
    gridSize: [number, number];
    selectedCell: { row: number; col: number } | null;
    activeEntryCells: Array<{ row: number; col: number }>;
    onCellPress: (row: number, col: number) => void;
    correctFlash?: boolean;
    ui: UIProfile;
    theme: ThemeColors;
    cellFeedback?: CellFeedback;
    /** Entries for clue numbering on tiles */
    entries?: Entry[];
}

export default function CengelGrid({
    gameGrid,
    gridSize,
    selectedCell,
    activeEntryCells,
    onCellPress,
    correctFlash,
    ui,
    theme,
    cellFeedback,
    entries,
}: CengelGridProps) {
    const [rows, cols] = gridSize;
    const gridPadding = ui.gameplay.gridPadding;
    const availableWidth = SCREEN_WIDTH - gridPadding * 2;
    const gap = 1.5;
    const cellSize = Math.floor((availableWidth - gap * (cols - 1)) / cols);
    const gridWidth = cellSize * cols + gap * (cols - 1);
    const gridHeight = cellSize * rows + gap * (rows - 1);

    // Selected cells set for fast lookup
    const activeSet = useMemo(() => {
        const set = new Set<string>();
        activeEntryCells.forEach((c) => set.add(`${c.row},${c.col}`));
        return set;
    }, [activeEntryCells]);

    // Build clue number map: "row,col" → { across?: number, down?: number }
    const clueNumMap = useMemo(() => {
        const map = new Map<string, { across?: number; down?: number }>();
        if (!entries) return map;
        let acrossIdx = 0;
        let downIdx = 0;
        // Sort entries to match CengelClueList numbering (direction groups)
        const acrossEntries = entries.filter(e => e.direction === 'across');
        const downEntries = entries.filter(e => e.direction === 'down');
        acrossEntries.forEach((e, i) => {
            const key = `${e.clueCell.row},${e.clueCell.col}`;
            const existing = map.get(key) || {};
            existing.across = i + 1;
            map.set(key, existing);
        });
        downEntries.forEach((e, i) => {
            const key = `${e.clueCell.row},${e.clueCell.col}`;
            const existing = map.get(key) || {};
            existing.down = i + 1;
            map.set(key, existing);
        });
        return map;
    }, [entries]);

    return (
        <View style={[styles.container, { paddingHorizontal: gridPadding }]}>
            <View
                style={[
                    styles.gridCard,
                    {
                        width: gridWidth + 8,
                        height: gridHeight + 8,
                        backgroundColor: '#1A1A2E',
                    },
                ]}
            >
                <View style={{ width: gridWidth, height: gridHeight }}>
                    {gameGrid.map((row, r) =>
                        row.map((cell, c) => (
                            <MemoCell
                                key={`${r}-${c}`}
                                cell={cell}
                                cellSize={cellSize}
                                gap={gap}
                                isSelected={
                                    selectedCell?.row === r && selectedCell?.col === c
                                }
                                isHighlighted={activeSet.has(`${r},${c}`)}
                                onPress={() => onCellPress(r, c)}
                                correctFlash={correctFlash}
                                ui={ui}
                                theme={theme}
                                cellFeedback={cellFeedback}
                                clueNums={clueNumMap.get(`${r},${c}`)}
                            />
                        )),
                    )}
                </View>
            </View>
        </View>
    );
}

// ── Memoized Cell ──
interface CellComponentProps {
    cell: GameCell;
    cellSize: number;
    gap: number;
    isSelected: boolean;
    isHighlighted: boolean;
    onPress: () => void;
    correctFlash?: boolean;
    ui: UIProfile;
    theme: ThemeColors;
    cellFeedback?: CellFeedback;
    clueNums?: { across?: number; down?: number };
}

const MemoCell = memo(function CellComponent({
    cell,
    cellSize,
    gap,
    isSelected,
    isHighlighted,
    onPress,
    correctFlash,
    ui,
    theme,
    cellFeedback,
    clueNums,
}: CellComponentProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const gp = ui.gameplay;
    const t = theme;

    // Register with cellFeedback
    const feedbackVals = useMemo(() => {
        if (!cellFeedback) return null;
        return cellFeedback.getValues(cellKey(cell.row, cell.col));
    }, [cellFeedback, cell.row, cell.col]);

    // Letter entry bounce
    useEffect(() => {
        if (cell.type === 'LETTER' && cell.userLetter) {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 60,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [cell.type === 'LETTER' ? cell.userLetter : '']);

    // Combine transforms
    const combinedTranslateX = feedbackVals ? feedbackVals.shakeX : new Animated.Value(0);
    const combinedScale = feedbackVals
        ? Animated.multiply(scaleAnim, feedbackVals.scale)
        : scaleAnim;

    const top = cell.row * (cellSize + gap);
    const left = cell.col * (cellSize + gap);

    // ── BLOCK cell ──
    if (cell.type === 'BLOCK') {
        return (
            <View
                style={[
                    styles.cell,
                    {
                        position: 'absolute',
                        top,
                        left,
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: '#1A1A2E',
                        borderRadius: 2,
                    },
                ]}
            />
        );
    }

    // ── CLUE cell ──
    if (cell.type === 'CLUE') {
        const hasAcross = !!cell.clueAcross;
        const hasDown = !!cell.clueDown;
        const displayClue = cell.clueAcross || cell.clueDown || '';
        const arrowSize = Math.max(8, cellSize * 0.18);
        const numFontSize = Math.max(9, cellSize * 0.13);

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                    Haptics.selectionAsync();
                    onPress();
                }}
                style={{ position: 'absolute', top, left, zIndex: 2 }}
            >
                <View
                    style={[
                        styles.clueCell,
                        {
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: '#F5F0EB',
                            borderColor: t.border,
                        },
                    ]}
                >
                    {/* Text area — takes all space above arrows */}
                    <View style={{ flex: 1, width: '100%', justifyContent: 'center', overflow: 'hidden' }}>
                        <Text
                            style={[
                                styles.clueText,
                                {
                                    fontSize: cellSize * gp.clueFontScale,
                                    color: '#4A3B2A',
                                },
                            ]}
                            numberOfLines={4}
                            adjustsFontSizeToFit
                            minimumFontScale={0.3}
                        >
                            {displayClue}
                        </Text>
                    </View>

                    {/* Arrow indicators with clue numbers */}
                    <View style={styles.arrowContainer}>
                        {hasAcross && (
                            <View style={styles.numArrowGroup}>
                                {clueNums?.across != null && (
                                    <Text style={[styles.clueNum, { fontSize: numFontSize, color: t.primary }]}>
                                        {clueNums.across}
                                    </Text>
                                )}
                                <Ionicons
                                    name="arrow-forward"
                                    size={arrowSize}
                                    color={t.primary}
                                />
                            </View>
                        )}
                        {hasDown && (
                            <View style={styles.numArrowGroup}>
                                {clueNums?.down != null && (
                                    <Text style={[styles.clueNum, { fontSize: numFontSize, color: t.primary }]}>
                                        {clueNums.down}
                                    </Text>
                                )}
                                <Ionicons
                                    name="arrow-down"
                                    size={arrowSize}
                                    color={t.primary}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // ── LETTER cell ──
    const isLocked = cell.isLocked ?? false;
    const isRevealed = cell.isRevealed ?? false;

    let bgColor = t.surface;
    let borderColor = t.border;
    let borderW = gp.cellBorderWidth;
    let letterColor = t.text;

    if (isLocked) {
        bgColor = t.successLight;
        borderColor = t.success;
        borderW = gp.highlightBorderWidth;
        letterColor = t.successDark;
    } else if (correctFlash && isHighlighted) {
        bgColor = t.successLight;
    } else if (isSelected) {
        bgColor = t.primarySoft;
        borderColor = t.primary;
        borderW = gp.selectedBorderWidth;
    } else if (isHighlighted) {
        bgColor = '#F3F0FF';
        borderColor = t.primaryLight;
        borderW = gp.highlightBorderWidth;
    }

    if (isRevealed) {
        letterColor = t.accent;
    }

    // Flash border color
    const flashBorderColor = feedbackVals
        ? feedbackVals.flashOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', feedbackVals.flashType === 'correct' ? '#34D399' : '#F87171'],
        })
        : undefined;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
                Haptics.selectionAsync();
                onPress();
            }}
            style={{ position: 'absolute', top, left, zIndex: isSelected ? 10 : 1 }}
        >
            <Animated.View
                style={[
                    styles.cell,
                    {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: bgColor,
                        borderColor,
                        borderWidth: borderW,
                        borderRadius: 3,
                        transform: [{ translateX: combinedTranslateX }, { scale: combinedScale }],
                    },
                ]}
            >
                {/* Feedback flash overlay */}
                {feedbackVals && (
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                borderRadius: 3,
                                zIndex: 0,
                                borderWidth: 2,
                                borderColor: flashBorderColor,
                                opacity: feedbackVals.flashOpacity,
                            },
                        ]}
                        pointerEvents="none"
                    />
                )}

                <Text
                    style={[
                        styles.letterText,
                        {
                            fontSize: Math.max(12, cellSize * gp.letterFontScale),
                            color: letterColor,
                            zIndex: 1,
                        },
                    ]}
                >
                    {cell.userLetter ?? ''}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingTop: 6,
        paddingBottom: 10,
    },
    gridCard: {
        borderRadius: 8,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    clueCell: {
        borderRadius: 2,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 2,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        overflow: 'hidden',
    },
    clueNum: {
        fontWeight: '700',
    },
    numArrowGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1,
    },
    clueText: {
        fontWeight: '600',
        textAlign: 'left',
        flex: 1,
    },
    arrowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 2,
        alignSelf: 'flex-end',
    },
    letterText: {
        fontWeight: '700',
        textAlign: 'center',
        fontFamily: undefined,
    },
});
