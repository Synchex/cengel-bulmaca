import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Switch,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    Linking,
    Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useUIProfile } from '../../src/theme/ThemeContext';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useEconomyStore, HINT_LETTER_COST } from '../../src/store/useEconomyStore';
import { themes, themeIds, ThemeId } from '../../src/theme/themes';
import type { UIMode } from '../../src/theme/uiProfiles';
import { spacing } from '../../src/theme/spacing';
import Constants from 'expo-constants';

// ═══════════════════════════════════
//  SETTINGS SCREEN
// ═══════════════════════════════════
export default function SettingsScreen() {
    const t = useTheme();
    const ui = useUIProfile();
    const settings = useSettingsStore();
    const coins = useEconomyStore((s) => s.coins);
    const [costModalVisible, setCostModalVisible] = useState(false);

    const appVersion = Constants.expoConfig?.version ?? '1.0.0';

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: t.text }]}>Ayarlar</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ═══ A) Görünüm ═══ */}
                <SettingsSection title="Görünüm" theme={t}>
                    {/* Theme Picker */}
                    <Text style={[styles.rowLabel, { color: t.text }]}>Tema</Text>
                    <View style={styles.themeGrid}>
                        {themeIds.map((id) => (
                            <ThemeCard
                                key={id}
                                themeId={id}
                                isSelected={settings.themeId === id}
                                onPress={() => settings.setTheme(id)}
                                currentTheme={t}
                            />
                        ))}
                    </View>

                    {/* Arayüz Modu */}
                    <Text style={[styles.rowLabel, { color: t.text }]}>Arayüz Modu</Text>
                    <View style={styles.modeGrid}>
                        <UIModeCard
                            mode="modern"
                            label="Pro"
                            description="Gradyan, glow ve kompakt"
                            icon="sparkles-outline"
                            isSelected={settings.uiMode === 'modern'}
                            onPress={() => settings.setUIMode('modern')}
                            theme={t}
                        />
                        <UIModeCard
                            mode="accessible"
                            label="Büyük Mod"
                            description="Büyük yazı, yüksek kontrast"
                            icon="eye-outline"
                            isSelected={settings.uiMode === 'accessible'}
                            onPress={() => settings.setUIMode('accessible')}
                            theme={t}
                        />
                    </View>
                </SettingsSection>

                {/* ═══ B) Oyun ═══ */}
                <SettingsSection title="Oyun" theme={t}>
                    <SettingsRow
                        icon="phone-portrait-outline"
                        title="Titreşim"
                        subtitle="Dokunmatik geri bildirim"
                        theme={t}
                        right={
                            <Switch
                                value={settings.haptics}
                                onValueChange={settings.toggleHaptics}
                                trackColor={{ true: t.primary, false: t.border }}
                            />
                        }
                    />
                    <SettingsRow
                        icon="musical-notes-outline"
                        title="Müzik"
                        subtitle="Arka plan müziği"
                        theme={t}
                        right={
                            <Switch
                                value={settings.music}
                                onValueChange={settings.toggleMusic}
                                trackColor={{ true: t.primary, false: t.border }}
                            />
                        }
                    />
                    <SettingsRow
                        icon="volume-high-outline"
                        title="Ses Efektleri"
                        subtitle="Tuş ve oyun sesleri"
                        theme={t}
                        right={
                            <Switch
                                value={settings.sound}
                                onValueChange={settings.toggleSound}
                                trackColor={{ true: t.primary, false: t.border }}
                            />
                        }
                    />
                    <SettingsRow
                        icon="checkmark-circle-outline"
                        title="Otomatik Kontrol"
                        subtitle="Yazarken harfleri kontrol et"
                        theme={t}
                        right={
                            <Switch
                                value={settings.autoCheck}
                                onValueChange={settings.toggleAutoCheck}
                                trackColor={{ true: t.primary, false: t.border }}
                            />
                        }
                    />
                    {settings.autoCheck && (
                        <SettingsRow
                            icon="alert-circle-outline"
                            title="Yanlış Harfi Kırmızı Göster"
                            theme={t}
                            right={
                                <Switch
                                    value={settings.showWrongInRed}
                                    onValueChange={settings.toggleShowWrongInRed}
                                    trackColor={{ true: t.primary, false: t.border }}
                                />
                            }
                        />
                    )}
                </SettingsSection>

                {/* ═══ C) İpuçları & Ekonomi ═══ */}
                <SettingsSection title="İpuçları & Ekonomi" theme={t}>
                    <SettingsRow
                        icon="wallet-outline"
                        title="Coin Bakiye"
                        theme={t}
                        right={
                            <Text style={[styles.valueText, { color: t.accent }]}>{coins}</Text>
                        }
                    />
                    <SettingsRow
                        icon="pricetag-outline"
                        title="İpucu Ücretleri"
                        subtitle="Maliyet detayları"
                        theme={t}
                        onPress={() => setCostModalVisible(true)}
                        right={
                            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
                        }
                    />
                    <SettingsRow
                        icon="refresh-outline"
                        title="Satın Alımları Geri Yükle"
                        subtitle="Yakında"
                        theme={t}
                        disabled
                        right={
                            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
                        }
                    />
                </SettingsSection>

                {/* ═══ D) Hesap & Destek ═══ */}
                <SettingsSection title="Hesap & Destek" theme={t}>
                    <SettingsRow
                        icon="language-outline"
                        title="Dil"
                        theme={t}
                        right={
                            <TouchableOpacity
                                style={[styles.langPicker, { borderColor: t.border }]}
                                onPress={() =>
                                    settings.setLanguage(settings.language === 'tr' ? 'en' : 'tr')
                                }
                            >
                                <Text style={[styles.langText, { color: t.primary }]}>
                                    {settings.language === 'tr' ? 'Türkçe' : 'English'}
                                </Text>
                            </TouchableOpacity>
                        }
                    />
                    <SettingsRow
                        icon="shield-checkmark-outline"
                        title="Gizlilik Politikası"
                        theme={t}
                        onPress={() => WebBrowser.openBrowserAsync('https://synchex.github.io/bilgec-legal/#privacy')}
                        right={
                            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
                        }
                    />
                    <SettingsRow
                        icon="help-circle-outline"
                        title="Destek"
                        subtitle="Yardım ve SSS"
                        theme={t}
                        onPress={() => WebBrowser.openBrowserAsync('https://synchex.github.io/bilgec-legal/#support')}
                        right={
                            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
                        }
                    />
                    <SettingsRow
                        icon="chatbubble-outline"
                        title="Geri Bildirim Gönder"
                        theme={t}
                        onPress={() => Linking.openURL('mailto:mehmetcanbuyuklu@gmail.com?subject=Bilge%C3%A7%20Geri%20Bildirim')}
                        right={
                            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
                        }
                    />
                    <SettingsRow
                        icon="star-outline"
                        title="Uygulamayı Değerlendir"
                        theme={t}
                        onPress={() =>
                            Linking.openURL(
                                Platform.OS === 'ios'
                                    ? 'https://apps.apple.com'
                                    : 'https://play.google.com',
                            )
                        }
                        right={
                            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
                        }
                    />
                    <SettingsRow
                        icon="information-circle-outline"
                        title="Sürüm"
                        theme={t}
                        right={
                            <Text style={[styles.valueText, { color: t.textSecondary }]}>
                                {appVersion}
                            </Text>
                        }
                    />
                </SettingsSection>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Cost Modal ── */}
            <Modal visible={costModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: t.surface }]}>
                        <Text style={[styles.modalTitle, { color: t.text }]}>
                            İpucu Ücretleri
                        </Text>
                        <CostRow label="Random Harf" cost={3} theme={t} />
                        <CostRow label="Rastgele İpucu" cost={HINT_LETTER_COST} theme={t} />
                        <CostRow label="Kelimeyi Aç" cost={20} theme={t} />
                        <TouchableOpacity
                            style={[styles.modalClose, { backgroundColor: t.primarySoft }]}
                            onPress={() => setCostModalVisible(false)}
                        >
                            <Text style={[styles.modalCloseText, { color: t.primary }]}>
                                Kapat
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ═══════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════

