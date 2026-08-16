import { useEffect, useRef } from 'react';
import {
  Animated,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { useTheme, useThemePreference, type ThemePreference } from '@/hooks/use-theme';

const CREATOR_NAME = 'Pratap Patra';
const GMAIL = 'pratappatra078@gmail.com';

const THEME_OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'light', label: 'Day' },
  { key: 'dark', label: 'Night' },
  { key: 'system', label: 'System' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function InfoModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.92);
      translateY.setValue(20);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity, scale, translateY]);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const openEmail = () => {
    Linking.openURL(`mailto:${GMAIL}`).catch(() => {
      // Ignore: the device may not have an email client configured.
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.modalBackdrop }]} onPress={onClose}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              opacity,
              transform: [{ scale }, { translateY }],
              shadowColor: theme.shadowColor,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Calculator</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close about dialog"
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.version, { color: theme.textSecondary }]}>Version {version}</Text>

          <Text style={[styles.caption, { color: theme.textSecondary }]}>Developed by</Text>
          <Text style={[styles.creator, { color: theme.textPrimary }]}>{CREATOR_NAME}</Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Email ${GMAIL}`}
            onPress={openEmail}
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={[styles.email, { color: theme.accent }]}>{GMAIL}</Text>
          </Pressable>

          <ScrollView style={styles.sections} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>About</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
              A minimal, premium calculator for Android. Supports standard arithmetic with operator
              precedence, percentages, and an editable expression with a tappable cursor.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Privacy</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
              All data stays on your device. Your calculation history and theme preference are stored
              locally using AsyncStorage and are never sent anywhere.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Open Source / Licenses
            </Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
              Built with React Native and Expo (MIT licensed). Icons by Ionicons. Font is the system
              font.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Theme</Text>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((option) => {
                const active = preference === option.key;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.label} theme`}
                    accessibilityState={{ selected: active }}
                    onPress={() => setPreference(option.key)}
                    style={({ pressed }) => [
                      styles.themeOption,
                      {
                        backgroundColor: active ? theme.equalsButton : theme.operatorButton,
                        borderColor: active ? theme.equalsButton : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.themeOptionText,
                        { color: active ? theme.equalsButtonText : theme.operatorButtonText },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close about dialog"
            onPress={onClose}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.equalsButton, shadowColor: theme.shadowColor },
              pressed && styles.actionPressed,
            ]}
          >
            <Text style={[styles.actionText, { color: theme.equalsButtonText }]}>Close</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  version: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 18,
  },
  creator: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  sections: {
    marginTop: 18,
    flexGrow: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  themeOption: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  actionPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
});
