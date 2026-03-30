// ── Log line ──────────────────────────────────────────────────────────────
export function LogLine({ line, isInit }: { line: string; isInit?: boolean }) {
  const trimmed = line.trim();
  if (!trimmed) return <div className="h-2" />;

  // ── FIX 2: init lines get a distinct dim style ──
  if (isInit) {
    return (
      <div className="flex gap-2 leading-relaxed">
        <span
          style={{ color: "#3a3a3a", userSelect: "none" }}
          className="flex-shrink-0 text-[11px] pt-px"
        >
          ›
        </span>
        <span className="text-[12.5px] font-mono break-all text-[#3a3a3a] italic">
          {trimmed}
        </span>
      </div>
    );
  }

  let prefixColor = "#555";
  let textColor = "#9ca3af";

  if (/error|err|fail/i.test(trimmed)) {
    prefixColor = "#f87171";
    textColor = "#fca5a5";
  } else if (/warn/i.test(trimmed)) {
    prefixColor = "#fbbf24";
    textColor = "#fde68a";
  } else if (/success|done|complete|✓|built/i.test(trimmed)) {
    prefixColor = "#34d399";
    textColor = "#6ee7b7";
  } else if (/info|→|▶/i.test(trimmed)) {
    prefixColor = "#60a5fa";
    textColor = "#93c5fd";
  }

  return (
    <div className="flex gap-2 leading-relaxed">
      <span
        style={{ color: prefixColor, userSelect: "none" }}
        className="flex-shrink-0 text-[11px] pt-px"
      >
        ›
      </span>
      <span
        style={{ color: textColor }}
        className="text-[12.5px] font-mono break-all"
      >
        {trimmed}
      </span>
    </div>
  );
}
