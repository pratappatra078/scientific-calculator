import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import ExpressionEditor from '@/components/ExpressionEditor';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  cursor: number;
  onCursor: (index: number) => void;
  result: string | null;
};

export default function CalculatorDisplay({ value, cursor, onCursor, result }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const expressionSize = Math.min(44, Math.max(34, width * 0.1));
  const resultSize = Math.min(32, Math.max(24, width * 0.075));
  const isError = result === 'Error';

  return (
    <View style={styles.container}>
      <ExpressionEditor value={value} cursor={cursor} onCursor={onCursor} fontSize={expressionSize} />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.result,
          { color: isError ? theme.errorText : theme.accent, fontSize: resultSize },
        ]}
      >
        {result === null ? '' : isError ? 'Error' : `=${result}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  result: {
    width: '100%',
    textAlign: 'right',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
