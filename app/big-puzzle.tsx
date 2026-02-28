import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Animated,
    Easing,
    Dimensions,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { shadows } from '../src/theme/shadows';
import { useTheme } from '../src/theme/ThemeContext';
import {
    useBigPuzzleStore,
    BigPuzzleSize,
    BigPuzzleDifficulty,
} from '../src/store/useBigPuzzleStore';
import { getBigPuzzle, getBigPuzzles } from '../src/data/bigPuzzles';
import { Alert } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Options ──
const SIZE_OPTIONS: { value: BigPuzzleSize; label: string; sub: string; locked: boolean }[] = [
    { value: 15, label: '15×15', sub: '30 kelime', locked: false },
    { value: 17, label: '17×17', sub: '40 kelime', locked: false },
    { value: 20, label: '20×20', sub: '55 kelime', locked: false },
];

const DIFF_OPTIONS: { value: BigPuzzleDifficulty; label: string; icon: string }[] = [
    { value: 'easy', label: 'Kolay', icon: 'leaf-outline' },
    { value: 'medium', label: 'Orta', icon: 'flame-outline' },
    { value: 'hard', label: 'Zor', icon: 'skull-outline' },
];

const THEME_OPTIONS = ['Genel', 'Bilim', 'Tarih', 'Spor'];

const DIFF_LABELS: Record<string, string> = {
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
};

// ── AI Loading Messages ──
const AI_MESSAGES = [
    'Bulmaca hazırlanıyor…',
    'Zorluk ayarlanıyor…',
    'İpuçları seçiliyor…',
    'Kelimeler yerleştiriliyor…',
    'Son kontroller yapılıyor…',
];

