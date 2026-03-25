import { useState, useCallback } from "react";

export function useClipboard(resetMs = 1_500) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string) => {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for environments without Clipboard API
          const el = document.createElement("textarea");
          el.value = text;
          el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
          document.body.appendChild(el);
          el.select();
          document.execCommand("copy");
          document.body.removeChild(el);
        }
        setCopied(text);
        setTimeout(() => setCopied(null), resetMs);
      } catch {
        // Silent fail — clipboard may be blocked in some contexts
      }
    },
    [resetMs],
  );

  return { copy, copied };
}
