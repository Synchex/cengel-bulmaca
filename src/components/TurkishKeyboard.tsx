import React, { useRef, useCallback, memo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { useUIProfile, useTheme } from '../theme/ThemeContext';

// ── Turkish Q Keyboard Layout ──
const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç'],
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const KEY_H_MARGIN = 1.5;
const KEYBOARD_H_PAD = 3;

// ── Newspaper palette ──
const NP_PAPER = '#F4F1E8';
const NP_INK = '#111111';
const NP_BORDER = '#333333';
const NP_MUTED = '#888888';
const NP_SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

interface Props {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onCheck: () => void;
  onHint: () => void;
  disabled?: boolean;
  variant?: 'default' | 'newspaper';
}

// ── Single Key (memoized) ──
const MemoKey = memo(function Key({
  label,
  onPress,
  width,
  height,
  fontSize,
  isBackspace,
  disabled,
  keyBg,
  keyTextColor,
  backspaceBg,
  backspaceBorderColor,
  backspaceTextColor,
  isNewspaper,
}: {
  label: string;
  onPress: () => void;
  width: number;
  height: number;
  fontSize: number;
  isBackspace: boolean;
  disabled?: boolean;
  keyBg: string;
  keyTextColor: string;
  backspaceBg: string;
  backspaceBorderColor: string;
  backspaceTextColor: string;
  isNewspaper?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (isNewspaper) {
      // Simple opacity-like scale for newspaper
      Animated.timing(scale, { toValue: 0.95, duration: 50, useNativeDriver: true }).start();
    } else {
      Animated.spring(scale, { toValue: 0.9, friction: 5, tension: 400, useNativeDriver: true }).start();
    }
  }, [isNewspaper]);

  const handlePressOut = useCallback(() => {
    if (isNewspaper) {
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }).start();
    } else {
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
    }
  }, [isNewspaper]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [disabled, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          isNewspaper ? npStyles.key : styles.key,
          {
            width,
            height,
            backgroundColor: isBackspace ? backspaceBg : keyBg,
            transform: [{ scale }],
          },
          isBackspace && !isNewspaper && { borderWidth: 1.5, borderColor: backspaceBorderColor },
          isBackspace && isNewspaper && { borderWidth: 1, borderColor: NP_BORDER },
          disabled && styles.disabledKey,
        ]}
      >
        <Text
          style={[
            isNewspaper ? npStyles.keyText : styles.keyText,
            {
              fontSize,
              color: isBackspace ? backspaceTextColor : keyTextColor,
            },
            isBackspace && { fontWeight: '700' },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

export default function TurkishKeyboard({
  onKeyPress,
  onBackspace,
  onCheck,
  onHint,
  disabled,
  variant = 'default',
}: Props) {
  const ui = useUIProfile();
  const t = useTheme();
  const gp = ui.gameplay;

  const isNewspaper = variant === 'newspaper';

  // Theme-derived key colors
  const keyBg = isNewspaper ? '#FFFFFF' : t.surface;
  const keyTextColor = isNewspaper ? NP_INK : t.text;
  const backspaceBg = isNewspaper ? '#FFFFFF' : (t.id !== 'light' ? '#2A1A1A' : '#FFE8E8');
  const backspaceBorderColor = isNewspaper ? NP_BORDER : (t.secondary + '40');
  const backspaceTextColor = isNewspaper ? NP_INK : (t.id !== 'light' ? '#FF6B6B' : '#C0392B');
  const containerBg = isNewspaper ? NP_PAPER : (t.id !== 'light' ? t.surface2 : '#F2F0F7');
  const containerBorder = isNewspaper ? '#CCCCCC' : t.borderLight;

  // Key widths calculated per row for balanced sizing
  const row1Count = ROWS[0].length;
  const row1KeyW = (SCREEN_WIDTH - KEYBOARD_H_PAD * 2 - row1Count * KEY_H_MARGIN * 2) / row1Count;

  const row2Count = ROWS[1].length;
  const row2KeyW = (SCREEN_WIDTH - KEYBOARD_H_PAD * 2 - row2Count * KEY_H_MARGIN * 2) / row2Count;

  const row3LetterCount = ROWS[2].length;
  const row3TotalSlots = row3LetterCount + 1.6;
  const row3KeyW = (SCREEN_WIDTH - KEYBOARD_H_PAD * 2 - (row3LetterCount + 1) * KEY_H_MARGIN * 2) / row3TotalSlots;
  const backspaceW = row3KeyW * 1.6;

  const checkScale = useRef(new Animated.Value(1)).current;
  const hintScale = useRef(new Animated.Value(1)).current;

  const pressIn = (anim: Animated.Value) => {
    if (isNewspaper) {
      Animated.timing(anim, { toValue: 0.96, duration: 50, useNativeDriver: true }).start();
    } else {
      Animated.spring(anim, { toValue: 0.94, friction: 5, tension: 400, useNativeDriver: true }).start();
    }
  };
  const pressOut = (anim: Animated.Value) => {
    if (isNewspaper) {
      Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }).start();
    } else {
      Animated.spring(anim, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
    }
  };

  const getKeyWidth = (rowIndex: number) => {
    if (rowIndex === 0) return row1KeyW;
    if (rowIndex === 1) return row2KeyW;
    return row3KeyW;
  };

  const keyHeight = isNewspaper ? 40 : gp.keyHeight;
  const keyFontSize = isNewspaper ? 15 : gp.keyFontSize;

  return (
    <View style={[
      isNewspaper ? npStyles.container : styles.container,
      { backgroundColor: containerBg, borderTopColor: containerBorder },
    ]}>
      {ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <MemoKey
              key={key}
              label={key}
              onPress={() => onKeyPress(key)}
              width={getKeyWidth(rowIndex)}
              height={keyHeight}
              fontSize={keyFontSize}
              isBackspace={false}
              disabled={disabled}
              keyBg={keyBg}
              keyTextColor={keyTextColor}
              backspaceBg={backspaceBg}
              backspaceBorderColor={backspaceBorderColor}
              backspaceTextColor={backspaceTextColor}
              isNewspaper={isNewspaper}
            />
          ))}
          {rowIndex === 2 && (
            <MemoKey
              label="⌫"
              onPress={onBackspace}
              width={backspaceW}
              height={keyHeight}
              fontSize={keyFontSize + 5}
              isBackspace={true}
              disabled={disabled}
              keyBg={keyBg}
              keyTextColor={keyTextColor}
              backspaceBg={backspaceBg}
              backspaceBorderColor={backspaceBorderColor}
              backspaceTextColor={backspaceTextColor}
              isNewspaper={isNewspaper}
            />
          )}
        </View>
      ))}

      {/* Action row */}
      <View style={isNewspaper ? npStyles.actionRow : styles.actionRow}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onHint();
          }}
          onPressIn={() => pressIn(hintScale)}
          onPressOut={() => pressOut(hintScale)}
          disabled={disabled}
          style={styles.actionFlex}
        >
          <Animated.View
            style={[
              isNewspaper ? npStyles.actionBtnOutline : styles.actionBtn,
              isNewspaper ? {
                height: 40,
                transform: [{ scale: hintScale }],
              } : {
                height: gp.actionBtnHeight,
                backgroundColor: t.accent + '1A',
                borderWidth: 1.5,
                borderColor: t.accent + '50',
                transform: [{ scale: hintScale }],
              },
            ]}
          >
            <Text style={isNewspaper ? npStyles.actionBtnOutlineText : [styles.hintText, { fontSize: gp.actionFontSize, color: t.id !== 'light' ? t.accent : '#C67700' }]}>
              {isNewspaper ? 'İPUCU' : (ui.mode === 'accessible' ? 'İpucu Al' : '💡 İpucu')}
            </Text>
          </Animated.View>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onCheck();
          }}
          onPressIn={() => pressIn(checkScale)}
          onPressOut={() => pressOut(checkScale)}
          disabled={disabled}
          style={styles.actionFlex}
        >
          <Animated.View
            style={[
              isNewspaper ? npStyles.actionBtnFilled : styles.actionBtn,
              isNewspaper ? {
                height: 40,
                transform: [{ scale: checkScale }],
              } : {
                height: gp.actionBtnHeight,
                backgroundColor: t.primary,
                shadowColor: t.primaryDark,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 6,
                transform: [{ scale: checkScale }],
              },
            ]}
          >
            <Text style={isNewspaper ? npStyles.actionBtnFilledText : [styles.checkText, { fontSize: gp.actionFontSize }]}>
              {isNewspaper ? 'KONTROL ET' : 'Kontrol Et'}
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

