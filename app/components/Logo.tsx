export function Logo({ size = 36, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <rect width="64" height="64" rx="15" fill="#0f6b66" />
      <path d="M7 19.5Q19 15 31 20.5V51Q19 45.5 7 50Z" fill="#fbf8f3" />
      <path d="M33 20.5Q45 15 57 19.5V50Q45 45.5 33 51Z" fill="#fbf8f3" />
      <circle cx="19" cy="28.5" r="4.6" fill="#0f6b66" />
      <path d="M11.2 43.2Q12.5 34.8 19 34.8T26.8 43.8Q19 41 11.2 43.2Z" fill="#0f6b66" />
      <rect x="37" y="37" width="4.4" height="8.6" rx="1.2" fill="#e0a458" />
      <rect x="43.2" y="31.5" width="4.4" height="13.4" rx="1.2" fill="#e0a458" />
      <rect x="49.4" y="25.5" width="4.4" height="18.8" rx="1.2" fill="#c0632a" />
    </svg>
  );
}
