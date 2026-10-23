/**
 * Renders mathematical expressions onto an HTML Canvas and exports as a PNG data URL.
 * Produces crisp, hand-drawn Virgil styled fractions, roots, and multi-digit power equations.
 */

export function cleanMathSymbols(str: string): string {
  let s = str;
  s = s.replace(/\bpi\b/gi, 'π');
  s = s.replace(/\btheta\b/gi, 'θ');
  s = s.replace(/\balpha\b/gi, 'α');
  s = s.replace(/\bbeta\b/gi, 'β');
  s = s.replace(/\bgamma\b/gi, 'γ');
  s = s.replace(/\bdelta\b/gi, 'δ');
  s = s.replace(/\blambda\b/gi, 'λ');
  s = s.replace(/\bsigma\b/gi, 'σ');
  s = s.replace(/\bomega\b/gi, 'ω');
  s = s.replace(/\s*\*\s*/g, ' · ');
  s = s.replace(/<=/g, '≤');
  s = s.replace(/>=/g, '≥');
  s = s.replace(/!=/g, '≠');
  s = s.replace(/\+-/g, '±');
  s = s.replace(/\binfty\b/gi, '∞');
  s = s.replace(/\binf\b/gi, '∞');
  s = s.replace(/\bapprox\b/gi, '≈');
  return s;
}

export interface MathToken {
  text: string;
  type: 'normal' | 'sup' | 'sub';
}

export function parseFormattedTokens(input: string): MathToken[] {
  let s = cleanMathSymbols(input.trim());
  const tokens: MathToken[] = [];
  const regex = /(\^|_)(\([^()]+\)|[0-9a-zA-Z+-]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(s)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: s.slice(lastIndex, match.index), type: 'normal' });
    }
    const indicator = match[1];
    let content = match[2];
    if (content.startsWith('(') && content.endsWith(')')) {
      content = content.slice(1, -1);
    }
    tokens.push({
      text: content,
      type: indicator === '^' ? 'sup' : 'sub',
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < s.length) {
    tokens.push({ text: s.slice(lastIndex), type: 'normal' });
  }

  return tokens;
}

function measureTokensWidth(
  ctx: CanvasRenderingContext2D,
  tokens: MathToken[],
  baseFontSize: number,
  fontBase: string
): number {
  const baseFont = `${baseFontSize}px ${fontBase}`;
  const subSupFont = `${Math.round(baseFontSize * 0.62)}px ${fontBase}`;
  let width = 0;
  for (const t of tokens) {
    ctx.font = t.type === 'normal' ? baseFont : subSupFont;
    width += ctx.measureText(t.text).width;
  }
  return width;
}

function renderTokens(
  ctx: CanvasRenderingContext2D,
  tokens: MathToken[],
  startX: number,
  baselineY: number,
  baseFontSize: number,
  fontBase: string
): number {
  const baseFont = `${baseFontSize}px ${fontBase}`;
  const subSupFont = `${Math.round(baseFontSize * 0.62)}px ${fontBase}`;
  const supOffset = Math.round(baseFontSize * 0.54);
  const subOffset = Math.round(baseFontSize * 0.22);

  let curX = startX;
  for (const t of tokens) {
    if (t.type === 'sup') {
      ctx.font = subSupFont;
      ctx.fillText(t.text, curX, baselineY - supOffset);
      curX += ctx.measureText(t.text).width;
    } else if (t.type === 'sub') {
      ctx.font = subSupFont;
      ctx.fillText(t.text, curX, baselineY + subOffset);
      curX += ctx.measureText(t.text).width;
    } else {
      ctx.font = baseFont;
      ctx.fillText(t.text, curX, baselineY);
      curX += ctx.measureText(t.text).width;
    }
  }
  return curX;
}

export interface LineElement {
  type: 'text' | 'fraction' | 'root';
  content?: string;
  num?: string;
  den?: string;
  inner?: string;
}

function hasEnclosingParens(s: string): boolean {
  const str = s.trim();
  if (!str.startsWith('(') || !str.endsWith(')')) return false;
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') {
      depth--;
      if (depth === 0 && i < str.length - 1) return false;
    }
  }
  return depth === 0;
}

export function stripOuterGroupingParens(s: string): string {
  const str = s.trim();
  if (hasEnclosingParens(str)) {
    return str.slice(1, -1).trim();
  }
  return str;
}

