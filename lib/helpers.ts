export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeText(input: string) {
  return input.trim().toLowerCase();
}

const KOREAN_PARTICLES = [
  "으로", "에서", "부터", "까지", "처럼", "만큼",
  "에게", "한테", "께서",
  "은", "는", "이", "가", "을", "를", "의", "에",
  "와", "과", "로", "도", "만", "며", "고"
];

export function removeParticles(word: string): string {
  for (const p of KOREAN_PARTICLES) {
    if (word.length > p.length + 1 && word.endsWith(p)) {
      return word.slice(0, -p.length);
    }
  }
  return word;
}

export function tokenize(input: string) {
  return normalizeText(input)
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .flatMap((token) => {
      const stripped = removeParticles(token);
      return stripped !== token ? [token, stripped] : [token];
    });
}
