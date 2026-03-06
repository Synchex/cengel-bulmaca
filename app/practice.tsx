import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
    Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useUIProfile } from '../src/theme/ThemeContext';
import { getRandomPracticeQuestion, Question } from '../src/utils/questionLoader';
import { useGamificationStore } from '../src/store/useGamificationStore';
import { useMissionsStore } from '../src/store/useMissionsStore';
import { usePracticeStore } from '../src/store/usePracticeStore';
import TurkishKeyboard from '../src/components/TurkishKeyboard';

const { width: SW } = Dimensions.get('window');
const SESSION_DURATION = 60; // seconds
const XP_PER_WORD = 5;

// ═══════════════════════════════════════════════
//  TURKISH CHARACTER NORMALIZATION
// ═══════════════════════════════════════════════

function normalizeTurkish(str: string): string {
    return str
        .toLocaleUpperCase('tr-TR')
        .replace(/İ/g, 'İ')
        .replace(/I/g, 'I')
        .trim();
}

// ═══════════════════════════════════════════════
//  GAME PHASES
// ═══════════════════════════════════════════════

type Phase = 'READY' | 'PLAYING' | 'SUMMARY';

// ═══════════════════════════════════════════════
//  LETTER BOX COMPONENT
// ═══════════════════════════════════════════════

function LetterBox({
    letter,
    index,
    total,
    filled,
    correct,
    wrong,
    isActive,
    fontSize,
}: {
    letter: string;
    index: number;
    total: number;
    filled: boolean;
    correct: boolean;
    wrong: boolean;
    isActive: boolean;
    fontSize: number;
}) {
    const boxSize = Math.min(50, (SW - 60) / total - 6);
    const bgColor = correct
        ? '#34C759'
        : wrong
            ? '#FF3B30'
            : isActive
                ? 'rgba(90,200,250,0.12)'
                : filled
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(255,255,255,0.06)';
    const borderColor = correct
        ? '#34C759'
        : wrong
            ? '#FF3B30'
            : isActive
                ? '#5AC8FA'
                : filled
                    ? 'rgba(255,255,255,0.4)'
                    : 'rgba(255,255,255,0.12)';

    return (
        <View
            style={[
                styles.letterBox,
                {
                    width: boxSize,
                    height: boxSize,
                    borderColor,
                    backgroundColor: bgColor,
                    borderWidth: isActive ? 2.5 : 2,
                },
            ]}
        >
            <Text
                style={[
                    styles.letterText,
                    { fontSize: Math.round(fontSize * 0.9) },
                    correct && { color: '#FFF' },
                    wrong && { color: '#FFF' },
                ]}
            >
                {letter}
            </Text>
        </View>
    );
}

// ═══════════════════════════════════════════════
//  MAIN PRACTICE SCREEN
// ═══════════════════════════════════════════════

