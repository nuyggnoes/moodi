export function PlayIcon() {
  return (
    <svg viewBox="0 0 12 12" width={12} height={12} fill="currentColor" aria-hidden="true">
      <path d="M2 1.2v9.6c0 .7.8 1.1 1.4.7l7.2-4.8c.5-.4.5-1.1 0-1.4L3.4.5C2.8.1 2 .5 2 1.2Z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg viewBox="0 0 12 12" width={12} height={12} fill="currentColor" aria-hidden="true">
      <rect x="2" y="1" width="3" height="10" rx="0.8" />
      <rect x="7" y="1" width="3" height="10" rx="0.8" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function NavSvg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function HomeIcon() {
  return (
    <NavSvg>
      <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </NavSvg>
  );
}

export function PlusIcon() {
  return (
    <NavSvg>
      <path d="M12 5v14M5 12h14" />
    </NavSvg>
  );
}

export function CalendarIcon() {
  return (
    <NavSvg>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </NavSvg>
  );
}

export function SearchIcon() {
  return (
    <NavSvg>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </NavSvg>
  );
}

export function LogoutIcon() {
  return (
    <NavSvg>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </NavSvg>
  );
}

export function SidebarToggleIcon() {
  return (
    <NavSvg>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </NavSvg>
  );
}

export function ChevronLeftIcon() {
  return (
    <NavSvg>
      <path d="M15 5l-7 7 7 7" />
    </NavSvg>
  );
}

export function ChevronRightIcon() {
  return (
    <NavSvg>
      <path d="M9 5l7 7-7 7" />
    </NavSvg>
  );
}
