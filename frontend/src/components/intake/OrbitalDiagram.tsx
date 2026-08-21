// little mark in the nav after we yanked the old hero orb

function CoFoundMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <circle cx="16" cy="7" r="1.7" fill="currentColor" />
      <circle cx="23.7" cy="11.2" r="1.7" fill="currentColor" opacity=".82" />
      <circle cx="25.1" cy="19.7" r="1.7" fill="currentColor" opacity=".62" />
      <circle cx="20.1" cy="25.4" r="1.7" fill="currentColor" opacity=".82" />
      <circle cx="11.9" cy="25.4" r="1.7" fill="currentColor" opacity=".62" />
      <circle cx="6.9" cy="19.7" r="1.7" fill="currentColor" opacity=".82" />
      <circle cx="8.3" cy="11.2" r="1.7" fill="currentColor" />
      <circle cx="16" cy="16" r="2.2" fill="currentColor" />
    </svg>
  )
}

// wrapper so the nav can size the mark without fighting the svg
export function CoFoundLogo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <div className={className}>
      <CoFoundMark className={markClassName ?? 'size-6 text-foreground'} />
    </div>
  )
}
