import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme, type ThemeColors } from '@/hooks/use-theme';

export type ButtonVariant = 'number' | 'operator' | 'equals';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  fontSize?: number;
  accessibilityLabel?: string;
};

const VARIANT_BACKGROUND: Record<ButtonVariant, keyof ThemeColors> = {
  number: 'numberButton',
  operator: 'operatorButton',
  equals: 'equalsButton',
};

const VARIANT_FOREGROUND: Record<ButtonVariant, keyof ThemeColors> = {
  number: 'numberButtonText',
  operator: 'operatorButtonText',
  equals: 'equalsButtonText',
};

export default function CalculatorButton({
  label,
  onPress,
  variant = 'number',
  fontSize = 28,
  accessibilityLabel,
}: Props) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const [focused, setFocused] = useState(false);

  const backgroundColor = theme[VARIANT_BACKGROUND[variant]];
  const foregroundColor = theme[VARIANT_FOREGROUND[variant]];

  const shrink = () => {
    Animated.timing(scale, { toValue: 0.94, duration: 110, useNativeDriver: true }).start();
  };

  const restore = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 7,
      tension: 130,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      onPressIn={shrink}
      onPressOut={restore}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.circle,
          {
            backgroundColor,
            shadowColor: theme.shadowColor,
            transform: [{ scale }],
          },
          focused && { borderColor: theme.accent },
        ]}
      >
        <Text
          style={[styles.label, { color: foregroundColor, fontSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  circle: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontWeight: '600',
  },
});
