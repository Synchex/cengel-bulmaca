// ── 3 Color Themes: Purple, Dark, Light ──

export type ThemeId = 'purple' | 'dark' | 'light';

export interface ThemeColors {
    id: ThemeId;
    label: string;
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primarySoft: string;
    primary2: string;
    background: string;
    surface: string;
    surface2: string;
    card: string;
    cardAlt: string;
    fill: string;
    glass: string;
    overlay: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    border: string;
    borderLight: string;
    accent: string;
    accentDark: string;
    secondary: string;
    success: string;
    successLight: string;
    successDark: string;
    danger: string;
    warning: string;
    tabActive: string;
    tabInactive: string;
    gradientPrimary: readonly [string, string];
    gradientHero: readonly [string, string, string];
    shadow: string;
    shimmer: string;
}

const sharedSemantics = {
    success: '#34C759',
    successLight: '#E8FAE8',
    successDark: '#248A3D',
    danger: '#DC2626',
    warning: '#FF9500',
};

export const themes: Record<ThemeId, ThemeColors> = {
    // ── Purple Theme — Dark surfaces, purple accent ──
    purple: {
        id: 'purple',
        label: 'Mor',
        // Purple accent system
        primary: '#6366F1',
        primaryLight: '#A855F7',
        primaryDark: '#4F46E5',
        primarySoft: 'rgba(99,102,241,0.12)',
        primary2: '#A855F7',
        // Deep dark surfaces (same structure as dark theme)
        background: '#0D0B1A',
        surface: '#110F20',
        surface2: '#16132A',
        card: '#131024',
        cardAlt: '#16132A',
        fill: 'rgba(255,255,255,0.05)',
        glass: 'rgba(13,11,26,0.85)',
        overlay: 'rgba(0,0,0,0.7)',
        // Text
        text: '#E5E7EB',
        textSecondary: '#9CA3AF',
        textMuted: '#4B5563',
        textInverse: '#E5E7EB',
        // Borders
        border: 'rgba(255,255,255,0.05)',
        borderLight: 'rgba(255,255,255,0.03)',
        // Tab bar
        tabActive: '#A855F7',
        tabInactive: '#6B7280',
        // Gradients
        gradientPrimary: ['#6366F1', '#A855F7'] as const,
        gradientHero: ['#0D0B1A', '#16132A', '#080612'] as const,
        // Shadow — purple glow
        shadow: 'rgba(99,102,241,0.18)',
        shimmer: 'rgba(99,102,241,0.04)',
        ...sharedSemantics,
        accent: '#7C3AED',
        accentDark: '#6D28D9',
        secondary: '#9CA3AF',
    },

    // ── Dark Theme — Blue accent ─────────────────────
    dark: {
        id: 'dark',
        label: 'Siyah',
        primary: '#5E8BFF',
        primaryLight: '#7B61FF',
        primaryDark: '#4A6FD9',
        primarySoft: 'rgba(94,139,255,0.12)',
        primary2: '#7B61FF',
        background: '#0B1020',
        surface: '#0F1424',
        surface2: '#131A2E',
        card: '#111827',
        cardAlt: '#131A2E',
        fill: 'rgba(255,255,255,0.05)',
        glass: 'rgba(10,15,30,0.85)',
        overlay: 'rgba(0,0,0,0.7)',
        text: '#E5E7EB',
        textSecondary: '#9CA3AF',
        textMuted: '#4B5563',
        textInverse: '#E5E7EB',
        border: 'rgba(255,255,255,0.05)',
        borderLight: 'rgba(255,255,255,0.03)',
        tabActive: '#5E8BFF',
        tabInactive: '#6B7280',
        gradientPrimary: ['#5E8BFF', '#7B61FF'] as const,
        gradientHero: ['#0B1020', '#131A2E', '#05070F'] as const,
        shadow: 'rgba(94,139,255,0.15)',
        shimmer: 'rgba(94,139,255,0.04)',
        ...sharedSemantics,
        accent: '#5E8BFF',
        accentDark: '#4A6FD9',
        secondary: '#9CA3AF',
    },

    // ── Light Theme — B&W Apple-style ────────────────
    light: {
        id: 'light',
        label: 'Açık',
        primary: '#3B82F6',
        primaryLight: '#60A5FA',
        primaryDark: '#2563EB',
        primarySoft: 'rgba(59,130,246,0.06)',
        primary2: '#2563EB',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surface2: '#F7F7F7',
        card: '#F7F7F7',
        cardAlt: '#F0F0F0',
        fill: 'rgba(0,0,0,0.03)',
        glass: 'rgba(255,255,255,0.95)',
        overlay: 'rgba(0,0,0,0.4)',
        text: '#000000',
        textSecondary: '#555555',
        textMuted: '#9CA3AF',
        textInverse: '#FFFFFF',
        border: '#E5E5E5',
        borderLight: '#F0F0F0',
        tabActive: '#3B82F6',
        tabInactive: '#9CA3AF',
        gradientPrimary: ['#3B82F6', '#2563EB'] as const,
        gradientHero: ['#FFFFFF', '#F9FAFB', '#FFFFFF'] as const,
        shadow: 'rgba(0,0,0,0.06)',
        shimmer: 'rgba(0,0,0,0.02)',
        ...sharedSemantics,
        accent: '#3B82F6',
        accentDark: '#2563EB',
        secondary: '#555555',
    },
};

export const themeIds: ThemeId[] = ['purple', 'dark', 'light'];

/**
 * Returns a copy of the given theme with forced light-mode surfaces.
 */
export function getGameplayLightTheme(base: ThemeColors): ThemeColors {
    return {
        ...base,
        id: base.id,
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surface2: '#F7F7F7',
        card: '#F7F7F7',
        cardAlt: '#F0F0F0',
        fill: 'rgba(0,0,0,0.03)',
        glass: 'rgba(255,255,255,0.95)',
        overlay: 'rgba(0,0,0,0.4)',
        text: '#000000',
        textSecondary: '#555555',
        textMuted: '#9CA3AF',
        textInverse: '#FFFFFF',
        border: '#E5E5E5',
        borderLight: '#F0F0F0',
        successLight: '#E8FAE8',
        successDark: '#248A3D',
    };
}
