interface LogoProps {
  className?: string
}

// simple flat svg logo: graduation cap combined with upward trend arrow
export function Logo({ className = 'w-6 h-6' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 10.5L12 6l10 4.5-10 4.5z" />
      <path d="M6 12.8v3.7c0 2.2 2.7 3.5 6 3.5s6-1.3 6-3.5v-3.7" />
      <path d="M22 10.5v5" />
      <path d="M12 10.5l8-7" />
      <path d="M16 3.5h4v4" />
    </svg>
  )
}
