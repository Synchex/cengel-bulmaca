import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ScrollView,
    Dimensions,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Entry } from '../cengel/types';
import { useUIProfile, useTheme } from '../theme/ThemeContext';
import { useSpeech } from '../hooks/useSpeech';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_H } = Dimensions.get('window');
const MAX_EXPANDED_HEIGHT = Math.round(SCREEN_H * 0.30);

interface ClueBarProps {
    entry: Entry | null;
    canToggle: boolean;
    onToggle: () => void;
    onClose?: () => void;
}

export default function ClueBar({ entry, canToggle, onToggle, onClose }: ClueBarProps) {
    const ui = useUIProfile();
    const t = useTheme();
    const gp = ui.gameplay;
    const { speak, stop, isSpeaking } = useSpeech();

    const [expanded, setExpanded] = useState(false);
    const [needsExpand, setNeedsExpand] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const ttsScale = useRef(new Animated.Value(1)).current;

    // Collapse when clue changes
    useEffect(() => {
        setExpanded(false);
        setNeedsExpand(false);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
        }).start();
    }, [entry?.id]);

    // Stop TTS when clue changes
    useEffect(() => {
        stop();
    }, [entry?.id, stop]);

    const handleTTSPressIn = () => {
        Animated.spring(ttsScale, { toValue: 0.88, useNativeDriver: true }).start();
    };
    const handleTTSPressOut = () => {
        Animated.spring(ttsScale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }).start();
    };

    const toggleExpand = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded((e) => !e);
    }, []);

    const onTextLayout = useCallback((e: any) => {
        const lines = e.nativeEvent.lines?.length ?? 0;
        if (lines > 2) {
            setNeedsExpand(true);
        }
    }, []);

    const isDark = t.id === 'black';

    // ── Empty state ──
    if (!entry) {
        return (
            <View style={[styles.card, styles.cardEmpty, {
                backgroundColor: isDark ? 'rgba(15,17,30,0.92)' : 'rgba(255,255,255,0.95)',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            }]}>
                <Text style={[styles.placeholder, { color: isDark ? 'rgba(255,255,255,0.3)' : t.textMuted }]}>
                    Bir hücreye dokun
                </Text>
            </View>
        );
    }

    const dirLabel = entry.direction === 'across' ? 'Yatay' : 'Dikey';
    const dirArrow = entry.direction === 'across' ? '→' : '↓';
    const iconBtnSize = 34;

    return (
        <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
            <View style={[styles.card, {
                backgroundColor: isDark ? 'rgba(15,17,30,0.92)' : 'rgba(255,255,255,0.96)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                shadowColor: isDark ? '#6366F1' : '#000',
            }]}>
                {/* ── Top Row: Pill + Icons ── */}
                <View style={styles.topRow}>
                    {/* Direction pill */}
                    <View style={[styles.pill, {
                        backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.10)',
                    }]}>
                        <Text style={styles.pillArrow}>{dirArrow}</Text>
                        <Text style={[styles.pillText, { color: '#818CF8' }]}>
                            {dirLabel} · {entry.length}
                        </Text>
                    </View>

                    <View style={{ flex: 1 }} />

                    {/* TTS button */}
                    <TouchableOpacity
                        activeOpacity={1}
                        onPressIn={handleTTSPressIn}
                        onPressOut={handleTTSPressOut}
                        onPress={() => isSpeaking ? stop() : speak(entry.clueText)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                        accessibilityLabel="Soruyu sesli oku"
                    >
                        <Animated.View style={[styles.iconBtn, {
                            width: iconBtnSize,
                            height: iconBtnSize,
                            borderRadius: iconBtnSize / 2,
                            backgroundColor: isSpeaking
                                ? '#818CF8'
                                : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                            borderColor: isSpeaking
                                ? '#818CF8'
                                : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                            transform: [{ scale: ttsScale }],
                        }]}>
                            <Ionicons
                                name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                                size={16}
                                color={isSpeaking ? '#FFF' : isDark ? 'rgba(255,255,255,0.6)' : '#818CF8'}
                            />
                        </Animated.View>
                    </TouchableOpacity>

                    {/* Close button */}
                    {onClose && (
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                            accessibilityLabel="Kapat"
                            style={[styles.iconBtn, {
                                width: iconBtnSize,
                                height: iconBtnSize,
                                borderRadius: iconBtnSize / 2,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                                marginLeft: 6,
                            }]}
                        >
                            <Ionicons name="close" size={15} color={isDark ? 'rgba(255,255,255,0.5)' : t.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Clue Text ── */}
                {expanded ? (
                    <TouchableOpacity activeOpacity={0.8} onPress={toggleExpand}>
                        <ScrollView
                            style={{ maxHeight: MAX_EXPANDED_HEIGHT }}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            <Text style={[styles.clueText, {
                                color: isDark ? '#EEEDF5' : '#1A1A2E',
                            }]}>
                                {entry.clueText}
                            </Text>
                        </ScrollView>
                        <View style={styles.collapseHint}>
                            <Ionicons name="chevron-up" size={14} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        activeOpacity={needsExpand ? 0.7 : 1}
                        onPress={needsExpand ? toggleExpand : undefined}
                        disabled={!needsExpand}
                    >
                        <Text
                            style={[styles.clueText, {
                                color: isDark ? '#EEEDF5' : '#1A1A2E',
                            }]}
                            numberOfLines={2}
                            onTextLayout={onTextLayout}
                        >
                            {entry.clueText}
                        </Text>
                        {needsExpand && (
                            <View style={styles.expandHint}>
                                <Text style={[styles.expandText, { color: '#818CF8' }]}>Daha fazla</Text>
                                <Ionicons name="chevron-down" size={12} color="#818CF8" />
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        alignSelf: 'stretch',
        paddingHorizontal: 6,
        marginBottom: 4,
        marginTop: 4,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 12,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    cardEmpty: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 56,
    },
    placeholder: {
        fontSize: 14,
        fontWeight: '500',
        fontStyle: 'italic',
    },
    // ── Top row ──
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    // ── Direction pill ──
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 4,
    },
    pillArrow: {
        fontSize: 13,
        fontWeight: '800',
        color: '#818CF8',
    },
    pillText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    // ── Icon buttons ──
    iconBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    // ── Clue text ──
    clueText: {
        fontSize: 19,
        fontWeight: '700',
        lineHeight: 26,
        letterSpacing: -0.1,
    },
    // ── Expand / Collapse hints ──
    expandHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 4,
    },
    expandText: {
        fontSize: 12,
        fontWeight: '600',
    },
    collapseHint: {
        alignItems: 'center',
        marginTop: 4,
    },
});
