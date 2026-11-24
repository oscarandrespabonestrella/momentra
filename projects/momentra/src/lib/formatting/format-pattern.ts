import type { MomentraLocale } from '../localization/locale';

/**
 * Library-independent date/time parts. Months are zero-based (0 = January), matching `Date`.
 * All adapters format and parse through these parts so behaviour is identical across adapters.
 */
export interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

/** Subset of {@link MomentraLocale} needed to format and parse patterns. */
export type PatternLocale = Pick<
  MomentraLocale,
  'monthNames' | 'monthNamesShort' | 'weekdayNames' | 'weekdayNamesShort' | 'meridiem'
>;

/** Thrown when a format pattern contains an unsupported token. */
export class MomentraPatternError extends Error {
  constructor(pattern: string, detail: string) {
    super(`Invalid Momentra pattern "${pattern}": ${detail}`);
    this.name = 'MomentraPatternError';
  }
}

type TokenKind = 'literal' | 'year' | 'month' | 'day' | 'weekday' | 'hour24' | 'hour12' | 'minute' | 'second' | 'millisecond' | 'meridiem';

interface Token {
  kind: TokenKind;
  /** Literal text, or the run of identical pattern letters for a field token. */
  text: string;
}

const FIELD_LETTERS: Record<string, { kind: TokenKind; maxLength: number }> = {
  y: { kind: 'year', maxLength: 4 },
  M: { kind: 'month', maxLength: 4 },
  d: { kind: 'day', maxLength: 2 },
  E: { kind: 'weekday', maxLength: 4 },
  H: { kind: 'hour24', maxLength: 2 },
  h: { kind: 'hour12', maxLength: 2 },
  m: { kind: 'minute', maxLength: 2 },
  s: { kind: 'second', maxLength: 2 },
  S: { kind: 'millisecond', maxLength: 3 },
  a: { kind: 'meridiem', maxLength: 1 },
};

const tokenCache = new Map<string, readonly Token[]>();

/**
 * Splits a pattern into tokens. Supported letters: `y M d E H h m s S a`.
 * Text in single quotes is literal (`''` is a quote); any other non-letter is literal.
 */
export function tokenizePattern(pattern: string): readonly Token[] {
  const cached = tokenCache.get(pattern);
  if (cached) {
    return cached;
  }
  const tokens: Token[] = [];
  let i = 0;
  const pushLiteral = (text: string) => {
    const last = tokens[tokens.length - 1];
    if (last?.kind === 'literal') {
      last.text += text;
    } else {
      tokens.push({ kind: 'literal', text });
    }
  };
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "'") {
      if (pattern[i + 1] === "'") {
        pushLiteral("'");
        i += 2;
        continue;
      }
      let j = i + 1;
      let text = '';
      while (j < pattern.length) {
        if (pattern[j] === "'") {
          if (pattern[j + 1] === "'") {
            text += "'";
            j += 2;
            continue;
          }
          break;
        }
        text += pattern[j++];
      }
      if (j >= pattern.length) {
        throw new MomentraPatternError(pattern, 'unterminated quoted literal');
      }
      pushLiteral(text);
      i = j + 1;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      const field = FIELD_LETTERS[ch];
      if (!field) {
        throw new MomentraPatternError(pattern, `unsupported letter "${ch}" (quote it to use it literally)`);
      }
      let j = i;
      while (pattern[j] === ch) {
        j++;
      }
      const run = j - i;
      if (run > field.maxLength) {
        throw new MomentraPatternError(pattern, `"${ch.repeat(run)}" is too long`);
      }
      tokens.push({ kind: field.kind, text: ch.repeat(run) });
      i = j;
      continue;
    }
    pushLiteral(ch);
    i++;
  }
  tokenCache.set(pattern, tokens);
  return tokens;
}

const pad = (value: number, length: number) => String(Math.abs(value)).padStart(length, '0');

/** Day of week (0 = Sunday) of a proleptic Gregorian date, independent of any time zone. */
export function dayOfWeekOf(year: number, month: number, day: number): number {
  const d = new Date(Date.UTC(2000, month, day));
  d.setUTCFullYear(year);
  return d.getUTCDay();
}

/** Formats parts using a Momentra pattern, e.g. `dd/MM/yyyy HH:mm`. */
export function formatParts(parts: DateTimeParts, pattern: string, locale: PatternLocale): string {
  let out = '';
  for (const token of tokenizePattern(pattern)) {
    const n = token.text.length;
    switch (token.kind) {
      case 'literal':
        out += token.text;
        break;
      case 'year':
        out += n === 2 ? pad(parts.year % 100, 2) : n === 1 ? String(parts.year) : pad(parts.year, 4);
        break;
      case 'month':
        out +=
          n >= 4
            ? locale.monthNames[parts.month]
            : n === 3
              ? locale.monthNamesShort[parts.month]
              : pad(parts.month + 1, n);
        break;
      case 'day':
        out += pad(parts.day, n);
        break;
      case 'weekday': {
        const weekday = dayOfWeekOf(parts.year, parts.month, parts.day);
        out += n >= 4 ? locale.weekdayNames[weekday] : locale.weekdayNamesShort[weekday];
        break;
      }
      case 'hour24':
        out += pad(parts.hours, n);
        break;
      case 'hour12':
        out += pad(parts.hours % 12 === 0 ? 12 : parts.hours % 12, n);
        break;
      case 'minute':
        out += pad(parts.minutes, n);
        break;
      case 'second':
        out += pad(parts.seconds, n);
        break;
      case 'millisecond':
        out += pad(parts.milliseconds, 3);
        break;
      case 'meridiem':
        out += parts.hours < 12 ? locale.meridiem.am : locale.meridiem.pm;
        break;
    }
  }
  return out;
}

