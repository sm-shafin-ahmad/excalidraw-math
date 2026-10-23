import katex from 'katex';
import { stripOuterGroupingParens } from './nativeMathDrawer';

/**
 * Checks if a string contains mathematical notations that need real math rendering.
 */
export function isMathExpression(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  
  // Square root: sqrt(...) or sqrt x
  if (/sqrt/i.test(t)) return true;
  
  // Powers and Exponents: e.g. x^2, 2^3, x^(n+1), x_1
  if (/\^([0-9+\-=()a-zA-Z]+)/.test(t) || /_([0-9+\-=()a-zA-Z]+)/.test(t)) {
    return true;
  }

  // Fractions: contains / and not a URL, with characters before and after
  if (t.includes('/') && !/^https?:\/\//i.test(t)) {
    const parts = t.split('/');
    if (parts.some((p, i) => i > 0 && p.trim().length > 0 && parts[i - 1].trim().length > 0)) {
      return true;
    }
  }

  return false;
}

/**
 * Converts easy human-friendly math expressions into LaTeX syntax.
 */
export function easyMathToLatex(input: string): string {
  let s = input.trim();
  if (!s) return '';

  const symbolsMap: Record<string, string> = {
    'pi': '\\pi ',
    'alpha': '\\alpha ',
    'beta': '\\beta ',
    'gamma': '\\gamma ',
    'theta': '\\theta ',
    'lambda': '\\lambda ',
    'sigma': '\\sigma ',
    'omega': '\\omega ',
    'delta': '\\delta ',
    'infty': '\\infty ',
    'inf': '\\infty ',
    'approx': '\\approx ',
    '<=': '\\le ',
    '>=': '\\ge ',
    '!=': '\\ne ',
    '+-': '\\pm ',
    '*': ' \\cdot ',
  };

  for (const [sym, latex] of Object.entries(symbolsMap)) {
    if (sym === '*' || sym === '<=' || sym === '>=' || sym === '!=' || sym === '+-') {
      s = s.split(sym).join(latex);
    } else {
      const reg = new RegExp(`\\b${sym}\\b`, 'gi');
      s = s.replace(reg, latex);
    }
  }

  s = s.replace(/sqrt\(([^()]+(?:\([^()]*\)[^()]*)*)\)/gi, (_match, group) => {
    return `\\sqrt{${group}}`;
  });
  s = s.replace(/sqrt\s*([a-zA-Z0-9]+)/gi, (_match, group) => `\\sqrt{${group}}`);

  s = s.replace(/([a-zA-Z0-9]+|\([^()]+\))\^([a-zA-Z0-9+\-()]+)/g, (_match, base, exp) => {
    let cleanExp = exp;
    if (cleanExp.startsWith('(') && cleanExp.endsWith(')')) {
      cleanExp = cleanExp.slice(1, -1);
    }
    return `${base}^{${cleanExp}}`;
  });

  // Convert fractions (even inside larger equations like s = ut + 1/2 at^2, s = (v^2-u^2)/(2a))
  s = s.replace(/(sqrt\([^()]+\)|\([^()]+\)|[0-9a-zA-Z^]+)\s*\/\s*(sqrt\([^()]+\)|\([^()]+\)|[0-9a-zA-Z^]+)/g, (_match, num, den) => {
    const cleanNum = stripOuterGroupingParens(num);
    const cleanDen = stripOuterGroupingParens(den);
    return `\\frac{${cleanNum}}{${cleanDen}}`;
  });

  return s;
}

export function renderLatexToSvgDataUrl(
  latex: string, 
  color: string = '#1e1e1e', 
  fontSize: number = 38
): { dataUrl: string; width: number; height: number } {
  const html = katex.renderToString(latex, {
    displayMode: true,
    throwOnError: false,
    output: 'html',
  });

  const approxWidth = Math.max(160, Math.min(1000, latex.length * (fontSize * 0.7) + 120));
  const approxHeight = Math.max(120, fontSize * 3.2);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${approxWidth}" height="${approxHeight}" viewBox="0 0 ${approxWidth} ${approxHeight}">
  <style>
    @import url('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css');
    .katex-container {
      font-size: ${fontSize}px;
      color: ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
  </style>
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" class="katex-container">
      ${html}
    </div>
  </foreignObject>
</svg>`.trim();

  return {
    dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    width: Math.round(approxWidth),
    height: Math.round(approxHeight),
  };
}
