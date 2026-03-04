import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { IS_DEV } from '../config/devConfig';
import { useEconomyStore } from '../store/useEconomyStore';
import { useProgressStore } from '../store/gameStore';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function DeveloperPanel({ visible, onClose }: Props) {
    if (!IS_DEV) return null;

    const coins = useEconomyStore((s) => s.coins);
    const addCoins = useEconomyStore((s) => s.addCoins);
    const progress = useProgressStore((s) => s.progress);

    const handleUnlockAll = () => {
        const store = useProgressStore.getState();
        progress.forEach((p) => {
            if (!p.unlocked) {
                store.completeLevel(p.levelId - 1, 0, 0, 0, 0);
            }
        });
        Alert.alert('Dev', 'Tüm bölümler açıldı!');
    };

    const handleResetProgress = () => {
        Alert.alert(
            'İlerlemeyi Sıfırla',
            'Tüm ilerleme silinecek. Devam?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sıfırla',
                    style: 'destructive',
                    onPress: () => {
                        useProgressStore.setState({
                            progress: Array.from({ length: 6 }, (_, i) => ({
                                levelId: i + 1,
                                unlocked: i === 0,
                                completed: false,
                                status: 'not_started' as const,
                                updatedAt: 0,
                                stars: 0,
                                bestTime: 0,
                                bestMistakes: 999,
                                bestHintsUsed: 999,
                            })),
                        });
                        useProgressStore.getState().saveProgress();
                        Alert.alert('Dev', 'İlerleme sıfırlandı.');
                    },
                },
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.panel}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>🛠 Developer Panel</Text>
                    <Text style={styles.subtitle}>Gerçek coin: {coins}</Text>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <DevButton
                            label="+1000 Coin"
                            emoji="🪙"
                            color="#00B894"
                            onPress={() => {
                                addCoins(1000);
                                Alert.alert('Dev', '+1000 coin eklendi');
                            }}
                        />
                        <DevButton
                            label="Coin Sıfırla"
                            emoji="🔄"
                            color="#FDCB6E"
                            onPress={() => {
                                useEconomyStore.setState({ coins: 50 });
                                Alert.alert('Dev', 'Coin 50\'ye sıfırlandı');
                            }}
                        />
                        <DevButton
                            label="Tüm Bölümleri Aç"
                            emoji="🔓"
                            color="#6C5CE7"
                            onPress={handleUnlockAll}
                        />
                        <DevButton
                            label="İlerlemeyi Sıfırla"
                            emoji="💣"
                            color="#FF6B6B"
                            onPress={handleResetProgress}
                        />
                    </View>

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>Kapat</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

// ── Button ──
function DevButton({
    label,
    emoji,
    color,
    onPress,
}: {
    label: string;
    emoji: string;
    color: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.devBtn, { backgroundColor: color + '15', borderColor: color + '40' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={styles.devBtnEmoji}>{emoji}</Text>
            <Text style={[styles.devBtnLabel, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    panel: {
        width: '85%',
        backgroundColor: colors.surface,
        borderRadius: radius.xxl,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
        alignItems: 'center',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.text,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 4,
        marginBottom: spacing.lg,
    },
    actions: {
        width: '100%',
        gap: spacing.sm,
    },
    devBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        gap: spacing.sm,
    },
    devBtnEmoji: {
        fontSize: 20,
    },
    devBtnLabel: {
        fontSize: 15,
        fontWeight: '700',
    },
    closeBtn: {
        marginTop: spacing.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xl,
    },
    closeBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
    },
});
