/**
 * BigCrosswordScreen – Classic Turkish Newspaper Crossword
 *
 * Redesigned to match Hürriyet / Cumhuriyet weekend crossword sections.
 * Off-white paper background, serif typography, thick grid borders,
 * flat keyboard, no gaming UI elements.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Pressable,
    StyleSheet,
    Dimensions,
    FlatList,
    ScrollView,
    Modal,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { LevelData, Word, CellData, Direction } from '../../src/game/types';
import { useCrosswordGame } from '../../src/game/useCrosswordGame';
import { useCellFeedback, cellKey } from '../../src/hooks/useCellFeedback';
import TurkishKeyboard from '../../src/components/TurkishKeyboard';
import { useAudioManager } from '../../src/hooks/useAudioManager';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GRID_PAD = 4;

// ── Color Palette (Newspaper) ─────────────────────
const INK = '#111111';
const PAPER = '#F4F1E8';
const PAPER_DARK = '#EDE9DD';
const GRID_LINE = '#333333';
const CELL_WHITE = '#FFFFFF';
const CELL_BLACK = '#000000';
const CELL_SELECTED = '#EFE7D6';
const CELL_PATH = '#F5F0E6';
const CELL_LOCKED = '#F0EDE6';
const TEXT_MUTED = '#888888';
const TEXT_SUBTLE = '#555555';
const SEPARATOR = '#CCCCCC';
const BORDER_DARK = '#222222';

// ── Serif Font ─────────────────────
const SERIF = Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
});

// ═══════════════════════════════════════
//  Grid Cell – Newspaper style
// ═══════════════════════════════════════
interface CellProps {
    cell: CellData;
    cellSize: number;
    isSelected: boolean;
    isOnPath: boolean;
    onPress: () => void;
}

const MemoCell = memo(function GridCell({ cell, cellSize, isSelected, isOnPath, onPress }: CellProps) {
    if (cell.isBlack) {
        return (
            <View style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: CELL_BLACK,
            }} />
        );
    }

    let bg = CELL_WHITE;
    if (cell.isLocked) bg = CELL_LOCKED;
    if (isOnPath) bg = CELL_PATH;
    if (isSelected) bg = CELL_SELECTED;

    const numFS = Math.max(7, cellSize * 0.22);
    const letterFS = Math.max(10, cellSize * 0.52);

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => { Haptics.selectionAsync(); onPress(); }}
            style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: bg,
                borderRightWidth: StyleSheet.hairlineWidth,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderColor: GRID_LINE,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {cell.number != null && (
                <Text style={{
                    position: 'absolute',
                    top: 1,
                    left: 2,
                    fontSize: numFS,
                    fontFamily: SERIF,
                    fontWeight: '400',
                    color: TEXT_SUBTLE,
                    lineHeight: numFS + 2,
                }}>{cell.number}</Text>
            )}
            <Text style={{
                fontSize: letterFS,
                fontFamily: SERIF,
                fontWeight: '400',
                color: INK,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
            }}>
                {cell.userLetter || ''}
            </Text>
        </TouchableOpacity>
    );
});

// ═══════════════════════════════════════
//  Clue Row – Newspaper style
// ═══════════════════════════════════════
const MemoClueRow = memo(function ClueRow({ word, isActive, isCompleted, onPress }: {
    word: Word; isActive: boolean; isCompleted: boolean; onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[
                clueStyles.row,
                isActive && clueStyles.rowActive,
            ]}
        >
            <Text style={[
                clueStyles.num,
                isActive && clueStyles.numActive,
            ]}>{word.num}.</Text>
            <Text
                style={[
                    clueStyles.text,
                    isCompleted && clueStyles.textCompleted,
                ]}
                numberOfLines={2}
            >
                {word.clue}
            </Text>
        </TouchableOpacity>
    );
});

const clueStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 12,
        gap: 6,
    },
    rowActive: {
        backgroundColor: CELL_SELECTED,
    },
    num: {
        fontSize: 13,
        fontFamily: SERIF,
        fontWeight: '700',
        color: TEXT_SUBTLE,
        minWidth: 24,
    },
    numActive: {
        color: INK,
    },
    text: {
        flex: 1,
        fontSize: 13,
        fontFamily: SERIF,
        color: INK,
        lineHeight: 18,
    },
    textCompleted: {
        color: TEXT_MUTED,
        textDecorationLine: 'line-through',
    },
});

// ═══════════════════════════════════════
//  Main Screen
// ═══════════════════════════════════════
interface Props { level: LevelData; onBack: () => void; }

export default function BigCrosswordScreen({ level, onBack }: Props) {
    const { state, selectCell, typeLetter, backspace, checkWord, revealHint, getSelectedWordCells, wordMap } = useCrosswordGame(level);
    const cellFeedback = useCellFeedback();
    const { playSfx } = useAudioManager();

    const [clueTab, setClueTab] = useState<Direction>('across');
    const [clueListOpen, setClueListOpen] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [hintModalVisible, setHintModalVisible] = useState(false);

    const acrossClues = useMemo(() => level.words.filter(w => w.direction === 'across').sort((a, b) => a.num - b.num), [level.words]);
    const downClues = useMemo(() => level.words.filter(w => w.direction === 'down').sort((a, b) => a.num - b.num), [level.words]);
    const activeClues = clueTab === 'across' ? acrossClues : downClues;

    const selectedWordCells = getSelectedWordCells();
    const pathSet = useMemo(() => { const s = new Set<string>(); selectedWordCells.forEach(c => s.add(`${c.row},${c.col}`)); return s; }, [selectedWordCells]);

    const activeWord = state.selectedWordId ? wordMap.get(state.selectedWordId) : null;

    // Auto-select first YATAY clue on mount
    const didAutoSelect = useRef(false);
    useEffect(() => {
        if (didAutoSelect.current) return;
        if (acrossClues.length === 0) return;
        didAutoSelect.current = true;
        const first = acrossClues[0];
        selectCell(first.startRow, first.startCol);
        setClueTab('across');
    }, [acrossClues, selectCell]);

    const handleCellPress = useCallback((row: number, col: number) => {
        selectCell(row, col);
        const cell = state.grid[row]?.[col];
        if (cell && !cell.isBlack) {
            const words = cell.wordIds.map(id => wordMap.get(id)).filter(Boolean) as Word[];
            if (words.length > 0) {
                const ha = words.some(w => w.direction === 'across');
                const hd = words.some(w => w.direction === 'down');
                if (ha && !hd) setClueTab('across');
                else if (hd && !ha) setClueTab('down');
                else if (state.selectedDirection) setClueTab(state.selectedDirection);
            }
        }
    }, [selectCell, state.grid, state.selectedDirection, wordMap]);

    const handleCluePress = useCallback((word: Word) => {
        Haptics.selectionAsync();
        selectCell(word.startRow, word.startCol);
        setClueTab(word.direction);
    }, [selectCell]);

    const handleCheck = useCallback(() => {
        const r = checkWord();
        if (r.result === 'correct') { setFeedback('correct'); playSfx('correctWord'); cellFeedback.animateBatchCorrect(r.cells.map(c => cellKey(c.row, c.col))); }
        else if (r.result === 'wrong') { setFeedback('wrong'); playSfx('wrongWord'); cellFeedback.animateBatchWrong(r.cells.filter(c => !c.isCorrect).map(c => cellKey(c.row, c.col))); }
        setTimeout(() => setFeedback(null), 2000);
    }, [checkWord, playSfx, cellFeedback]);

    // Grid sizing
    const gridW = SCREEN_W - GRID_PAD * 2;
    const cellSize = Math.floor(gridW / level.gridSize);
    const totalGrid = cellSize * level.gridSize;

    return (
        <SafeAreaView style={[st.safe, { backgroundColor: PAPER }]} edges={['top', 'bottom']}>
            {/* ── Top Bar ── */}
            <View style={st.header}>
                <TouchableOpacity onPress={onBack} style={st.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={st.backText}>←</Text>
                </TouchableOpacity>
                <View style={st.headerCenter}>
                    <Text style={st.title}>BÜYÜK BULMACA</Text>
                </View>
                <View style={st.backBtn} />
            </View>
            <View style={st.titleSep} />
            <Text style={st.subtitle}>
                {state.lockedWordIds.size} / {level.words.length} kelime tamamlandı
            </Text>

            {/* ── Active Clue Bar ── */}
            <View style={st.clueBar}>
                {activeWord ? (
                    <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <View style={st.dirPill}>
                                <Text style={st.dirPillText}>
                                    {activeWord.direction === 'across' ? '→ Yatay' : '↓ Dikey'} · {activeWord.answer.length} harf
                                </Text>
                            </View>
                            <Text style={st.clueNum}>#{activeWord.num}</Text>
                        </View>
                        <Text style={st.clueFullText}>{activeWord.clue}</Text>
                    </>
                ) : (
                    <Text style={[st.clueFullText, { color: TEXT_MUTED }]}>Bir hücreye dokunun</Text>
                )}
            </View>

            {/* ── Grid ── */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={st.gridWrap} bounces={false} showsVerticalScrollIndicator={false}>
                <View style={[st.gridOuter, { width: totalGrid + 4, height: totalGrid + 4 }]}>
                    <View style={{ width: totalGrid, height: totalGrid }}>
                        {state.grid.map((row, ri) => (
                            <View key={ri} style={{ flexDirection: 'row' }}>
                                {row.map((cell, ci) => (
                                    <MemoCell key={`${ri}-${ci}`} cell={cell} cellSize={cellSize}
                                        isSelected={state.selectedCell?.row === ri && state.selectedCell?.col === ci}
                                        isOnPath={pathSet.has(`${ri},${ci}`)}
                                        onPress={() => handleCellPress(ri, ci)} />
                                ))}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* ── Collapsible Clue List ── */}
            <Pressable style={st.clueToggle} onPress={() => setClueListOpen(!clueListOpen)}>
                <Text style={st.clueToggleText}>
                    {clueListOpen ? '▼ İpuçlarını Gizle' : '▲ Tüm İpuçları'}
                </Text>
            </Pressable>

            {clueListOpen && (
                <View style={st.cluePanel}>
                    <View style={st.tabRow}>
                        <Pressable style={[st.tab, clueTab === 'across' && { borderBottomColor: INK }]} onPress={() => setClueTab('across')}>
                            <Text style={[st.tabText, clueTab === 'across' && { color: INK }]}>YATAY ({acrossClues.length})</Text>
                        </Pressable>
                        <Pressable style={[st.tab, clueTab === 'down' && { borderBottomColor: INK }]} onPress={() => setClueTab('down')}>
                            <Text style={[st.tabText, clueTab === 'down' && { color: INK }]}>DİKEY ({downClues.length})</Text>
                        </Pressable>
                    </View>
                    <FlatList data={activeClues} keyExtractor={it => it.id} style={{ maxHeight: 140 }} showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => <MemoClueRow word={item} isActive={state.selectedWordId === item.id} isCompleted={state.lockedWordIds.has(item.id)} onPress={() => handleCluePress(item)} />} />
                </View>
            )}

            {/* ── Keyboard ── */}
            <TurkishKeyboard variant="newspaper" onKeyPress={k => { playSfx('keyPress'); typeLetter(k); }} onBackspace={backspace} onCheck={handleCheck} onHint={() => setHintModalVisible(true)} />

            {/* ── Feedback ── */}
            {feedback && (
                <View style={[st.feedBanner, { backgroundColor: feedback === 'correct' ? '#F5F0E6' : '#FFF0EE', borderColor: '#999' }]}>
                    <Text style={st.feedText}>{feedback === 'correct' ? 'Doğru' : 'Yanlış'}</Text>
                </View>
            )}

            {/* ── Hint Modal ── */}
            <Modal visible={hintModalVisible} transparent animationType="fade">
                <Pressable style={st.modalOv} onPress={() => setHintModalVisible(false)}>
                    <View style={st.hintCard}>
                        <Text style={st.hintTitle}>İpucu</Text>
                        <View style={st.hintSep} />
                        <TouchableOpacity style={st.hintBtn} onPress={() => { revealHint(); setHintModalVisible(false); }}>
                            <Text style={st.hintBtnText}>BİR HARF GÖSTER</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={st.hintCancelBtn} onPress={() => setHintModalVisible(false)}>
                            <Text style={st.hintCancelText}>Vazgeç</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

// ═══════════════════════════════════════
const st = StyleSheet.create({
    safe: { flex: 1 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    backText: { fontSize: 22, color: INK, fontFamily: SERIF },
    headerCenter: { flex: 1, alignItems: 'center' },
    title: { fontSize: 20, fontFamily: SERIF, fontWeight: '700', color: INK, letterSpacing: 3 },
    titleSep: { height: 1, backgroundColor: BORDER_DARK, marginHorizontal: 20, marginTop: 2 },
    subtitle: { textAlign: 'center', fontSize: 12, fontFamily: SERIF, color: TEXT_MUTED, marginTop: 6, marginBottom: 4 },

    // Active clue bar
    clueBar: { marginHorizontal: 8, marginTop: 6, marginBottom: 4, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: SEPARATOR, backgroundColor: CELL_WHITE, minHeight: 64 },
    dirPill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: PAPER_DARK, borderWidth: 1, borderColor: SEPARATOR },
    dirPillText: { fontSize: 13, fontFamily: SERIF, fontWeight: '700', color: INK },
    clueNum: { fontSize: 12, fontFamily: SERIF, fontWeight: '700', color: TEXT_MUTED },
    clueFullText: { fontSize: 17, fontFamily: SERIF, fontWeight: '400', color: INK, lineHeight: 24 },

    // Grid
    gridWrap: { alignItems: 'center', paddingVertical: 2 },
    gridOuter: { borderWidth: 2, borderColor: CELL_BLACK, backgroundColor: GRID_LINE },

    // Clue toggle
    clueToggle: { alignItems: 'center', paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SEPARATOR, backgroundColor: PAPER },
    clueToggleText: { fontSize: 12, fontFamily: SERIF, fontWeight: '600', color: TEXT_SUBTLE, letterSpacing: 0.5 },

    // Clue panel
    cluePanel: { backgroundColor: CELL_WHITE, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SEPARATOR },
    tabRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontSize: 13, fontFamily: SERIF, fontWeight: '600', color: TEXT_MUTED, letterSpacing: 1 },

    // Feedback
    feedBanner: { position: 'absolute', top: 120, left: 40, right: 40, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
    feedText: { fontSize: 14, fontFamily: SERIF, fontWeight: '700', color: INK, letterSpacing: 1 },

    // Modal
    modalOv: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    hintCard: { backgroundColor: CELL_WHITE, borderWidth: 1, borderColor: BORDER_DARK, padding: 24, width: SCREEN_W - 80 },
    hintTitle: { fontSize: 18, fontFamily: SERIF, fontWeight: '700', color: INK, textAlign: 'center', letterSpacing: 1 },
    hintSep: { height: 1, backgroundColor: SEPARATOR, marginVertical: 16 },
    hintBtn: { borderWidth: 1, borderColor: INK, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
    hintBtnText: { fontSize: 13, fontFamily: SERIF, fontWeight: '700', color: INK, letterSpacing: 1 },
    hintCancelBtn: { alignItems: 'center', paddingVertical: 8 },
    hintCancelText: { fontSize: 13, fontFamily: SERIF, color: TEXT_MUTED },
});
