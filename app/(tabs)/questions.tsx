import React from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuestionStore } from '../../src/store/useQuestionStore';
import { Difficulty, QuestionType } from '../../src/utils/questionLoader';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
import { shadows } from '../../src/theme/shadows';
import { typography } from '../../src/theme/typography';
import QuestionDetailModal from '../../src/components/QuestionDetailModal';

const LEVELS = [1, 2, 3, 4, 5, 6, 7];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const TYPES: { key: QuestionType; label: string }[] = [
    { key: 'multipleChoice', label: 'Çoktan Seçmeli' },
    { key: 'wordFill', label: 'Kelime Tamamla' },
    { key: 'crossword', label: 'Bulmaca' },
];

const DIFF_COLORS: Record<Difficulty, string> = {
    easy: colors.success,
    medium: colors.accent,
    hard: colors.secondary,
};
const DIFF_LABELS: Record<Difficulty, string> = {
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
};
const TYPE_LABELS: Record<QuestionType, string> = {
    multipleChoice: 'ÇS',
    wordFill: 'KT',
    crossword: 'BU',
};

export default function QuestionsScreen() {
    const filters = useQuestionStore((s) => s.filters);
    const setLevel = useQuestionStore((s) => s.setLevel);
    const setDifficulty = useQuestionStore((s) => s.setDifficulty);
    const setType = useQuestionStore((s) => s.setType);
    const setShowNewOnly = useQuestionStore((s) => s.setShowNewOnly);
    const clearFilters = useQuestionStore((s) => s.clearFilters);
    const filteredQuestions = useQuestionStore((s) => s.filteredQuestions);
    const selectQuestion = useQuestionStore((s) => s.selectQuestion);
    const selectedQuestion = useQuestionStore((s) => s.selectedQuestion);

    const data = filteredQuestions();

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>📋 Soru Veritabanı</Text>
                <Text style={styles.subtitle}>{data.length} soru</Text>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {/* Level pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                >
                    <TouchableOpacity
                        style={[
                            styles.chip,
                            filters.level === null && styles.chipActive,
                        ]}
                        onPress={() => setLevel(null)}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                filters.level === null && styles.chipTextActive,
                            ]}
                        >
                            Tümü
                        </Text>
                    </TouchableOpacity>
                    {LEVELS.map((lv) => (
                        <TouchableOpacity
                            key={lv}
                            style={[
                                styles.chip,
                                filters.level === lv && styles.chipActive,
                            ]}
                            onPress={() => setLevel(filters.level === lv ? null : lv)}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    filters.level === lv && styles.chipTextActive,
                                ]}
                            >
                                Lv.{lv}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                >
                    <TouchableOpacity
                        style={[
                            styles.chip,
                            filters.showNewOnly && styles.chipActiveSecondary,
                            !filters.showNewOnly && { borderColor: colors.secondary },
                        ]}
                        onPress={() => setShowNewOnly(!filters.showNewOnly)}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                filters.showNewOnly ? styles.chipTextActive : { color: colors.secondary },
                            ]}
                        >
                            ✨ Yeni Sorular
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Difficulty chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                >
                    {DIFFICULTIES.map((d) => (
                        <TouchableOpacity
                            key={d}
                            style={[
                                styles.chip,
                                {
                                    borderColor: DIFF_COLORS[d],
                                    backgroundColor:
                                        filters.difficulty === d
                                            ? DIFF_COLORS[d]
                                            : DIFF_COLORS[d] + '15',
                                },
                            ]}
                            onPress={() =>
                                setDifficulty(filters.difficulty === d ? null : d)
                            }
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    {
                                        color:
                                            filters.difficulty === d
                                                ? colors.textInverse
                                                : DIFF_COLORS[d],
                                    },
                                ]}
                            >
                                {DIFF_LABELS[d]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Type tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                >
                    {TYPES.map(({ key, label }) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.chip,
                                filters.type === key && styles.chipActivePrimary,
                            ]}
                            onPress={() => setType(filters.type === key ? null : key)}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    filters.type === key && styles.chipTextActive,
                                ]}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Question list */}
            <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.7}
                        onPress={() => selectQuestion(item)}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardId}>#{item.id}</Text>
                            <View style={styles.badges}>
                                <View
                                    style={[
                                        styles.badge,
                                        { backgroundColor: DIFF_COLORS[item.difficulty] + '20' },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.badgeText,
                                            { color: DIFF_COLORS[item.difficulty] },
                                        ]}
                                    >
                                        {DIFF_LABELS[item.difficulty]}
                                    </Text>
                                </View>
                                <View style={styles.badgeType}>
                                    <Text style={styles.badgeTypeText}>
                                        {TYPE_LABELS[item.type]}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.cardPrompt} numberOfLines={2}>
                            {item.prompt}
                        </Text>
                        <View style={styles.cardFooter}>
                            <Text style={styles.cardLevel}>Seviye {item.level}</Text>
                            <Text style={styles.cardDate}>{item.createdAt}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>🔍</Text>
                        <Text style={styles.emptyText}>
                            Filtrelere uygun soru bulunamadı
                        </Text>
                        <TouchableOpacity onPress={clearFilters}>
                            <Text style={styles.clearBtn}>Filtreleri Temizle</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Detail Modal */}
            <QuestionDetailModal
                question={selectedQuestion}
                onClose={() => selectQuestion(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    title: {
        ...typography.h1,
        color: colors.text,
    },
    subtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    filtersContainer: {
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 6,
    },
    chipRow: {
        paddingHorizontal: spacing.md,
        gap: 8,
        flexDirection: 'row',
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: radius.full,
        backgroundColor: colors.cardAlt,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipActivePrimary: {
        backgroundColor: colors.primaryLight,
        borderColor: colors.primary,
    },
    chipActiveSecondary: {
        backgroundColor: colors.secondary + '20',
        borderColor: colors.secondary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    chipTextActive: {
        color: colors.textInverse,
    },
    listContent: {
        padding: spacing.md,
        gap: spacing.sm,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.md,
        ...shadows.sm,
        gap: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardId: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,
        fontFamily: 'monospace',
    },
    badges: {
        flexDirection: 'row',
        gap: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    badgeType: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full,
        backgroundColor: colors.primary + '15',
    },
    badgeTypeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
    },
    cardPrompt: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardLevel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
    },
    cardDate: {
        fontSize: 11,
        color: colors.textMuted,
    },
    // ── Empty state ──
    emptyContainer: {
        alignItems: 'center',
        paddingTop: spacing.xxl,
        gap: spacing.sm,
    },
    emptyEmoji: {
        fontSize: 48,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    clearBtn: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
});
