import React, { useCallback, useRef } from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, TextStyle, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useUIProfile } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

interface PremiumButtonProps {
    title: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    style?: ViewStyle;
    textStyle?: TextStyle;
    variant?: 'primary' | 'secondary';
    size?: 'regular' | 'small';
    disabled?: boolean;
}

export default function PremiumButton({
    title,
    onPress,
    icon,
    style,
    textStyle,
    variant = 'primary',
    size = 'regular',
    disabled = false,
}: PremiumButtonProps) {
    const t = useTheme();
    const ui = useUIProfile();
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, { toValue: 0.97, damping: 15, stiffness: 300, mass: 1, useNativeDriver: true }).start();
        Animated.spring(opacity, { toValue: 0.88, damping: 15, stiffness: 300, mass: 1, useNativeDriver: true }).start();
    }, []);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 200, mass: 1, useNativeDriver: true }).start();
        Animated.spring(opacity, { toValue: 1, damping: 12, stiffness: 200, mass: 1, useNativeDriver: true }).start();
    }, []);

    const handlePress = useCallback(() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    }, [disabled, onPress]);

    const isSmall = size === 'small';
    const baseHeight = isSmall ? 40 : ui.buttonMinHeight;
    const height = Math.max(baseHeight, ui.buttonMinHeight);
    const borderRadius = isSmall ? 12 : ui.buttonBorderRadius + 6;
    const iconSize = isSmall ? 16 : Math.round(24 * ui.fontScale);
    const fontSize = Math.round((isSmall ? 15 : 19) * ui.fontScale);

    if (variant === 'secondary') {
        return (
            <Animated.View
                style={[
                    styles.secondary,
                    { height, borderRadius, backgroundColor: t.fill },
                    disabled && styles.disabled,
                    { transform: [{ scale }], opacity },
                    style,
                ]}
            >
                <Pressable
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 }}
                >
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={iconSize}
                            color={t.primary}
                            style={styles.icon}
                        />
                    )}
                    <Text style={[
                        styles.secondaryText,
                        { color: t.primary },
                        isSmall && styles.smallText,
                        textStyle,
                    ]}>
                        {title}
                    </Text>
                </Pressable>
            </Animated.View>
        );
    }

    const isDark = t.id !== 'light';
    const finalHeight = isDark ? height + 8 : height;
    const finalRadius = isDark ? 28 : borderRadius;
    const useGlow = ui.glow && isDark;
    const useGradient = ui.gradients;

    const buttonContent = (
        <>
            {icon && (
                <Ionicons
                    name={icon}
                    size={iconSize}
                    color={t.textInverse}
                    style={styles.icon}
                />
            )}
            <Text style={[
                styles.primaryText,
                { color: t.textInverse, fontSize },
                textStyle,
            ]}>
                {title}
            </Text>
        </>
    );

    return (
        <Animated.View
            style={[
                { borderRadius: finalRadius },
                disabled && styles.disabled,
                { transform: [{ scale }], opacity },
                useGlow && {
                    shadowColor: '#7C5CFF',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.45,
                    shadowRadius: 18,
                    elevation: 12,
                },
                style,
            ]}
        >
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {useGradient ? (
                    <LinearGradient
                        colors={t.gradientPrimary as readonly [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            styles.gradient,
                            { height: finalHeight, borderRadius: finalRadius },
                            ui.shadow === 'full' ? shadows.md : ui.shadowStyle,
                        ]}
                    >
                        {buttonContent}
                    </LinearGradient>
                ) : (
                    <View
                        style={[
                            styles.gradient,
                            {
                                height: finalHeight,
                                borderRadius: finalRadius,
                                backgroundColor: t.primary,
                            },
                            ui.shadowStyle,
                        ]}
                    >
                        {buttonContent}
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    primaryText: {
        ...typography.button,
        fontSize: 19,
        fontWeight: '700',
        letterSpacing: 0.6,
    },
    secondaryText: {
        ...typography.button,
    },
    secondary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        ...shadows.sm,
    },
    smallText: {
        fontSize: 15,
    },
    icon: {
        marginRight: 8,
    },
    disabled: {
        opacity: 0.4,
    },
});
