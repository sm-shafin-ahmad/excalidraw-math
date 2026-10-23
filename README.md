# Excalidraw Math

A pixel-identical replica of the official [Excalidraw](https://excalidraw.com/) virtual whiteboard with native, hand-drawn inline math formatting.

Write equations directly into standard text boxes using intuitive human-friendly syntax—no complex LaTeX memorization, external modals, or UI clutter required.

---

## Highlights

- **Pixel-Identical UI**: 100% identical look, feel, and canvas controls as official Excalidraw. Zero added buttons or intrusive modals.
- **Inline Text-to-Math**: Select the standard Text tool (`T`), type your formula, and press `Enter` or click away. It converts in place instantly.
- **Handwritten Typography**: Mathematical symbols, fraction bars, and radical signs render with crisp canvas precision matching Excalidraw's signature Virgil font.
- **Balanced Parenthesis Parser**: Handles nested parentheses at any depth (e.g. `((a+b))/(b+(-c))` or `s = (v^2 - u^2)/(2a)`) without breaking algebraic terms.
- **Smart Denominator Handling**: Distinguishes standalone terms (`1/2a`, `1/100`, `1/r^2`) from grouped compound denominators without forcing redundant brackets.
- **Multi-digit Powers**: Seamlessly typesets large numbers and expressions as exponents (`10^22`, `x^(2n+1)`).

---

## Syntax & Examples

### 1. Fractions & Equations
| What you type | Rendered Output | Note |
|---|---|---|
| `5/2` | $\frac{5}{2}$ | Simple numerical fraction |
| `1/2a` | $\frac{1}{2a}$ | Automatic denominator binding without brackets |
| `s = ut + 1/2 at^2` | $s = ut + \frac{1}{2}at^2$ | Formula with inline fraction and power |
| `s = (v^2 - u^2)/(2a)` | $s = \frac{v^2 - u^2}{2a}$ | Parenthesized numerator and denominator |
| `((a+b))/(b+(-c))` | $\frac{(a+b)}{b+(-c)}$ | Nested parentheses with inner brackets preserved |
| `R = (R_1 * R_2)/(R_1 + R_2)` | $R = \frac{R_1 \cdot R_2}{R_1 + R_2}$ | Parallel resistance formula with subscripts |

### 2. Powers & Exponents
| What you type | Rendered Output | Note |
|---|---|---|
| `10^22` | $10^{22}$ | Multi-digit numerical exponent |
| `x^2 + y^2 = r^2` | $x^2 + y^2 = r^2$ | Multiple powers across an equation |
| `e^(x+1)` | $e^{x+1}$ | Grouped compound exponent |
| `a_1 + a_2` | $a_1 + a_2$ | Subscripts |

### 3. Square Roots
| What you type | Rendered Output | Note |
|---|---|---|
| `sqrt(16)` | $\sqrt{16}$ | Simple square root |
| `v = sqrt(u^2 + 2as)` | $v = \sqrt{u^2 + 2as}$ | Root over compound terms and powers |
| `r = sqrt(x^2 + y^2)` | $r = \sqrt{x^2 + y^2}$ | Pythagorean distance |

### 4. Mathematical Symbols
| What you type | Rendered Output | Symbol |
|---|---|---|
| `pi * r^2` | $\pi \cdot r^2$ | $\pi$ and multiplication dot ($\cdot$) |
| `alpha + beta` | $\alpha + \beta$ | Greek letters |
| `theta <= 90` | $\theta \le 90$ | Inequalities |
| `x +- y != z` | $x \pm y \ne z$ | Plus-minus ($\pm$) and not-equal ($\ne$) |
| `inf` | $\infty$ | Infinity |

---

## How It Works

1. **Typing Guard**: Watches Excalidraw's `appState.editingTextElement` to ensure user keystrokes are never interrupted or converted prematurely while typing.
2. **Keyboard Commit**: Captures single-line `Enter` keystrokes inside the canvas textarea to commit the input without inserting an awkward extra newline.
3. **Canvas Tokenizer**: The input string is parsed into tokens and structured line elements (text runs, fractions, radicals, and sub/superscripts).
4. **Virgil Rendering**: Canvas rendering draws the equation at $2\times$ pixel density using Excalidraw's handwritten font with vertical baseline alignment.
5. **Scene Integration**: Replaces the active text element with an image element at the exact vertical center coordinates, preserving canvas history (undo/redo).

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- npm, pnpm, or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/excalidraw-math.git

# Navigate into the project directory
cd excalidraw-math

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Build for Production

```bash
# Typecheck and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

The output bundle will be located in the `dist/` directory, ready to deploy to Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Bundler**: [Vite 6](https://vitejs.dev/)
- **Canvas Engine**: [@excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Math Fallback**: [KaTeX](https://katex.org/)

---

## License

[MIT](LICENSE)