function findMatchingOpenParen(str: string, closeIndex: number): number {
  let depth = 0;
  for (let i = closeIndex; i >= 0; i--) {
    if (str[i] === ')') depth++;
    else if (str[i] === '(') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findMatchingCloseParen(str: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function parseLineElements(input: string): LineElement[] {
  const elements: LineElement[] = [];
  const str = input;
  
  // 1. Find all fractions using parenthesis-balanced matching
  const fractions: { start: number; end: number; num: string; den: string }[] = [];
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '/') {
      // Find numerator before i
      let numEnd = i - 1;
      while (numEnd >= 0 && str[numEnd] === ' ') numEnd--;
      if (numEnd < 0) continue;
      
      let numStart = numEnd;
      if (str[numEnd] === ')') {
        numStart = findMatchingOpenParen(str, numEnd);
        if (numStart === -1) continue;
        while (numStart > 0) {
          let prev = numStart - 1;
          while (prev >= 0 && str[prev] === ' ') prev--;
          if (prev >= 0 && str[prev] === ')') {
            const chainStart = findMatchingOpenParen(str, prev);
            if (chainStart !== -1) {
              numStart = chainStart;
              continue;
            }
          } else if (prev >= 0 && /[0-9a-zA-Z^]/.test(str[prev])) {
            let wordStart = prev;
            while (wordStart > 0 && /[0-9a-zA-Z^]/.test(str[wordStart - 1])) wordStart--;
            numStart = wordStart;
            continue;
          }
          break;
        }
      } else {
        while (numStart > 0 && /[0-9a-zA-Z^]/.test(str[numStart - 1])) {
          numStart--;
        }
      }
      
      // Find denominator after i
      let denStart = i + 1;
      while (denStart < str.length && str[denStart] === ' ') denStart++;
      if (denStart >= str.length) continue;
      
      let denEnd = denStart;
      if (str[denStart] === '(') {
        denEnd = findMatchingCloseParen(str, denStart);
        if (denEnd === -1) continue;
      } else {
        while (denEnd < str.length - 1 && /[0-9a-zA-Z^]/.test(str[denEnd + 1])) {
          denEnd++;
        }
      }
      
      let num = str.slice(numStart, numEnd + 1);
      let den = str.slice(denStart, denEnd + 1);
      num = stripOuterGroupingParens(num);
      den = stripOuterGroupingParens(den);
      fractions.push({ start: numStart, end: denEnd + 1, num, den });
    }
  }
  
  if (fractions.length === 0) {
    // Check for sqrt
    const rootRegex = /sqrt\(([^()]+(?:\([^()]*\)[^()]*)*)\)|sqrt\s*([0-9a-zA-Z^]+)/gi;
    let lastIdx = 0;
    let m;
    while ((m = rootRegex.exec(str)) !== null) {
      if (m.index > lastIdx) {
        elements.push({ type: 'text', content: str.slice(lastIdx, m.index) });
      }
      elements.push({ type: 'root', inner: m[1] || m[2] || '' });
      lastIdx = rootRegex.lastIndex;
    }
    if (lastIdx < str.length) {
      elements.push({ type: 'text', content: str.slice(lastIdx) });
    }
    return elements;
  }
  
  // Reconstruct line with fractions
  let lastIdx = 0;
  for (const f of fractions) {
    if (f.start > lastIdx) {
      elements.push({ type: 'text', content: str.slice(lastIdx, f.start) });
    }
    elements.push({ type: 'fraction', num: f.num, den: f.den });
    lastIdx = f.end;
  }
  if (lastIdx < str.length) {
    elements.push({ type: 'text', content: str.slice(lastIdx) });
  }
  
  return elements;
}

export function renderMathToImage(
  rawInput: string,
  color: string = '#1e1e1e',
  fontSize: number = 38
): { dataUrl: string; width: number; height: number } | null {
  if (typeof document === 'undefined') return null;

  const s = rawInput.trim();
  const fontBase = "Virgil, 'Segoe UI', cursive, sans-serif";

  const elements = parseLineElements(s);
  if (elements.length === 0) return null;

  // Check if there is actual math in the elements
  const hasFraction = elements.some(e => e.type === 'fraction');
  const hasRoot = elements.some(e => e.type === 'root');
  const hasExpOrSymbols = elements.some(e => {
    if (e.type === 'text') {
      const tokens = parseFormattedTokens(e.content || '');
      return tokens.some(t => t.type !== 'normal') || cleanMathSymbols(e.content || '') !== e.content;
    }
    return false;
  });

  if (!hasFraction && !hasRoot && !hasExpOrSymbols) {
    return null;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const currentFontSize = fontSize;
  const totalH = hasFraction ? Math.ceil(currentFontSize * 2.3) : Math.ceil(currentFontSize * 1.85);
  const lineY = Math.round(totalH / 2);
  const baselineY = hasFraction ? Math.round(lineY + currentFontSize * 0.35) : Math.round(totalH * 0.72);

  interface MeasuredElement {
    el: LineElement;
    width: number;
    numW?: number;
    denW?: number;
    numTokens?: MathToken[];
    denTokens?: MathToken[];
    tokens?: MathToken[];
    innerTokens?: MathToken[];
  }

  const measured: MeasuredElement[] = [];
  let totalContentW = 0;

  for (const el of elements) {
    if (el.type === 'text') {
      const tokens = parseFormattedTokens(el.content || '');
      const width = measureTokensWidth(ctx, tokens, currentFontSize, fontBase);
      measured.push({ el, width, tokens });
      totalContentW += width;
    } else if (el.type === 'fraction') {
      const numTokens = parseFormattedTokens((el.num || '').trim());
      const denTokens = parseFormattedTokens((el.den || '').trim());
      const fracFont = Math.round(currentFontSize * 0.88);
      const numW = measureTokensWidth(ctx, numTokens, fracFont, fontBase);
      const denW = measureTokensWidth(ctx, denTokens, fracFont, fontBase);
      const fracContentW = Math.max(numW, denW);
      const fracPadX = 6;
      const width = Math.max(34, fracContentW + fracPadX * 2);
      measured.push({ el, width, numW, denW, numTokens, denTokens });
      totalContentW += width;
    } else if (el.type === 'root') {
      const innerTokens = parseFormattedTokens((el.inner || '').trim());
      const innerW = measureTokensWidth(ctx, innerTokens, currentFontSize, fontBase);
      const rootSymbolW = 34;
      const width = rootSymbolW + innerW + 12;
      measured.push({ el, width, innerTokens });
      totalContentW += width;
    }
  }

  const padX = 14;
  const totalW = Math.max(60, Math.ceil(totalContentW + padX * 2));

  canvas.width = totalW * 2;
  canvas.height = totalH * 2;
  ctx.scale(2, 2);

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.textBaseline = 'alphabetic';

  let curX = padX;
  for (const m of measured) {
    if (m.el.type === 'text' && m.tokens) {
      renderTokens(ctx, m.tokens, curX, baselineY, currentFontSize, fontBase);
      curX += m.width;
    } else if (m.el.type === 'fraction' && m.numTokens && m.denTokens && m.numW !== undefined && m.denW !== undefined) {
      const fracFont = Math.round(currentFontSize * 0.88);
      const numBaseline = Math.round(lineY - 8);
      const denBaseline = Math.round(lineY + Math.round(fracFont * 0.95));

      const numStartX = Math.round(curX + (m.width - m.numW) / 2);
      const denStartX = Math.round(curX + (m.width - m.denW) / 2);

      renderTokens(ctx, m.numTokens, numStartX, numBaseline, fracFont, fontBase);

      // Division bar
      ctx.beginPath();
      ctx.moveTo(curX + 2, lineY);
      ctx.lineTo(curX + m.width - 2, lineY);
      ctx.stroke();

      renderTokens(ctx, m.denTokens, denStartX, denBaseline, fracFont, fontBase);
      curX += m.width;
    } else if (m.el.type === 'root' && m.innerTokens) {
      const rootSymbolW = 34;
      const topY = hasFraction ? Math.round(lineY - currentFontSize * 0.72) : 10;
      const botY = hasFraction ? Math.round(lineY + currentFontSize * 0.72) : totalH - 12;
      const rootBaseline = hasFraction ? baselineY : Math.round(totalH * 0.72);

      ctx.beginPath();
      ctx.moveTo(curX + 4, botY - 14);
      ctx.lineTo(curX + 14, botY);
      ctx.lineTo(curX + 26, topY);
      ctx.lineTo(curX + m.width - 4, topY);
      ctx.stroke();

      renderTokens(ctx, m.innerTokens, curX + rootSymbolW, rootBaseline, currentFontSize, fontBase);
      curX += m.width;
    }
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: totalW,
    height: totalH,
  };
}
