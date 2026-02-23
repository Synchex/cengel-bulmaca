import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Entry } from '../cengel/types';
import { useUIProfile, useTheme } from '../theme/ThemeContext';
import { useSpeech } from '../hooks/useSpeech';

interface ClueBarProps {
    entry: Entry | null;
    /** Whether both directions exist at the active cell */
    canToggle: boolean;
    onToggle: () => void;
}

export default function ClueBar({ entry, canToggle, onToggle }: ClueBarProps) {
    const ui = useUIProfile();
    const t = useTheme();
    const gp = ui.gameplay;
    const { speak, stop, isSpeaking } = useSpeech();

    // ── Animations ──
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const ttsScale = useRef(new Animated.Value(1)).current;

    // Fade-in when clue changes
    useEffect(() => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [entry?.id]);

    // Stop speaking if the active clue changes
    useEffect(() => {
        stop();
    }, [entry?.id, stop]);

    // TTS button press animation
    const handleTTSPressIn = () => {
        Animated.spring(ttsScale, {
            toValue: 0.9,
            useNativeDriver: true,
        }).start();
    };
    const handleTTSPressOut = () => {
        Animated.spring(ttsScale, {
            toValue: 1,
            friction: 4,
            tension: 200,
            useNativeDriver: true,
        }).start();
    };

    if (!entry) {
        return (
            <View style={[styles.heroCard, {
                minHeight: gp.clueBarMinHeight,
                backgroundColor: t.surface,
                borderColor: t.border + '40',
            }]}>
                <Text style={[styles.placeholder, { fontSize: 16, color: t.textMuted }]}>
                    Bir hücreye dokun
                </Text>
            </View>
        );
    }

    const dirLabel = entry.direction === 'across' ? 'Yatay' : 'Dikey';
    const dirIcon = entry.direction === 'across' ? 'arrow-forward' : 'arrow-down';
    const ttsSize = Math.max(38, ui.minTouchTarget * 0.8);
    const isDark = t.id === 'black';

    return (
        <Animated.View style={[styles.heroWrapper, { opacity: fadeAnim }]}>
            <LinearGradient
                colors={
                    isDark
                        ? ['rgba(30,30,50,0.95)', 'rgba(20,20,40,0.98)'] as readonly [string, string]
                        : ['rgba(255,255,255,0.97)', 'rgba(248,246,252,0.97)'] as readonly [string, string]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.heroCard, {
                    minHeight: Math.max(80, gp.clueBarMinHeight + 20),
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    shadowColor: isDark ? t.primary : '#000',
                }]}
            >
                {/* Row: Badge + Question + TTS */}
                <View style={styles.topRow}>
                    {/* Direction badge — small, secondary */}
                    <View style={[styles.badge, {
                        backgroundColor: isDark ? t.primary + '20' : t.primarySoft,
                    }]}>
                        <Ionicons name={dirIcon} size={11} color={t.primary} />
                        <Text style={[styles.badgeText, { color: t.primary }]}>
                            {dirLabel} · {entry.length}
                        </Text>
                    </View>

                    {/* Spacer */}
                    <View style={{ flex: 1 }} />

                    {/* TTS Glass Button */}
                    <TouchableOpacity
                        activeOpacity={1}
                        onPressIn={handleTTSPressIn}
                        onPressOut={handleTTSPressOut}
                        onPress={() => isSpeaking ? stop() : speak(entry.clueText)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel="Soruyu sesli oku"
                        accessibilityRole="button"
                    >
                        <Animated.View style={[
                            styles.ttsBtn,
                            {
                                width: ttsSize,
                                height: ttsSize,
                                borderRadius: ttsSize / 2,
                                backgroundColor: isSpeaking
                                    ? t.primary
                                    : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                borderColor: isSpeaking
                                    ? t.primary
                                    : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                                transform: [{ scale: ttsScale }],
                                ...(isSpeaking ? {
                                    shadowColor: t.primary,
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 8,
                                } : {}),
                            },
                        ]}>
                            <Ionicons
                                name={isSpeaking ? "volume-high" : "volume-medium"}
                                size={18}
                                color={isSpeaking ? '#FFF' : isDark ? 'rgba(255,255,255,0.7)' : t.primary}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Hero Question Text */}
                <Text
                    style={[styles.clueText, {
                        fontSize: entry.clueText.length <= 25 ? 24 : entry.clueText.length <= 50 ? 22 : 20,
                        lineHeight: entry.clueText.length <= 25 ? 32 : entry.clueText.length <= 50 ? 30 : 28,
                        color: isDark ? '#F0EEF5' : '#1A1A2E',
                    }]}
                    numberOfLines={3}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    maxFontSizeMultiplier={1.4}
                    accessibilityRole="text"
                >
                    {entry.clueText}
                </Text>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    heroWrapper: {
        marginHorizontal: 10,
        marginBottom: 6,
    },
    heroCard: {
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 5,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    placeholder: {
        fontStyle: 'italic',
        flex: 1,
        textAlign: 'center',
        paddingVertical: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 3,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    clueText: {
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    ttsBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
});