export default function PracticeScreen() {
    const router = useRouter();
    const t = useTheme();
    const ui = useUIProfile();
    const fs = ui.fontScale;
    const isDark = t.id !== 'light';

    // ── Stores ──
    const addXP = useGamificationStore((s) => s.addXP);
    const recordPuzzleCompletion = useGamificationStore((s) => s.recordPuzzleCompletion);
    const updateMissionProgress = useMissionsStore((s) => s.updateProgress);
    const recordSession = usePracticeStore((s) => s.recordSession);
    const bestScore = usePracticeStore((s) => s.bestSessionScore);

    // ── Game State ──
    const [phase, setPhase] = useState<Phase>('READY');
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [typedLetters, setTypedLetters] = useState<string[]>([]);
    const [usedIds] = useState<Set<string>>(() => new Set());
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [combo, setCombo] = useState(0);
    const [totalXPEarned, setTotalXPEarned] = useState(0);
    const [showCorrect, setShowCorrect] = useState(false);
    const [showWrong, setShowWrong] = useState(false);
    const [newBest, setNewBest] = useState(false);

    const inputRef = useRef<number>(0); // cursor position
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Animations ──
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const correctScale = useRef(new Animated.Value(1)).current;
    const comboScale = useRef(new Animated.Value(0)).current;
    const timerWidth = useRef(new Animated.Value(1)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;

    // ── Load next question ──
    const loadNextQuestion = useCallback(() => {
        const q = getRandomPracticeQuestion(usedIds);
        if (q) {
            usedIds.add(q.id);
            setCurrentQuestion(q);
            setTypedLetters(Array(q.answer.length).fill(''));
            setShowCorrect(false);
            setShowWrong(false);
            inputRef.current = 0;
        }
    }, [usedIds]);

    // ── Start game ──
    const startGame = useCallback(() => {
        setPhase('PLAYING');
        setTimeLeft(SESSION_DURATION);
        setCorrectCount(0);
        setWrongCount(0);
        setCombo(0);
        setTotalXPEarned(0);
        setNewBest(false);
        usedIds.clear();
        loadNextQuestion();

        // Animate timer bar
        timerWidth.setValue(1);
        Animated.timing(timerWidth, {
            toValue: 0,
            duration: SESSION_DURATION * 1000,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();

        // Countdown
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [loadNextQuestion, usedIds, timerWidth]);

    // ── End game when timer hits 0 ──
    useEffect(() => {
        if (phase === 'PLAYING' && timeLeft === 0) {
            endGame();
        }
    }, [timeLeft, phase]);

    const endGame = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        Keyboard.dismiss();

        // Calculate XP
        const xpAmount = correctCount * XP_PER_WORD;
        if (xpAmount > 0) {
            addXP(xpAmount);
            recordPuzzleCompletion();
            updateMissionProgress('ENTER_CORRECT_WORDS', correctCount);
        }
        setTotalXPEarned(xpAmount);

        // Check if new best
        const isNewBest = correctCount > bestScore;
        setNewBest(isNewBest);

        // Persist practice stats
        recordSession(correctCount);

        setPhase('SUMMARY');
    }, [correctCount, bestScore, addXP, recordPuzzleCompletion, updateMissionProgress, recordSession]);

    // ── Handle key press from TurkishKeyboard ──
    const handleKeyPress = useCallback(
        (key: string) => {
            if (!currentQuestion || phase !== 'PLAYING' || showCorrect || showWrong) return;

            const answerLen = currentQuestion.answer.length;
            setTypedLetters((prev) => {
                // Find first empty slot
                const idx = prev.indexOf('');
                if (idx === -1) return prev; // all filled
                const newTyped = [...prev];
                newTyped[idx] = key;
                inputRef.current = idx + 1;

                // Auto-check when all letters filled
                if (idx === answerLen - 1) {
                    const typed = newTyped.join('');
                    const answer = normalizeTurkish(currentQuestion.answer);

                    if (typed === answer) {
                        // CORRECT!
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setShowCorrect(true);
                        setCorrectCount((c) => c + 1);
                        setCombo((c) => c + 1);

                        // Scale animation
                        correctScale.setValue(1.2);
                        Animated.spring(correctScale, {
                            toValue: 1,
                            friction: 3,
                            tension: 120,
                            useNativeDriver: true,
                        }).start();

                        // Combo pop
                        comboScale.setValue(0);
                        Animated.spring(comboScale, {
                            toValue: 1,
                            friction: 4,
                            tension: 100,
                            useNativeDriver: true,
                        }).start();

                        // Load next after brief delay
                        setTimeout(() => {
                            loadNextQuestion();
                        }, 400);
                    } else {
                        // WRONG!
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        setShowWrong(true);
                        setWrongCount((w) => w + 1);
                        setCombo(0);

                        // Shake animation
                        Animated.sequence([
                            Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
                            Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
                            Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
                            Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
                            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
                        ]).start();

                        // Reset input after shake
                        setTimeout(() => {
                            setTypedLetters(Array(answerLen).fill(''));
                            setShowWrong(false);
                            inputRef.current = 0;
                        }, 600);
                    }
                }

                return newTyped;
            });
        },
        [currentQuestion, phase, showCorrect, showWrong, loadNextQuestion, shakeAnim, correctScale, comboScale],
    );

    const handleBackspace = useCallback(() => {
        if (!currentQuestion || phase !== 'PLAYING' || showCorrect || showWrong) return;

        setTypedLetters((prev) => {
            // Find last filled slot
            let idx = prev.length - 1;
            while (idx >= 0 && prev[idx] === '') idx--;
            if (idx < 0) return prev;
            const newTyped = [...prev];
            newTyped[idx] = '';
            inputRef.current = idx;
            return newTyped;
        });
    }, [currentQuestion, phase, showCorrect, showWrong]);

    // onCheck: no-op for practice (auto-validates on last letter)
    const handleCheck = useCallback(() => { }, []);

    // onHint: skip to next word
    const handleHint = useCallback(() => {
        if (phase !== 'PLAYING') return;
        setCombo(0);
        loadNextQuestion();
    }, [phase, loadNextQuestion]);

    // ── Ready screen entrance animation ──
    useEffect(() => {
        Animated.timing(fadeIn, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, []);

    // ── Cleanup ──
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // ── Derived ──
    const totalAttempts = correctCount + wrongCount;
    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

    // ═══════════════════════════════════════════════
    //  RENDER: READY PHASE
    // ═══════════════════════════════════════════════

    if (phase === 'READY') {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={isDark ? ['#0B1020', '#121830', '#0B1020'] : ['#1A1040', '#2A1860', '#1A1040']}
                    style={StyleSheet.absoluteFill}
                />
                <SafeAreaView style={styles.safeFull}>
                    {/* Back button - top left */}
                    <View style={styles.topNav}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <Animated.View style={[styles.readyContent, { opacity: fadeIn }]}>
                        <View style={styles.readyIcon}>
                            <Ionicons name="flash" size={64} color="#34C759" />
                        </View>

                        <Text style={[styles.readyTitle, { fontSize: Math.round(28 * fs) }]}>
                            Alıştırma Modu
                        </Text>
                        <Text style={[styles.readyDesc, { fontSize: Math.round(15 * fs) }]}>
                            60 saniye içinde olabildiğince çok kelime çöz!
                        </Text>

                        <View style={styles.readyRules}>
                            <View style={styles.ruleRow}>
                                <Ionicons name="timer-outline" size={20} color="#5AC8FA" />
                                <Text style={styles.ruleText}>60 saniye süre</Text>
                            </View>
                            <View style={styles.ruleRow}>
                                <Ionicons name="sparkles-outline" size={20} color="#FFD700" />
                                <Text style={styles.ruleText}>Doğru kelime = +{XP_PER_WORD} XP</Text>
                            </View>
                            <View style={styles.ruleRow}>
                                <Ionicons name="flame-outline" size={20} color="#FF6723" />
                                <Text style={styles.ruleText}>Combo serisi bonus</Text>
                            </View>
                        </View>

                        {bestScore > 0 && (
                            <View style={styles.bestBadge}>
                                <Ionicons name="trophy" size={16} color="#FFD700" />
                                <Text style={styles.bestText}>En İyi: {bestScore} kelime</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.startBtn}
                            activeOpacity={0.85}
                            onPress={startGame}
                        >
                            <LinearGradient
                                colors={['#34C759', '#30B350']}
                                style={styles.startBtnGrad}
                            >
                                <Ionicons name="play" size={24} color="#FFF" />
                                <Text style={[styles.startBtnText, { fontSize: Math.round(18 * fs) }]}>
                                    Başla!
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </SafeAreaView>
            </View>
        );
    }

    // ═══════════════════════════════════════════════
    //  RENDER: PLAYING PHASE
    // ═══════════════════════════════════════════════

    if (phase === 'PLAYING' && currentQuestion) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={isDark ? ['#0B1020', '#121830'] : ['#1A1040', '#2A1860']}
                    style={StyleSheet.absoluteFill}
                />
                <SafeAreaView style={styles.safeFull}>
                    {/* Top Nav with Back + Timer + Stats */}
                    <View style={styles.playingHeader}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => {
                                if (timerRef.current) clearInterval(timerRef.current);
                                router.back();
                            }}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.statPill}>
                            <Ionicons name="timer-outline" size={16} color="#5AC8FA" />
                            <Text style={styles.statText}>{timeLeft}s</Text>
                        </View>
                        <View style={styles.statPill}>
                            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                            <Text style={styles.statText}>{correctCount}</Text>
                        </View>
                        {combo >= 2 && (
                            <Animated.View
                                style={[
                                    styles.comboPill,
                                    { transform: [{ scale: comboScale }] },
                                ]}
                            >
                                <Ionicons name="flame" size={14} color="#FF6723" />
                                <Text style={styles.comboText}>×{combo}</Text>
                            </Animated.View>
                        )}
                    </View>

                    {/* Timer Bar */}
                    <View style={styles.timerBarTrack}>
                        <Animated.View
                            style={[
                                styles.timerBarFill,
                                {
                                    width: timerWidth.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                    backgroundColor:
                                        timeLeft > 20 ? '#34C759' : timeLeft > 10 ? '#FFD700' : '#FF3B30',
                                },
                            ]}
                        />
                    </View>

                    {/* Clue */}
                    <View style={styles.playingBody}>
                        <View style={styles.clueContainer}>
                            <Text style={[styles.clueLabel, { fontSize: Math.round(12 * fs) }]}>
                                İPUCU
                            </Text>
                            <Text style={[styles.clueText, { fontSize: Math.round(18 * fs) }]}>
                                {currentQuestion.clue}
                            </Text>
                            <Text style={[styles.letterCount, { fontSize: Math.round(13 * fs) }]}>
                                {currentQuestion.answer.length} harf
                            </Text>
                        </View>

                        {/* Letter Boxes */}
                        <Animated.View
                            style={[
                                styles.boxesRow,
                                {
                                    transform: [
                                        { translateX: shakeAnim },
                                        { scale: showCorrect ? correctScale : 1 },
                                    ],
                                },
                            ]}
                        >
                            {typedLetters.map((letter, i) => (
                                <LetterBox
                                    key={i}
                                    letter={letter}
                                    index={i}
                                    total={typedLetters.length}
                                    filled={letter !== ''}
                                    correct={showCorrect}
                                    wrong={showWrong}
                                    isActive={!showCorrect && !showWrong && i === typedLetters.indexOf('')}
                                    fontSize={Math.round(22 * fs)}
                                />
                            ))}
                        </Animated.View>

                        {/* Skip Button */}
                        <TouchableOpacity
                            style={styles.skipBtn}
                            onPress={() => {
                                setCombo(0);
                                loadNextQuestion();
                            }}
                        >
                            <Ionicons name="play-skip-forward" size={18} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.skipText}>Atla</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Turkish Keyboard */}
                    <TurkishKeyboard
                        onKeyPress={handleKeyPress}
                        onBackspace={handleBackspace}
                        onCheck={handleCheck}
                        onHint={handleHint}
                        disabled={showCorrect || showWrong}
                    />
                </SafeAreaView>
            </View>
        );
    }

    // ═══════════════════════════════════════════════
    //  RENDER: SUMMARY PHASE
    // ═══════════════════════════════════════════════

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isDark ? ['#0B1020', '#121830', '#0B1020'] : ['#1A1040', '#2A1860', '#1A1040']}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.center}>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryIcon}>
                        <Ionicons
                            name={correctCount >= 5 ? 'trophy' : 'flag'}
                            size={48}
                            color={correctCount >= 5 ? '#FFD700' : '#5AC8FA'}
                        />
                    </View>

                    <Text style={[styles.summaryTitle, { fontSize: Math.round(24 * fs) }]}>
                        {correctCount >= 10
                            ? 'Muhteşem! 🔥'
                            : correctCount >= 5
                                ? 'Harika! 🎉'
                                : correctCount >= 1
                                    ? 'İyi İş! 👍'
                                    : 'Bir Dahaki Sefere! 💪'}
                    </Text>

                    {newBest && (
                        <View style={styles.newBestBadge}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={styles.newBestText}>Yeni Rekor!</Text>
                        </View>
                    )}

                    <View style={styles.summaryStats}>
                        <View style={styles.summaryStatItem}>
                            <Text style={styles.summaryStatNum}>{correctCount}</Text>
                            <Text style={styles.summaryStatLabel}>Doğru</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryStatItem}>
                            <Text style={styles.summaryStatNum}>{accuracy}%</Text>
                            <Text style={styles.summaryStatLabel}>İsabet</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryStatItem}>
                            <Text style={[styles.summaryStatNum, { color: '#34C759' }]}>
                                +{totalXPEarned}
                            </Text>
                            <Text style={styles.summaryStatLabel}>XP</Text>
                        </View>
                    </View>

                    {/* Buttons */}
                    <TouchableOpacity
                        style={styles.retryBtn}
                        activeOpacity={0.85}
                        onPress={() => {
                            setPhase('READY');
                            fadeIn.setValue(1);
                        }}
                    >
                        <LinearGradient
                            colors={['#34C759', '#30B350']}
                            style={styles.retryBtnGrad}
                        >
                            <Ionicons name="refresh" size={20} color="#FFF" />
                            <Text style={[styles.retryBtnText, { fontSize: Math.round(16 * fs) }]}>
                                Tekrar Oyna
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.homeBtn}
                        onPress={() => router.back()}
                    >
                        <Text style={[styles.homeBtnText, { fontSize: Math.round(15 * fs) }]}>
                            Ana Sayfa
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

