export function factorial(n: number): number | null {
  if (!Number.isInteger(n) || n < 0) {
    return null;
  }
  if (n > 170) {
    return null;
  }
  if (n === 0 || n === 1) {
    return 1;
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}
