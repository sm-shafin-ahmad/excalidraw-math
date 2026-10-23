import { useRef, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { renderMathToImage } from './utils/nativeMathDrawer';
import { isMathExpression, easyMathToLatex, renderLatexToSvgDataUrl } from './utils/mathUtils';

export function App() {
  const excalidrawAPIRef = useRef<any>(null);
  const convertedIdsRef = useRef<Set<string>>(new Set());

  // Listen for Enter key to commit/submit text without inserting an unwanted newline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const active = document.activeElement as HTMLElement | null;
        if (active && active.classList.contains('excalidraw-wysiwyg')) {
          e.preventDefault();
          (active as HTMLTextAreaElement).blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleChange = (elements: readonly any[], appState: any) => {
    const api = excalidrawAPIRef.current;
    if (!api) return;

    // IMPORTANT: If user is actively typing inside a text box (editingTextElement is non-null),
    // DO NOT convert yet! Let the user finish typing completely so text never vanishes or truncates.
    const currentlyEditingId = appState?.editingTextElement?.id;

    for (const el of elements) {
      if (
        el.type === 'text' &&
        !el.isDeleted &&
        el.id !== currentlyEditingId && // Only convert after user finishes editing (presses Enter or clicks away)
        !convertedIdsRef.current.has(el.id)
      ) {
        const text = (el.text || el.originalText || '').trim();

        if (isMathExpression(text)) {
          convertedIdsRef.current.add(el.id);

          try {
            const color = el.strokeColor || '#1e1e1e';
            const fontSize = Math.max(32, el.fontSize || 36);

            // 1. High-precision Canvas PNG generation
            let result = renderMathToImage(text, color, fontSize);

            let mimeType = 'image/png';
            if (!result) {
              const latex = easyMathToLatex(text);
              result = renderLatexToSvgDataUrl(latex, color, fontSize);
              mimeType = 'image/svg+xml';
            }

            const { dataUrl, width, height } = result;
            const fileId = `math_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            // Register image into Excalidraw files
            api.addFiles([
              {
                id: fileId,
                dataURL: dataUrl,
                mimeType,
                created: Date.now(),
              },
            ]);

            // Replace text element with cleanly rendered math element, keeping vertical center
            const currentElements = api.getSceneElements();
            const deltaY = (height - (el.height || 30)) / 2;
            const updated = currentElements.map((item: any) => {
              if (item.id === el.id) {
                return {
                  ...item,
                  type: 'image',
                  fileId,
                  status: 'saved',
                  y: Math.round(item.y - deltaY),
                  width,
                  height,
                  strokeColor: 'transparent',
                  backgroundColor: 'transparent',
                  scale: [1, 1],
                  version: (item.version || 1) + 1,
                  versionNonce: (item.versionNonce || 1) + 1,
                };
              }
              return item;
            });

            api.updateScene({
              elements: updated,
              commitToHistory: true,
            });
          } catch (e) {
            console.error('Math convert failed:', e);
          }
        }
      }
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Excalidraw
        excalidrawAPI={(api) => {
          excalidrawAPIRef.current = api;
        }}
        onChange={handleChange}
      />
    </div>
  );
}

export default App;

