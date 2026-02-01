'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navigation item definition
 */
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Navigation items for the sidebar
 */
const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Learn',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    ),
  },
  {
    href: '/upload',
    label: 'Upload',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

/**
 * Sidebar Component
 * 
 * Modern dark sidebar with:
 * - Gradient logo
 * - Glowing active states
 * - Smooth hover transitions
 * - Glass morphism effects
 */
export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-20 bg-surface border-r border-white/10 flex flex-col items-center py-6 z-50">
      {/* Logo with gradient */}
      <div className="mb-8">
        <Link href="/" className="block">
          <div className="w-12 h-12 bg-gradient-to-br from-mint to-coral rounded-xl flex items-center justify-center text-background font-bold text-xl">
            M
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-3 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center w-14 h-14 rounded-xl
                ${isActive 
                  ? 'bg-mint/15 text-mint' 
                  : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                }
              `}
              title={item.label}
            >
              {/* Active left bar indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-mint rounded-r-full" />
              )}
              
              <div className="relative z-10">
                {item.icon}
              </div>
              <span className={`relative z-10 text-xs mt-1 font-medium ${isActive ? 'text-mint' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Settings button */}
      <div className="mt-auto">
        <button
          className="flex flex-col items-center justify-center w-14 h-14 rounded-xl text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
          title="Settings"
        >
          <div>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <span className="text-xs mt-1 font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
}