// ── Default styles (unchanged) ──
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: KEYBOARD_H_PAD,
    paddingBottom: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 3,
  },
  key: {
    borderRadius: radius.md,
    marginHorizontal: KEY_H_MARGIN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A3E',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 2.5,
    elevation: 2,
  },
  disabledKey: {
    opacity: 0.3,
  },
  keyText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 2,
    gap: 10,
    paddingHorizontal: spacing.sm,
  },
  actionFlex: {
    flex: 1,
  },
  actionBtn: {
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontWeight: '700',
  },
  checkText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});

// ── Newspaper variant styles ──
const npStyles = StyleSheet.create({
  container: {
    paddingHorizontal: KEYBOARD_H_PAD,
    paddingBottom: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  key: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginHorizontal: KEY_H_MARGIN,
    justifyContent: 'center',
    alignItems: 'center',
    // No shadows
  },
  keyText: {
    fontFamily: NP_SERIF,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 2,
    gap: 10,
    paddingHorizontal: 8,
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: NP_INK,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
  },
  actionBtnOutlineText: {
    fontFamily: NP_SERIF,
    fontSize: 12,
    fontWeight: '700',
    color: NP_INK,
    letterSpacing: 1.5,
  },
  actionBtnFilled: {
    backgroundColor: NP_INK,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
  },
  actionBtnFilledText: {
    fontFamily: NP_SERIF,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
});