// ═══════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    safeFull: { flex: 1 },

    // ── Top Nav ──
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Ready ──
    readyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    readyIcon: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: 'rgba(52,199,89,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    readyTitle: { color: '#FFF', fontWeight: '800', letterSpacing: -0.5 },
    readyDesc: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    readyRules: { marginTop: 28, gap: 14 },
    ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    ruleText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '500' },
    bestBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 24,
        backgroundColor: 'rgba(255,215,0,0.1)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 14,
    },
    bestText: { color: '#FFD700', fontWeight: '700', fontSize: 14 },
    startBtn: { marginTop: 32, width: '100%' },
    startBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 18,
    },
    startBtnText: { color: '#FFF', fontWeight: '800' },

    // ── Playing ──
    playingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
        gap: 10,
    },
    playingBody: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    timerBarTrack: {
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
        marginHorizontal: 16,
    },
    timerBarFill: { height: '100%', borderRadius: 3 },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    comboPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(255,103,35,0.18)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    comboText: { color: '#FF6723', fontWeight: '800', fontSize: 14 },

    // ── Clue ──
    clueContainer: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 24,
        paddingVertical: 28,
        marginBottom: 30,
        alignItems: 'center',
    },
    clueLabel: {
        color: 'rgba(255,255,255,0.35)',
        fontWeight: '700',
        letterSpacing: 3,
        marginBottom: 10,
    },
    clueText: {
        color: '#FFF',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 26,
    },
    letterCount: {
        color: 'rgba(255,255,255,0.4)',
        marginTop: 12,
        fontWeight: '600',
    },

    // ── Boxes ──
    boxesRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 20,
    },
    letterBox: {
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    letterText: {
        color: '#FFF',
        fontWeight: '800',
    },



    // ── Skip ──
    skipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        marginTop: 10,
    },
    skipText: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
        fontSize: 14,
    },

    // ── Summary ──
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 32,
        alignItems: 'center',
        width: '100%',
    },
    summaryIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(255,215,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    summaryTitle: {
        color: '#FFF',
        fontWeight: '800',
        textAlign: 'center',
    },
    newBestBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,215,0,0.12)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        marginTop: 10,
    },
    newBestText: { color: '#FFD700', fontWeight: '700', fontSize: 13 },
    summaryStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 28,
        gap: 0,
    },
    summaryStatItem: { flex: 1, alignItems: 'center' },
    summaryStatNum: { color: '#FFF', fontWeight: '800', fontSize: 28 },
    summaryStatLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
        fontSize: 12,
        marginTop: 4,
    },
    summaryDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    retryBtn: { marginTop: 28, width: '100%' },
    retryBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 16,
    },
    retryBtnText: { color: '#FFF', fontWeight: '700' },
    homeBtn: { marginTop: 14, paddingVertical: 12 },
    homeBtnText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
});
