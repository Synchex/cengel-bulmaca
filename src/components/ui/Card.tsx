import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme, useUIProfile } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated' | 'accent';
    padding?: keyof typeof spacing;
}

export default function Card({
    children,
    style,
    variant = 'default',
    padding = 'md',
}: CardProps) {
    const t = useTheme();
    const ui = useUIProfile();
    const isDark = t.id !== 'light';
    return (
        <View
            style={[
                styles.base,
                {
                    backgroundColor: t.card,
                    borderColor: t.border,
                    padding: spacing[padding],
                    borderRadius: ui.cardBorderRadius + 4,
                    ...(ui.shadow === 'full' ? shadows.sm : ui.shadowStyle),
                },
                isDark && ui.glow && {
                    shadowColor: t.shadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 12,
                    elevation: 6,
                },
                variant === 'elevated' && (ui.shadow === 'full' ? styles.elevated : {}),
                variant === 'accent' && {
                    borderWidth: 1,
                    borderColor: t.primary + '20',
                    ...(ui.shadow === 'full' ? shadows.md : ui.shadowStyle),
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        ...shadows.sm,
    },
    elevated: {
        ...shadows.md,
    },
});
