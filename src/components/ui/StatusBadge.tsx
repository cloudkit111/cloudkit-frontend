// ── Status badge ──────────────────────────────────────────────────────────
type Status = 'idle' | 'deploying' | 'success' | 'error';

export function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { dot: string; label: string; text: string }> = {
    idle: { dot: 'bg-[#333]', label: 'Ready to deploy', text: 'text-[#555]' },
    deploying: {
      dot: 'bg-amber-400 animate-pulse',
      label: 'Deploying…',
      text: 'text-amber-400',
    },
    success: {
      dot: 'bg-emerald-500',
      label: 'Deployed',
      text: 'text-emerald-400',
    },
    error: { dot: 'bg-red-500', label: 'Failed', text: 'text-red-400' },
  };
  const { dot, label, text } = map[status];
  return (
    <span className={`flex items-center gap-1.5 text-[11px] ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${dot}`} />
      {label}
    </span>
  );
}
