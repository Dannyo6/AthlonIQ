export function navigateWithTransition(fn: () => void): void {
  const prefersReduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const doc =
    typeof document !== "undefined"
      ? (document as Document & {
          startViewTransition?: (callback: () => void) => { finished?: Promise<void> };
        })
      : undefined;

  if (!prefersReduced && doc && typeof doc.startViewTransition === "function") {
    doc.startViewTransition(() => {
      fn();
    });
    return;
  }

  fn();
}
