import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import CalculatorButton from '@/components/CalculatorButton';
import CalculatorDisplay from '@/components/CalculatorDisplay';
import HistoryModal, { type HistoryEntry } from '@/components/HistoryModal';
import IconButton from '@/components/IconButton';
import InfoModal from '@/components/InfoModal';
import { darkTheme, lightTheme } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme';
import { autoclose, evaluate, formatNumber } from '@/utils/calculator';

const STORAGE_KEY = '@pratap-calculator/history';
const H_PAD = 20;
const GAP = 12;
const MAX_HISTORY = 50;

const OPERATORS = '+-×÷';
const MULT_PRECEDING = ')πe!%²';

const KEYPAD_ROWS: string[][] = [
  ['C', '%', '÷', '⌫'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['00', '0', '.', '='],
];

const KEYPAD_LABELS: Record<string, string> = {
  C: 'Clear',
  '%': 'Percent',
  '÷': 'Divide',
  '⌫': 'Backspace',
  '×': 'Multiply',
  '−': 'Subtract',
  '+': 'Add',
  '.': 'Decimal point',
  '00': 'Double zero',
  '=': 'Calculate result',
};

function variantFor(label: string): 'number' | 'operator' | 'equals' {
  if (label === '=') {
    return 'equals';
  }
  if (OPERATORS.includes(label) || label === 'C' || label === '%' || label === '⌫') {
    return 'operator';
  }
  return 'number';
}

function leadingZeroStart(expression: string, position: number): number {
  if (position <= 0) {
    return -1;
  }
  let i = position - 1;
  while (i >= 0 && expression[i] === '0') {
    i--;
  }
  if (i === position - 1) {
    return -1;
  }
  if (i >= 0 && /[0-9.]/.test(expression[i])) {
    return -1;
  }
  return i + 1;
}

function trailingNumberAt(expression: string, position: number): string {
  let i = position - 1;
  while (i >= 0 && /[0-9.]/.test(expression[i])) {
    i--;
  }
  return expression.slice(i + 1, position);
}

function isOperandChar(character: string | undefined): boolean {
  return character !== undefined && (/[0-9]/.test(character) || MULT_PRECEDING.includes(character));
}

export default function CalculatorScreen() {
  const mode = useThemeMode();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [expression, setExpression] = useState('');
  const [cursor, setCursor] = useState(0);
  const [displayExpression, setDisplayExpression] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [lastRaw, setLastRaw] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [infoVisible, setInfoVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const availHeight =
    height - insets.top - insets.bottom - 56 /* header */ - 120 /* display */ - 16;
  const rowsTotal = KEYPAD_ROWS.length;
  const byHeight = (availHeight - (rowsTotal - 1) * GAP) / rowsTotal;
  const byWidth = (width - H_PAD * 2 - GAP * 3) / 4;
  const buttonSize = Math.max(48, Math.min(84, byWidth, byHeight));
  const keypadWidth = buttonSize * 4 + GAP * 3;
  const keypadFontSize = Math.min(30, Math.max(24, width * 0.07));

  const backgroundAnimation = useRef(new Animated.Value(mode === 'dark' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(backgroundAnimation, {
      toValue: mode === 'dark' ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [mode, backgroundAnimation]);

  const backgroundColor = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [lightTheme.background, darkTheme.background],
  });

  useEffect(() => {
    if (justEvaluated) {
      return;
    }
    if (expression === '') {
      setResult(null);
      return;
    }
    const value = evaluate(autoclose(expression));
    setResult(value === null ? null : formatNumber(value));
  }, [expression, justEvaluated]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted || !raw) {
          return;
        }
        try {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const entries = parsed.filter(
              (entry): entry is HistoryEntry =>
                entry !== null &&
                typeof entry === 'object' &&
                typeof (entry as HistoryEntry).id === 'string' &&
                typeof (entry as HistoryEntry).expression === 'string' &&
                typeof (entry as HistoryEntry).result === 'string',
            );
            setHistory(entries.slice(0, MAX_HISTORY));
          }
        } catch {
          // Ignore corrupt storage data.
        }
      })
      .catch(() => {
        // Ignore storage read failures.
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history)).catch(() => {
      // Ignore storage write failures.
    });
  }, [history]);

  function resetAll() {
    setExpression('');
    setCursor(0);
    setDisplayExpression('');
    setResult(null);
    setJustEvaluated(false);
  }

  function addHistory(entryExpression: string, entryResult: string) {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      expression: entryExpression,
      result: entryResult,
    };
    setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
  }

  function clearHistory() {
    setHistory([]);
  }

  function selectHistory(entry: HistoryEntry) {
    setHistoryVisible(false);
    setJustEvaluated(false);
    setDisplayExpression('');
    setExpression(entry.expression);
    setCursor(entry.expression.length);
  }

  function commit(nextExpression: string, nextCursor: number) {
    setExpression(nextExpression);
    setCursor(nextCursor);
  }

  function beginEdit(): { base: string; position: number } | null {
    if (!justEvaluated) {
      return { base: expression, position: cursor };
    }
    if (result === 'Error') {
      resetAll();
      return null;
    }
    setJustEvaluated(false);
    setDisplayExpression('');
    const base = lastRaw;
    return { base, position: base.length };
  }

  function pressDigit(digit: string) {
    let expr = expression;
    let pos = cursor;

    if (justEvaluated) {
      if (result === 'Error') {
        expr = '';
        pos = 0;
      } else {
        expr = lastRaw;
        pos = lastRaw.length;
      }
      setJustEvaluated(false);
      setDisplayExpression('');
    }

    if (/[0-9]/.test(digit)) {
      const start = leadingZeroStart(expr, pos);
      if (start !== -1) {
        commit(expr.slice(0, start) + digit + expr.slice(pos), start + 1);
        return;
      }
    }

    const previous = pos > 0 ? expr[pos - 1] : undefined;
    if (digit === '.') {
      if (trailingNumberAt(expr, pos).includes('.')) {
        return;
      }
      if (previous !== undefined && MULT_PRECEDING.includes(previous)) {
        commit(expr.slice(0, pos) + '×.' + expr.slice(pos), pos + 2);
        return;
      }
      commit(expr.slice(0, pos) + '.' + expr.slice(pos), pos + 1);
      return;
    }

    if (previous !== undefined && MULT_PRECEDING.includes(previous)) {
      commit(expr.slice(0, pos) + '×' + digit + expr.slice(pos), pos + 2);
      return;
    }
    commit(expr.slice(0, pos) + digit + expr.slice(pos), pos + 1);
  }

  function pressDoubleZero() {
    let expr = expression;
    let pos = cursor;

    if (justEvaluated) {
      if (result === 'Error') {
        expr = '';
        pos = 0;
      } else {
        expr = lastRaw;
        pos = lastRaw.length;
      }
      setJustEvaluated(false);
      setDisplayExpression('');
    }

    const start = leadingZeroStart(expr, pos);
    if (start !== -1) {
      commit(expr.slice(0, start) + '00' + expr.slice(pos), start + 2);
      return;
    }

    const previous = pos > 0 ? expr[pos - 1] : undefined;
    if (previous !== undefined && MULT_PRECEDING.includes(previous)) {
      commit(expr.slice(0, pos) + '×00' + expr.slice(pos), pos + 3);
      return;
    }
    commit(expr.slice(0, pos) + '00' + expr.slice(pos), pos + 2);
  }

  function pressOperator(operator: string) {
    const edit = beginEdit();
    if (!edit) {
      return;
    }
    const { base, position } = edit;
    const previous = position > 0 ? base[position - 1] : undefined;
    if (previous === '(') {
      return;
    }
    if (previous !== undefined && OPERATORS.includes(previous)) {
      commit(base.slice(0, position - 1) + operator + base.slice(position), position);
      return;
    }
    commit(base.slice(0, position) + operator + base.slice(position), position + 1);
  }

  function pressPercent() {
    const edit = beginEdit();
    if (!edit) {
      return;
    }
    const { base, position } = edit;
    const previous = position > 0 ? base[position - 1] : undefined;
    if (!isOperandChar(previous)) {
      return;
    }
    commit(base.slice(0, position) + '%' + base.slice(position), position + 1);
  }

  function pressBackspace() {
    if (justEvaluated) {
      const raw = lastRaw;
      setJustEvaluated(false);
      setDisplayExpression('');
      setResult(null);
      if (raw === '') {
        return;
      }
      commit(raw.slice(0, -1), raw.length - 1);
      return;
    }
    if (cursor === 0) {
      return;
    }
    commit(expression.slice(0, cursor - 1) + expression.slice(cursor), cursor - 1);
  }

  function pressEquals() {
    if (justEvaluated) {
      return;
    }
    const raw = expression;
    if (raw === '') {
      return;
    }
    setLastRaw(raw);
    const closed = autoclose(raw);
    const value = evaluate(closed);
    if (value === null) {
      setDisplayExpression(closed);
      setResult('Error');
      setJustEvaluated(true);
      return;
    }
    const formatted = formatNumber(value);
    setDisplayExpression(closed);
    setResult(formatted);
    setJustEvaluated(true);
    commit(formatted, formatted.length);
    addHistory(closed, formatted);
  }

  function handleCursor(index: number) {
    if (justEvaluated) {
      setJustEvaluated(false);
      setDisplayExpression('');
      commit(lastRaw, Math.min(index, lastRaw.length));
      return;
    }
    setCursor(Math.min(index, expression.length));
  }

  function handleKeypad(label: string) {
    switch (label) {
      case 'C':
        resetAll();
        break;
      case '⌫':
        pressBackspace();
        break;
      case '=':
        pressEquals();
        break;
      case '%':
        pressPercent();
        break;
      case '00':
        pressDoubleZero();
        break;
      case '+':
      case '−':
      case '×':
      case '÷':
        pressOperator(label);
        break;
      default:
        pressDigit(label);
        break;
    }
  }

  const editorValue = justEvaluated ? displayExpression : expression;
  const editorCursor = justEvaluated ? displayExpression.length : cursor;

  return (
    <Animated.View style={[styles.screen, { backgroundColor }]}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <IconButton
            name="information-circle-outline"
            onPress={() => setInfoVisible(true)}
            accessibilityLabel="About calculator"
          />
          <View style={styles.headerSpacer} />
          <IconButton
            name="time-outline"
            onPress={() => setHistoryVisible(true)}
            accessibilityLabel="Calculation history"
          />
        </View>

        <CalculatorDisplay
          value={editorValue}
          cursor={editorCursor}
          onCursor={handleCursor}
          result={result}
        />

        <View style={[styles.keypad, { width: keypadWidth }]}>
          {KEYPAD_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((label) => (
                <View key={label} style={{ width: buttonSize, height: buttonSize }}>
                  <CalculatorButton
                    label={label}
                    variant={variantFor(label)}
                    fontSize={keypadFontSize}
                    onPress={() => handleKeypad(label)}
                    accessibilityLabel={KEYPAD_LABELS[label] ?? label}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>

        <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
        <HistoryModal
          visible={historyVisible}
          onClose={() => setHistoryVisible(false)}
          history={history}
          onSelect={selectHistory}
          onClear={clearHistory}
        />
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingTop: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  keypad: {
    alignSelf: 'center',
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GAP,
  },
});
