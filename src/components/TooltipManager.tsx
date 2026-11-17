import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface TooltipState {
  title: string | null;
  text: string;
  hint: string | null;
  pinned: boolean;
  anchorRect: { left: number; top: number; right: number; bottom: number; width: number };
}

export const TooltipManager: React.FC = () => {
  const [tip, setTip] = useState<TooltipState | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 8, top: 8 });
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const readMeta = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return {
        title: el.getAttribute('data-tip-title'),
        text: el.getAttribute('data-tip') || '',
        hint: el.getAttribute('data-tip-hint'),
        anchorRect: {
          left: r.left,
          top: r.top,
          right: r.right,
          bottom: r.bottom,
          width: r.width,
        },
      };
    };

    const onMouseOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-tip]') as HTMLElement | null;
      if (!el) return;
      const meta = readMeta(el);
      if (!meta.text) return;
      setTip((prev) => {
        if (prev?.pinned) return prev;
        return { ...meta, pinned: false };
      });
    };

    const onMouseOut = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-tip]');
      if (!el) return;
      setTip((prev) => (prev && !prev.pinned ? null : prev));
    };

    const onFocusIn = (e: FocusEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-tip]') as HTMLElement | null;
      if (!el) return;
      const meta = readMeta(el);
      if (!meta.text) return;
      setTip((prev) => {
        if (prev?.pinned) return prev;
        return { ...meta, pinned: false };
      });
    };

    const onFocusOut = () => {
      setTip((prev) => (prev && !prev.pinned ? null : prev));
    };

    const onClick = (e: MouseEvent) => {
      const trigger = (e.target as HTMLElement | null)?.closest?.(
        '[data-tip-trigger]'
      ) as HTMLElement | null;

      if (trigger) {
        e.stopPropagation();
        const meta = readMeta(trigger);
        if (!meta.text) return;
        setTip((prev) => {
          if (
            prev &&
            prev.pinned &&
            prev.text === meta.text &&
            Math.abs(prev.anchorRect.top - meta.anchorRect.top) < 4
          ) {
            return null;
          }
          return { ...meta, pinned: true };
        });
        return;
      }

      setTip(null);
    };

    const onScroll = () => setTip(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTip(null);
    };

    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('click', onClick);
    document.addEventListener('scroll', onScroll, true);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('click', onClick);
      document.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useLayoutEffect(() => {
    if (!tip || !boxRef.current) return;
    const box = boxRef.current.getBoundingClientRect();
    const { anchorRect } = tip;
    let left = anchorRect.left + anchorRect.width / 2 - box.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - box.width - 8));

    let top = anchorRect.top - box.height - 8;
    if (top < 8) {
      top = Math.min(window.innerHeight - box.height - 8, anchorRect.bottom + 8);
    }
    setPos({ left, top });
  }, [tip]);

  if (!tip) return null;

  return (
    <div
      ref={boxRef}
      role="tooltip"
      className="fixed z-50 max-w-[min(320px,calc(100vw-16px))] rounded-xl bg-stone-900 dark:bg-stone-100 px-3.5 py-2.5 text-sm leading-snug text-white dark:text-stone-900 shadow-xl pointer-events-none border border-stone-700 dark:border-stone-300 space-y-1"
      style={{ left: pos.left, top: pos.top }}
    >
      {tip.title && (
        <div className="font-bold text-emerald-300 dark:text-emerald-800 text-xs uppercase tracking-wide">
          {tip.title}
        </div>
      )}
      <div>{tip.text}</div>
      {tip.hint && (
        <div className="text-xs text-stone-300 dark:text-stone-600 pt-1 border-t border-stone-700 dark:border-stone-300">
          {tip.hint}
        </div>
      )}
    </div>
  );
};

interface TipIconProps {
  tip: string;
  label: string;
  hint?: string;
}

export const TipIcon: React.FC<TipIconProps> = ({ tip, label, hint }) => {
  return (
    <button
      type="button"
      data-tip={tip}
      data-tip-title={label}
      data-tip-hint={hint}
      data-tip-trigger="true"
      aria-label={`Penerangan: ${label}`}
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold accent-active-card accent-label border hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 shrink-0 cursor-help"
    >
      ?
    </button>
  );
};
