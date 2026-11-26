type BrandMarkProps = {
  size?: number;
  className?: string;
  /** Show product name beside the official mark */
  withWordmark?: boolean;
};

/**
 * Official System logo (black mark on transparent).
 * Rendered on a light chip so the mark stays visible on the dark UI —
 * the PNG itself is never redesigned.
 */
export function BrandMark({ size = 40, className = "", withWordmark = false }: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#f0f3f0]"
        style={{ width: size, height: size, padding: Math.max(4, Math.round(size * 0.12)) }}
      >
        <img
          src="/branding/system-logo.png"
          alt="System"
          width={size}
          height={size}
          className="h-full w-full object-contain"
          draggable={false}
        />
      </span>
      {withWordmark && (
        <span className="font-display text-2xl font-semibold tracking-tight text-accent">System</span>
      )}
    </div>
  );
}