interface SectionProps {
    title: string;
    theme: any;
    children: React.ReactNode;
}

function SettingsSection({ title, theme, children }: SectionProps) {
    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                {title}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                {children}
            </View>
        </View>
    );
}

interface RowProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    theme: any;
    right?: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
}

function SettingsRow({
    icon,
    title,
    subtitle,
    theme,
    right,
    onPress,
    disabled,
}: RowProps) {
    const Wrapper = onPress ? TouchableOpacity : View;
    return (
        <Wrapper
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.6}
            style={[styles.row, disabled && { opacity: 0.45 }]}
        >
            <View style={[styles.rowIconWrap, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name={icon} size={18} color={theme.primary} />
            </View>
            <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
                {subtitle ? (
                    <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            {right && <View style={styles.rowRight}>{right}</View>}
        </Wrapper>
    );
}

interface ThemeCardProps {
    themeId: ThemeId;
    isSelected: boolean;
    onPress: () => void;
    currentTheme: any;
}

function ThemeCard({ themeId, isSelected, onPress, currentTheme }: ThemeCardProps) {
    const definition = themes[themeId];
    return (
        <TouchableOpacity
            style={[
                styles.themeCard,
                {
                    borderColor: isSelected ? currentTheme.primary : currentTheme.border,
                    borderWidth: isSelected ? 2.5 : 1,
                    backgroundColor: definition.background,
                },
            ]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={[styles.themePreview, { backgroundColor: definition.primary }]} />
            <Text
                style={[
                    styles.themeLabel,
                    { color: definition.text, fontWeight: isSelected ? '800' : '600' },
                ]}
            >
                {definition.label}
            </Text>
            {isSelected && (
                <View style={[styles.themeCheck, { backgroundColor: currentTheme.primary }]}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
            )}
        </TouchableOpacity>
    );
}

function CostRow({
    label,
    cost,
    theme,
}: {
    label: string;
    cost: number;
    theme: any;
}) {
    return (
        <View style={styles.costRow}>
            <Text style={[styles.costLabel, { color: theme.text }]}>{label}</Text>
            <Text style={[styles.costValue, { color: theme.accent }]}>{cost} coin</Text>
        </View>
    );
}

interface UIModeCardProps {
    mode: UIMode;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    isSelected: boolean;
    onPress: () => void;
    theme: any;
}

function UIModeCard({ mode, label, description, icon, isSelected, onPress, theme }: UIModeCardProps) {
    return (
        <TouchableOpacity
            style={[
                styles.modeCard,
                {
                    borderColor: isSelected ? theme.primary : theme.border,
                    borderWidth: isSelected ? 2.5 : 1,
                    backgroundColor: isSelected ? theme.primarySoft : theme.surface,
                },
            ]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={[styles.modeIconWrap, { backgroundColor: isSelected ? theme.primary : theme.fill }]}>
                <Ionicons name={icon} size={20} color={isSelected ? '#FFF' : theme.textSecondary} />
            </View>
            <Text style={[styles.modeLabel, { color: theme.text, fontWeight: isSelected ? '800' : '600' }]}>
                {label}
            </Text>
            <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
                {description}
            </Text>
            {isSelected && (
                <View style={[styles.modeCheck, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
            )}
        </TouchableOpacity>
    );
}

// ═══════════════════════════════════
//  STYLES
// ═══════════════════════════════════
const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: 8,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.md },

    // Section
    section: { marginBottom: 20 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
        marginLeft: 4,
    },
    sectionCard: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },

    // Row
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        minHeight: 52,
    },
    rowIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rowBody: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600' },
    rowSub: { fontSize: 12, marginTop: 2 },
    rowLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 16,
        marginTop: 14,
        marginBottom: 8,
    },
    rowRight: { marginLeft: 8 },
    valueText: { fontSize: 15, fontWeight: '700' },

    // Theme grid
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        padding: 12,
    },
    themeCard: {
        width: '47%' as any,
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
        gap: 8,
        position: 'relative',
    },
    themePreview: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    themeLabel: { fontSize: 13 },
    themeCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Mode grid
    modeGrid: {
        flexDirection: 'row',
        gap: 10,
        padding: 12,
    },
    modeCard: {
        flex: 1,
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        gap: 6,
        position: 'relative' as const,
    },
    modeIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeLabel: { fontSize: 14 },
    modeDesc: { fontSize: 11, textAlign: 'center' as const },
    modeCheck: {
        position: 'absolute' as const,
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },

    // Lang picker
    langPicker: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    langText: { fontSize: 13, fontWeight: '700' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        borderRadius: 20,
        padding: 24,
        width: 300,
        gap: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 6,
    },
    modalClose: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 6,
    },
    modalCloseText: { fontSize: 15, fontWeight: '700' },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    costLabel: { fontSize: 15, fontWeight: '500' },
    costValue: { fontSize: 15, fontWeight: '700' },
});
