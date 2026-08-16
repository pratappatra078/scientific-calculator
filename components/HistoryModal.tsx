import { useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';

export type HistoryEntry = {
  id: string;
  expression: string;
  result: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
};

export default function HistoryModal({ visible, onClose, history, onSelect, onClear }: Props) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(40);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.modalBackdrop }]} onPress={onClose}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              maxHeight: Math.min(520, height * 0.7),
              opacity,
              transform: [{ translateY }],
              shadowColor: theme.shadowColor,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>History</Text>
            <View style={styles.headerActions}>
              {history.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear all history"
                  onPress={onClear}
                  hitSlop={8}
                  style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.errorText} />
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close history"
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          {history.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={34} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No calculations yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Reuse calculation ${item.expression} equals ${item.result}`}
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => [
                    styles.entry,
                    { backgroundColor: theme.listItem },
                    pressed && styles.entryPressed,
                  ]}
                >
                  <Text numberOfLines={1} style={[styles.entryExpression, { color: theme.textSecondary }]}>
                    {item.expression}
                  </Text>
                  <Text numberOfLines={1} style={[styles.entryResult, { color: theme.textPrimary }]}>
                    {item.result}
                  </Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              contentContainerStyle={styles.listContent}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}

          {history.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all history"
              onPress={onClear}
              style={({ pressed }) => [
                styles.clearButton,
                { borderColor: theme.errorText, shadowColor: theme.shadowColor },
                pressed && styles.clearPressed,
              ]}
            >
              <Text style={[styles.clearText, { color: theme.errorText }]}>Clear All</Text>
            </Pressable>
          )}
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
    maxWidth: 380,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  list: {
    flexShrink: 1,
  },
  listContent: {
    paddingBottom: 4,
  },
  entry: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  entryExpression: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  entryResult: {
    fontSize: 20,
    fontWeight: '700',
  },
  entryPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
  },
  clearButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  clearText: {
    fontSize: 15,
    fontWeight: '700',
  },
  clearPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  pressed: {
    opacity: 0.7,
  },
});