const NUMERIC_KINDS: ReadonlySet<TokenKind> = new Set([
  'year', 'day', 'hour24', 'hour12', 'minute', 'second', 'millisecond',
]);

function isNumericToken(token: Token | undefined): boolean {
  if (!token) {
    return false;
  }
  return NUMERIC_KINDS.has(token.kind) || (token.kind === 'month' && token.text.length <= 2);
}

/** Result of {@link parseParts}: fields absent from the pattern are `undefined`. */
export interface ParsedParts {
  year?: number;
  month?: number;
  day?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

function matchName(text: string, at: number, names: readonly string[]): { index: number; length: number } | null {
  const rest = text.slice(at).toLocaleLowerCase();
  let best: { index: number; length: number } | null = null;
  names.forEach((name, index) => {
    const lower = name.toLocaleLowerCase();
    if (lower.length > 0 && rest.startsWith(lower) && (!best || lower.length > best.length)) {
      best = { index, length: lower.length };
    }
  });
  return best;
}

/**
 * Parses text strictly against a pattern. Returns `null` when the text does not match, a numeric
 * field is out of range (month 13, hour 25, …) or the whole input is not consumed. Day-of-month
 * validity against the month is checked by the adapter when it builds the date.
 */
export function parseParts(text: string, pattern: string, locale: PatternLocale): ParsedParts | null {
  const tokens = tokenizePattern(pattern);
  const input = text.trim();
  const result: ParsedParts = {};
  let pos = 0;
  let meridiem: 'am' | 'pm' | null = null;
  let hour12: number | undefined;

  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t];
    const n = token.text.length;
    if (token.kind === 'literal') {
      const lit = token.text;
      if (input.slice(pos, pos + lit.length).toLocaleLowerCase() !== lit.toLocaleLowerCase()) {
        return null;
      }
      pos += lit.length;
      continue;
    }
    if (token.kind === 'weekday') {
      const m = matchName(input, pos, n >= 4 ? locale.weekdayNames : locale.weekdayNamesShort);
      if (!m) {
        return null;
      }
      pos += m.length;
      continue;
    }
    if (token.kind === 'meridiem') {
      const m = matchName(input, pos, [locale.meridiem.am, locale.meridiem.pm]);
      if (!m) {
        return null;
      }
      meridiem = m.index === 0 ? 'am' : 'pm';
      pos += m.length;
      continue;
    }
    if (token.kind === 'month' && n >= 3) {
      const m = matchName(input, pos, n >= 4 ? locale.monthNames : locale.monthNamesShort);
      if (!m) {
        return null;
      }
      result.month = m.index;
      pos += m.length;
      continue;
    }

    // Numeric field. Adjacent numeric tokens (e.g. `yyyyMMdd`) need fixed widths.
    const adjacentNumeric = isNumericToken(tokens[t + 1]);
    let minDigits: number;
    let maxDigits: number;
    if (token.kind === 'year') {
      minDigits = n === 1 ? 1 : n;
      maxDigits = n === 1 ? 6 : n;
    } else if (token.kind === 'millisecond') {
      minDigits = 3;
      maxDigits = 3;
    } else {
      minDigits = adjacentNumeric ? n : 1;
      maxDigits = 2;
    }
    let digits = '';
    while (digits.length < maxDigits && /[0-9]/.test(input[pos] ?? '')) {
      digits += input[pos++];
    }
    if (digits.length === 0 || digits.length < minDigits) {
      return null;
    }
    let value = Number(digits);
    switch (token.kind) {
      case 'year':
        if (n === 2) {
          value += value < 70 ? 2000 : 1900;
        }
        result.year = value;
        break;
      case 'month':
        if (value < 1 || value > 12) {
          return null;
        }
        result.month = value - 1;
        break;
      case 'day':
        if (value < 1 || value > 31) {
          return null;
        }
        result.day = value;
        break;
      case 'hour24':
        if (value > 23) {
          return null;
        }
        result.hours = value;
        break;
      case 'hour12':
        if (value < 1 || value > 12) {
          return null;
        }
        hour12 = value % 12;
        break;
      case 'minute':
        if (value > 59) {
          return null;
        }
        result.minutes = value;
        break;
      case 'second':
        if (value > 59) {
          return null;
        }
        result.seconds = value;
        break;
      case 'millisecond':
        result.milliseconds = value;
        break;
    }
  }
  if (pos !== input.length) {
    return null;
  }
  if (hour12 !== undefined) {
    if (meridiem === null && tokens.some((tk) => tk.kind === 'meridiem')) {
      return null;
    }
    result.hours = hour12 + (meridiem === 'pm' ? 12 : 0);
  } else if (meridiem !== null && result.hours !== undefined) {
    // 24-hour field plus meridiem: only consistent combinations are accepted.
    if ((meridiem === 'pm') !== result.hours >= 12) {
      return null;
    }
  }
  return result;
}

/** `true` when the pattern shows hours on a 12-hour clock (`h`/`hh`). */
export function patternUses12Hours(pattern: string): boolean {
  return tokenizePattern(pattern).some((t) => t.kind === 'hour12');
}

/** `true` when the pattern includes seconds (`s`/`ss`). */
export function patternHasSeconds(pattern: string): boolean {
  return tokenizePattern(pattern).some((t) => t.kind === 'second');
}

/** `true` when the pattern includes any time field. */
export function patternHasTime(pattern: string): boolean {
  return tokenizePattern(pattern).some((t) =>
    ['hour24', 'hour12', 'minute', 'second', 'millisecond', 'meridiem'].includes(t.kind),
  );
}
