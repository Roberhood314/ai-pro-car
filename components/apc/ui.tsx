"use client";

import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SVGProps } from "react";
import type { Level, Source } from "@/lib/apc/types";
import { LEVEL_META, SOURCE_LABEL } from "@/lib/apc/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type IconProps = SVGProps<SVGSVGElement>;
function S({ children, ...p }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}
export const IconGauge = (p: IconProps) => (
  <S {...p}>
    <path d="M12 14l4-4" />
    <path d="M3.3 17a9 9 0 1 1 17.4 0" />
    <circle cx="12" cy="14" r="1" />
  </S>
);
export const IconScan = (p: IconProps) => (
  <S {...p}>
    <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" />
    <path d="M7 12h10" />
  </S>
);
export const IconCar = (p: IconProps) => (
  <S {...p}>
    <path d="M5 17h14v-4l-2-5H7l-2 5z" />
    <path d="M3 13h18" />
    <circle cx="7.5" cy="17" r="1.5" />
    <circle cx="16.5" cy="17" r="1.5" />
  </S>
);
export const IconTurbo = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 12c0-3 2-5 5-5M12 12c3 0 5 2 5 5M12 12c0 3-2 5-5 5M12 12c-3 0-5-2-5-5" />
  </S>
);
export const IconPlus = (p: IconProps) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);
export const IconBack = (p: IconProps) => (
  <S {...p}>
    <path d="M15 18l-6-6 6-6" />
  </S>
);
export const IconChevron = (p: IconProps) => (
  <S {...p}>
    <path d="M9 18l6-6-6-6" />
  </S>
);
export const IconClose = (p: IconProps) => (
  <S {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </S>
);
export const IconCheck = (p: IconProps) => (
  <S {...p}>
    <path d="M5 12l5 5L20 7" />
  </S>
);
export const IconAlert = (p: IconProps) => (
  <S {...p}>
    <path d="M12 3l9 16H3z" />
    <path d="M12 10v4M12 17h.01" />
  </S>
);
export const IconShield = (p: IconProps) => (
  <S {...p}>
    <path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </S>
);
export const IconTrash = (p: IconProps) => (
  <S {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </S>
);
export const IconWrench = (p: IconProps) => (
  <S {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
  </S>
);
export const IconPlug = (p: IconProps) => (
  <S {...p}>
    <path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4" />
  </S>
);
export const IconSpark = (p: IconProps) => (
  <S {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
  </S>
);
export const IconSearch = (p: IconProps) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </S>
);
export const IconEdit = (p: IconProps) => (
  <S {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </S>
);
export const IconDatabase = (p: IconProps) => (
  <S {...p}>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
  </S>
);

type Variant = "primary" | "outline" | "ghost" | "danger" | "solid";
export function Button({
  variant = "primary",
  block,
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "solid" && "bg-secondary text-foreground hover:bg-secondary/80",
        variant === "outline" && "border border-border bg-transparent text-foreground hover:bg-secondary",
        variant === "ghost" && "text-muted-foreground hover:bg-secondary hover:text-foreground",
        variant === "danger" && "bg-confirmed/15 text-confirmed hover:bg-confirmed/25",
        block && "w-full",
        className,
      )}
      {...p}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-xl border border-border bg-card", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx("text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>{children}</p>
  );
}

const LEVEL_CLS: Record<Level, string> = {
  confirmed: "bg-confirmed/15 text-confirmed border-confirmed/50",
  probable: "bg-probable/15 text-probable border-probable/50",
  possible: "bg-possible/10 text-possible border-possible/40",
  need_test: "bg-transparent text-need border-need border-dashed",
};
export const LEVEL_BORDER: Record<Level, string> = {
  confirmed: "border-confirmed/60",
  probable: "border-probable/50",
  possible: "border-possible/35",
  need_test: "border-need/70 border-dashed",
};

export function LevelBadge({ level }: { level: Level }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        LEVEL_CLS[level],
      )}
    >
      <span
        className={cx(
          "h-1.5 w-1.5 rounded-full",
          level === "confirmed" && "bg-confirmed",
          level === "probable" && "bg-probable",
          level === "possible" && "bg-possible",
          level === "need_test" && "border border-need",
        )}
      />
      {LEVEL_META[level].label}
    </span>
  );
}

export function SourceBadge({ source, className }: { source: Source; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
        source === "live" ? "bg-ok/15 text-ok" : source === "sim" ? "bg-probable/12 text-probable" : "bg-secondary text-muted-foreground",
        className,
      )}
    >
      <IconDatabase width={12} height={12} />
      {SOURCE_LABEL[source]}
    </span>
  );
}

export function SafeReadBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-ok/12 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ok">
      <IconShield width={12} height={12} />
      Safe read
    </span>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-input bg-panel-2 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none";

export function TextInput(p: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(inputCls, p.className)} />;
}

export function Overlay({ children, z = "z-40" }: { children: ReactNode; z?: string }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div className={cx("fixed inset-0 flex justify-center bg-background", z)}>
      <div className="apc-rise flex h-full w-full max-w-md flex-col">{children}</div>
    </div>
  );
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-background/70" onClick={onClose} />
      <div className="apc-sheet relative flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <IconClose />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="font-semibold text-pretty">{title}</p>
      <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{body}</p>
      {action}
    </div>
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
