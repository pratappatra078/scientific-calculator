import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  cursor: number;
  onCursor: (index: number) => void;
  fontSize: number;
};

const CURSOR_WIDTH = 2.5;
const CURSOR_MARGIN = 1.5;
const SPACER_WIDTH = 10;
const CHAR_HIT_SLOP = { top: 8, bottom: 8, left: 2, right: 2 };

export default function ExpressionEditor({ value, cursor, onCursor, fontSize }: Props) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const viewportWidth = useRef(0);
  const [cursorX, setCursorX] = useState(0);

  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  useEffect(() => {
    const width = viewportWidth.current;
    if (width === 0) {
      return;
    }
    const target = Math.max(0, cursorX - width / 2 + CURSOR_WIDTH);
    scrollRef.current?.scrollTo({ x: target, animated: true });
  }, [cursor, cursorX]);

  const before = value.slice(0, cursor);
  const after = value.slice(cursor);

  return (
    <View style={{ height: fontSize * 1.45 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        onLayout={(event: LayoutChangeEvent) => {
          viewportWidth.current = event.nativeEvent.layout.width;
        }}
      >
        <View
          accessible
          accessibilityLabel={`Expression: ${value}`}
          accessibilityHint="Tap anywhere on the expression to move the cursor"
          style={styles.row}
        >
          <Pressable
            accessible={false}
            onPress={() => onCursor(0)}
            style={[styles.leadingSpacer, { flexGrow: 1 }]}
          />
          {Array.from(before).map((character, index) => (
            <Pressable
              key={`before-${index}`}
              accessible={false}
              hitSlop={CHAR_HIT_SLOP}
              onPress={() => onCursor(index)}
              style={styles.character}
            >
              <Text style={[styles.characterText, { color: theme.textPrimary, fontSize }]}>
                {character}
              </Text>
            </Pressable>
          ))}
          <Animated.View
            onLayout={(event: LayoutChangeEvent) => {
              setCursorX(event.nativeEvent.layout.x);
            }}
            style={[
              styles.cursor,
              {
                backgroundColor: theme.accent,
                opacity: blink,
                height: fontSize * 1.25,
              },
            ]}
          />
          {Array.from(after).map((character, index) => (
            <Pressable
              key={`after-${index}`}
              accessible={false}
              hitSlop={CHAR_HIT_SLOP}
              onPress={() => onCursor(cursor + index)}
              style={styles.character}
            >
              <Text style={[styles.characterText, { color: theme.textPrimary, fontSize }]}>
                {character}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessible={false}
            onPress={() => onCursor(value.length)}
            style={styles.trailingSpacer}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
  },
  leadingSpacer: {
    alignSelf: 'stretch',
  },
  character: {
    justifyContent: 'center',
  },
  characterText: {
    fontWeight: '500',
    includeFontPadding: false,
  },
  cursor: {
    width: CURSOR_WIDTH,
    marginHorizontal: CURSOR_MARGIN,
    borderRadius: CURSOR_WIDTH / 2,
  },
  trailingSpacer: {
    width: SPACER_WIDTH,
    alignSelf: 'stretch',
  },
});
