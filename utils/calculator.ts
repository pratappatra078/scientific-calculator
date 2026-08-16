import { factorial } from './factorial';

type TokenType =
  | 'number'
  | 'plus'
  | 'minus'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'lparen'
  | 'rparen'
  | 'factorial'
  | 'square'
  | 'percent'
  | 'sqrt'
  | 'sin'
  | 'cos'
  | 'tan'
  | 'log'
  | 'ln'
  | 'pi'
  | 'e';

type Token = { type: TokenType; value?: number };

const FUNC_NAMES = new Set<TokenType>(['sin', 'cos', 'tan', 'log', 'ln']);

const SIMPLE_TOKENS: Record<string, TokenType> = {
  '+': 'plus',
  '−': 'minus',
  '×': 'multiply',
  '÷': 'divide',
  '^': 'power',
  '(': 'lparen',
  ')': 'rparen',
  '!': 'factorial',
  '²': 'square',
  '%': 'percent',
  '√': 'sqrt',
  'π': 'pi',
  e: 'e',
};

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === ' ') {
      i++;
      continue;
    }

    if (/[0-9]/.test(ch) || ch === '.') {
      const match = input.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!match) {
        return null;
      }
      const value = Number(match[0]);
      if (!Number.isFinite(value)) {
        return null;
      }
      tokens.push({ type: 'number', value });
      i += match[0].length;
      continue;
    }

    if (/[a-z]/.test(ch)) {
      const match = input.slice(i).match(/^[a-z]+/);
      if (!match) {
        return null;
      }
      const word = match[0];
      if (word === 'e') {
        tokens.push({ type: 'e' });
      } else if (FUNC_NAMES.has(word as TokenType)) {
        tokens.push({ type: word as TokenType });
      } else {
        return null;
      }
      i += word.length;
      continue;
    }

    const type = SIMPLE_TOKENS[ch];
    if (!type) {
      return null;
    }
    tokens.push({ type });
    i++;
  }

  return tokens;
}

type Stream = { tokens: Token[]; index: number };

function peek(stream: Stream): Token | undefined {
  return stream.tokens[stream.index];
}

function next(stream: Stream): Token | undefined {
  const token = stream.tokens[stream.index];
  if (token) {
    stream.index++;
  }
  return token;
}

function parseExpression(stream: Stream): number | null {
  const left = parseTerm(stream);
  if (left === null) {
    return null;
  }

  let value = left;
  while (peek(stream)?.type === 'plus' || peek(stream)?.type === 'minus') {
    const op = next(stream)!;
    const right = parseTerm(stream);
    if (right === null) {
      return null;
    }
    value = op.type === 'plus' ? value + right : value - right;
  }
  return value;
}

function parseTerm(stream: Stream): number | null {
  const left = parsePower(stream);
  if (left === null) {
    return null;
  }

  let value = left;
  while (peek(stream)?.type === 'multiply' || peek(stream)?.type === 'divide') {
    const op = next(stream)!;
    const right = parsePower(stream);
    if (right === null) {
      return null;
    }
    if (op.type === 'divide') {
      if (right === 0) {
        return null;
      }
      value = value / right;
    } else {
      value = value * right;
    }
  }
  return value;
}

function parsePower(stream: Stream): number | null {
  const left = parseUnary(stream);
  if (left === null) {
    return null;
  }

  if (peek(stream)?.type === 'power') {
    next(stream);
    const right = parsePower(stream);
    if (right === null) {
      return null;
    }
    return Math.pow(left, right);
  }
  return left;
}

function applyFunction(kind: TokenType, arg: number): number | null {
  switch (kind) {
    case 'sqrt':
      return arg < 0 ? null : Math.sqrt(arg);
    case 'sin':
      return Math.sin((arg * Math.PI) / 180);
    case 'cos':
      return Math.cos((arg * Math.PI) / 180);
    case 'tan':
      return Math.tan((arg * Math.PI) / 180);
    case 'log':
      return Math.log10(arg);
    case 'ln':
      return Math.log(arg);
    default:
      return null;
  }
}

function parseUnary(stream: Stream): number | null {
  const token = peek(stream);

  if (token?.type === 'minus') {
    next(stream);
    const value = parseUnary(stream);
    return value === null ? null : -value;
  }

  if (token?.type === 'sqrt' || (token?.type && FUNC_NAMES.has(token.type))) {
    next(stream);
    const arg = parseUnary(stream);
    if (arg === null) {
      return null;
    }
    return applyFunction(token.type, arg);
  }

  return parsePostfix(stream);
}

function parsePostfix(stream: Stream): number | null {
  let value = parsePrimary(stream);
  if (value === null) {
    return null;
  }

  while (
    peek(stream)?.type === 'factorial' ||
    peek(stream)?.type === 'square' ||
    peek(stream)?.type === 'percent'
  ) {
    const op = next(stream)!;
    if (op.type === 'factorial') {
      value = factorial(value);
      if (value === null) {
        return null;
      }
    } else if (op.type === 'square') {
      value = value * value;
    } else {
      value = value / 100;
    }
  }
  return value;
}

function parsePrimary(stream: Stream): number | null {
  const token = next(stream);
  if (!token) {
    return null;
  }

  if (token.type === 'number') {
    return token.value ?? null;
  }
  if (token.type === 'pi') {
    return Math.PI;
  }
  if (token.type === 'e') {
    return Math.E;
  }
  if (token.type === 'lparen') {
    const value = parseExpression(stream);
    if (value === null) {
      return null;
    }
    if (next(stream)?.type !== 'rparen') {
      return null;
    }
    return value;
  }
  return null;
}

function parse(tokens: Token[]): number | null {
  const stream: Stream = { tokens, index: 0 };
  const value = parseExpression(stream);
  if (value === null || stream.index !== tokens.length) {
    return null;
  }
  return Number.isFinite(value) ? value : null;
}

export function autoclose(expression: string): string {
  let open = 0;
  for (const ch of expression) {
    if (ch === '(') {
      open++;
    } else if (ch === ')') {
      open = Math.max(0, open - 1);
    }
  }
  return open > 0 ? expression + ')'.repeat(open) : expression;
}

export function evaluate(expression: string): number | null {
  const tokens = tokenize(expression);
  if (!tokens) {
    return null;
  }
  return parse(tokens);
}

function trimTrailingZeros(mantissa: string): string {
  return mantissa.replace(/\.?0+$/, '');
}

function normalizeExponent(exponent: string): string {
  if (exponent.startsWith('-')) {
    return `−${exponent.slice(1)}`;
  }
  return exponent.replace(/^\+/, '');
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Error';
  }
  if (value === 0) {
    return '0';
  }

  const abs = Math.abs(value);

  if (Number.isInteger(value) && abs < 1e16) {
    return String(value);
  }

  const rounded = Number(value.toPrecision(12));
  if (rounded === 0) {
    return '0';
  }

  if (Math.abs(rounded) >= 1e16 || Math.abs(rounded) < 1e-6) {
    const [mantissa, exponent] = rounded.toExponential(8).split('e');
    return `${trimTrailingZeros(mantissa)}×10^${normalizeExponent(exponent)}`;
  }

  return String(rounded);
}