// ══════════════════════════════
//  AI Loading Overlay
// ══════════════════════════════
function AILoadingOverlay({ isDark, primary }: { isDark: boolean; primary: string }) {
    const [messageIdx, setMessageIdx] = useState(0);
    const sparkleRotation = useRef(new Animated.Value(0)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(overlayOpacity, {
            toValue: 1, duration: 200, useNativeDriver: true,
        }).start();
        const interval = setInterval(() => {
            setMessageIdx((i) => (i + 1) % AI_MESSAGES.length);
        }, 400);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(sparkleRotation, { toValue: 15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(sparkleRotation, { toValue: -15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, []);

    return (
        <Animated.View style={[overlayS.container, { opacity: overlayOpacity }]}>
            <View style={[overlayS.card, { backgroundColor: isDark ? '#1A1F35' : '#FFFFFF' }]}>
                <Animated.View style={{ transform: [{ rotate: sparkleRotation.interpolate({ inputRange: [-15, 15], outputRange: ['-15deg', '15deg'] }) }] }}>
                    <Ionicons name="sparkles" size={36} color={primary} />
                </Animated.View>
                <ActivityIndicator size="small" color={primary} style={{ marginTop: 14 }} />
                <Text style={[overlayS.message, { color: isDark ? '#E5E7EB' : '#1A1A2E' }]}>{AI_MESSAGES[messageIdx]}</Text>
                <Text style={[overlayS.sub, { color: isDark ? '#6B7280' : '#8E8E9E' }]}>Yapay zekâ çalışıyor</Text>
            </View>
        </Animated.View>
    );
}
const overlayS = StyleSheet.create({
    container: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    card: { borderRadius: 24, paddingVertical: 28, paddingHorizontal: 36, alignItems: 'center', ...shadows.lg, minWidth: 240 },
    message: { fontSize: 16, fontWeight: '700', marginTop: 12, textAlign: 'center' },
    sub: { fontSize: 13, fontWeight: '500', marginTop: 4 },
});

// ══════════════════════════════
//  Main Screen
// ══════════════════════════════
export default function BigPuzzleScreen() {
    const router = useRouter();
    const t = useTheme();
    const isDark = t.id === 'black';

    const config = useBigPuzzleStore((s) => s.config);
    const setConfig = useBigPuzzleStore((s) => s.setConfig);

    const [showOverlay, setShowOverlay] = useState(false);
    const [themeModalVisible, setThemeModalVisible] = useState(false);
    const isBusyRef = useRef(false);
    const ctaScale = useRef(new Animated.Value(1)).current;

    // Map store difficulty (easy/medium/hard) → Turkish labels for filter
    const DIFF_TO_TR: Record<string, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

    // ── Derived colors (theme-aware) ──
    const c = useMemo(() => ({
        bg: isDark ? t.background : '#F4F3F8',
        cardBg: isDark ? t.card : '#FFFFFF',
        cardBorder: isDark ? t.border : 'transparent',
        segBg: isDark ? t.surface2 : '#F9FAFB',
        segBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
        segSelBg: isDark ? t.primarySoft : '#EEF2FF',
        segSelBorder: t.primary,
        text: isDark ? t.text : '#1F2937',
        textSub: isDark ? t.textSecondary : '#9CA3AF',
        textMuted: isDark ? t.textMuted : '#D1D5DB',
        ctaBgFade: isDark ? 'rgba(11,16,32,0.92)' : 'rgba(244,243,248,0.92)',
        modalBg: isDark ? '#1A1F35' : '#FFFFFF',
        modalOptSelBg: isDark ? t.primarySoft : '#EEF2FF',
        headerGrad: t.gradientPrimary as readonly [string, string],
    }), [isDark, t]);

    // ── Preview chip text ──
    const previewText = useMemo(() => {
        const sizeLabel = SIZE_OPTIONS.find((o) => o.value === config.size)?.label ?? '15×15';
        const diffLabel = DIFF_LABELS[config.difficulty] ?? 'Orta';
        return `${sizeLabel} · ${diffLabel}`;
    }, [config.size, config.difficulty]);

    // ── Open premade puzzle ──
    const handleGenerate = useCallback(async () => {
        if (isBusyRef.current) return;
        isBusyRef.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Map config to filter
        const diffTR = DIFF_TO_TR[config.difficulty] ?? 'Orta';

        // Pick a random chapter from matching size + difficulty + theme
        const matches = getBigPuzzles({ size: config.size, difficulty: diffTR, theme: config.theme });
        const match = matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : null;

        if (!match) {
            isBusyRef.current = false;
            Alert.alert('Bulmaca Bulunamadı', 'Bu ayarlarla henüz hazır bulmaca yok.');
            return;
        }

        // Store the puzzle in the big puzzle store so the game screen can load it
        const storeKey = match.id;
        useBigPuzzleStore.setState((s) => ({
            currentPuzzleId: storeKey,
            puzzles: {
                ...s.puzzles,
                [storeKey]: {
                    id: storeKey,
                    config: { ...s.config },
                    createdAtISO: new Date().toISOString(),
                    status: 'success' as const,
                    payload: match.puzzleData,
                    source: 'ai' as const,
                },
            },
        }));

        // Brief visual delay for polish
        setShowOverlay(true);
        await new Promise<void>((r) => setTimeout(r, 600));
        setShowOverlay(false);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        isBusyRef.current = false;
        router.push(`/game/big_${storeKey}`);
    }, [config, router]);

    const isBusy = showOverlay;

    return (
        <View style={[styles.root, { backgroundColor: c.bg }]}>
            <SafeAreaView style={styles.flex} edges={['top']}>
                {showOverlay && <AILoadingOverlay isDark={isDark} primary={t.primary} />}

                {/* ── Header ── */}
                <LinearGradient
                    colors={c.headerGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerRow}>
                        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
                            <Ionicons name="chevron-back" size={20} color="#FFF" />
                        </Pressable>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Büyük Bulmaca</Text>
                            <Text style={styles.headerSub}>AI destekli bulmaca üretici</Text>
                        </View>
                        <View style={styles.previewChip}>
                            <Text style={styles.previewChipText}>{previewText}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* ── Body ── */}
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Card A: Boyut */}
                    <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder, borderWidth: isDark ? 1 : 0, shadowColor: isDark ? 'transparent' : t.primary }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="grid-outline" size={18} color={t.primary} />
                            <Text style={[styles.cardTitle, { color: c.text }]}>Boyut</Text>
                        </View>
                        <Text style={[styles.cardCaption, { color: c.textSub }]}>Bulmaca ızgara boyutunu seç</Text>
                        <View style={styles.segmentRow}>
                            {SIZE_OPTIONS.map((opt) => {
                                const sel = config.size === opt.value;
                                return (
                                    <Pressable
                                        key={opt.value}
                                        style={[
                                            styles.segment,
                                            { backgroundColor: sel ? c.segSelBg : c.segBg, borderColor: sel ? c.segSelBorder : c.segBorder },
                                            sel && { shadowColor: t.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 2 },
                                            opt.locked && styles.segmentLocked,
                                        ]}
                                        onPress={() => { if (!opt.locked) { Haptics.selectionAsync(); setConfig({ size: opt.value }); } }}
                                    >
                                        <Text style={[styles.segmentLabel, { color: sel ? t.primary : (isDark ? t.textSecondary : '#6B7280') }, opt.locked && { color: c.textMuted }]}>
                                            {opt.label}
                                        </Text>
                                        <Text style={[styles.segmentSub, { color: sel ? t.primaryLight : c.textSub }, opt.locked && { color: c.textMuted }]}>
                                            {opt.locked ? '🔒 Yakında' : opt.sub}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Card B: Zorluk */}
                    <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder, borderWidth: isDark ? 1 : 0, shadowColor: isDark ? 'transparent' : t.primary }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="speedometer-outline" size={18} color={t.primary} />
                            <Text style={[styles.cardTitle, { color: c.text }]}>Zorluk</Text>
                        </View>
                        <Text style={[styles.cardCaption, { color: c.textSub }]}>Kelime zorluğunu ayarla</Text>
                        <View style={styles.segmentRow}>
                            {DIFF_OPTIONS.map((opt) => {
                                const sel = config.difficulty === opt.value;
                                return (
                                    <Pressable
                                        key={opt.value}
                                        style={[
                                            styles.segment,
                                            { backgroundColor: sel ? c.segSelBg : c.segBg, borderColor: sel ? c.segSelBorder : c.segBorder },
                                            sel && { shadowColor: t.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 2 },
                                        ]}
                                        onPress={() => { Haptics.selectionAsync(); setConfig({ difficulty: opt.value }); }}
                                    >
                                        <Ionicons name={opt.icon as any} size={18} color={sel ? t.primary : c.textSub} style={{ marginBottom: 2 }} />
                                        <Text style={[styles.segmentLabel, { color: sel ? t.primary : (isDark ? t.textSecondary : '#6B7280') }]}>{opt.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Card C: Tema */}
                    <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder, borderWidth: isDark ? 1 : 0, shadowColor: isDark ? 'transparent' : t.primary }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="color-palette-outline" size={18} color={t.primary} />
                            <Text style={[styles.cardTitle, { color: c.text }]}>Tema</Text>
                        </View>
                        <Text style={[styles.cardCaption, { color: c.textSub }]}>Bulmaca konusunu seç</Text>
                        <Pressable
                            style={[styles.themeRow, { backgroundColor: c.segBg, borderColor: c.segBorder }]}
                            onPress={() => { Haptics.selectionAsync(); setThemeModalVisible(true); }}
                        >
                            <Text style={[styles.themeLabel, { color: c.text }]}>{config.theme}</Text>
                            <Ionicons name="chevron-forward" size={18} color={c.textSub} />
                        </Pressable>
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* ── Sticky CTA ── */}
                <View style={[styles.ctaContainer, { backgroundColor: c.ctaBgFade }]}>
                    <Animated.View style={[styles.ctaWrapper, { transform: [{ scale: ctaScale }], shadowColor: t.primary }]}>
                        <Pressable
                            onPress={handleGenerate}
                            onPressIn={() => Animated.spring(ctaScale, { toValue: 0.97, damping: 15, stiffness: 300, mass: 1, useNativeDriver: true }).start()}
                            onPressOut={() => Animated.spring(ctaScale, { toValue: 1, damping: 12, stiffness: 200, mass: 1, useNativeDriver: true }).start()}
                            disabled={isBusy}
                        >
                            <LinearGradient
                                colors={isBusy ? [t.primaryLight, t.primaryLight] : (c.headerGrad as [string, string])}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.ctaGradient}
                            >
                                <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.ctaText}>Bulmaca Oluştur</Text>
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                    <View style={styles.ctaBadge}>
                        <Text style={[styles.ctaBadgeText, { color: t.primary }]}>✨ AI ile üretilir</Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* ── Theme Modal ── */}
            <Modal visible={themeModalVisible} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setThemeModalVisible(false)}>
                    <View style={[styles.modalCard, { backgroundColor: c.modalBg }]}>
                        <Text style={[styles.modalTitle, { color: c.text }]}>Tema Seç</Text>
                        {THEME_OPTIONS.map((theme) => {
                            const sel = config.theme === theme;
                            return (
                                <Pressable
                                    key={theme}
                                    style={[styles.modalOption, sel && { backgroundColor: c.modalOptSelBg }]}
                                    onPress={() => { Haptics.selectionAsync(); setConfig({ theme }); setThemeModalVisible(false); }}
                                >
                                    <Text style={[styles.modalOptionText, { color: sel ? t.primary : c.text }, sel && { fontWeight: '700' }]}>{theme}</Text>
                                    {sel && <Ionicons name="checkmark-circle" size={20} color={t.primary} />}
                                </Pressable>
                            );
                        })}
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

// ══════════════════════════════
//  Static Styles (dynamic colors applied inline)
// ══════════════════════════════
const styles = StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },

    // ── Header ──
    header: { paddingTop: 8, paddingBottom: 20, paddingHorizontal: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
    headerSub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
    previewChip: { backgroundColor: 'rgba(255,255,255,0.20)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    previewChipText: { fontSize: 12, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 },

    // ── Body ──
    scrollContent: { paddingTop: 20, paddingHorizontal: 16 },

    // ── Cards ──
    card: {
        borderRadius: 20, padding: 18, marginBottom: 14,
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    cardTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
    cardCaption: { fontSize: 13, fontWeight: '500', marginBottom: 14, marginTop: 2 },

    // ── Segments ──
    segmentRow: { flexDirection: 'row', gap: 8 },
    segment: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
    segmentLocked: { opacity: 0.45 },
    segmentLabel: { fontSize: 15, fontWeight: '700' },
    segmentSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },

    // ── Theme row ──
    themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
    themeLabel: { fontSize: 15, fontWeight: '700' },

    // ── CTA ──
    ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
    ctaWrapper: { borderRadius: 18, overflow: 'hidden', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 6 },
    ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 58, borderRadius: 18 },
    ctaText: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
    ctaBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    ctaBadgeText: { fontSize: 12, fontWeight: '600' },

    // ── Theme Modal ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { borderRadius: 22, padding: 22, width: SCREEN_W - 64, ...shadows.lg },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
    modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, marginBottom: 6 },
    modalOptionText: { fontSize: 16, fontWeight: '600' },
});
