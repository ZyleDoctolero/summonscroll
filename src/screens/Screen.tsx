import { useEffect } from "react";

export function Screen({ html, title }: { html: string; title?: string }) {
  useEffect(() => {
    if (title) document.title = title;
    // Re-run Tailwind CDN to pick up newly mounted classes.
    const tw = (window as unknown as { tailwind?: { _refresh?: () => void } }).tailwind;
    if (tw && typeof tw._refresh === "function") {
      try {
        tw._refresh();
      } catch {
        /* noop */
      }
    }
  }, [html, title]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
