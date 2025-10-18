// src/components/common/Navbar.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import styles from '@/styles/Navbar.module.css';
import ThemeToggle from '@/components/common/ThemeToggle';

// Helper: build a URL + optional hash (anchor)
const toUrl = (pathname: string, hash?: string) =>
  hash ? { pathname, hash } : { pathname };

type Variant = 'desktop' | 'mobile';

const CHALLENGE_LEVEL_LABELS: Array<{ id: string; label: string }> = [
  { id: 'level-0', label: 'Basic Clearance' },
  { id: 'level-1', label: 'Sabotage Proficiency' },
  { id: 'level-2', label: 'Resource Denial' },
  { id: 'level-3', label: 'ICBM Control' },
  { id: 'level-4', label: 'Flawless ICBM' },
  { id: 'level-5', label: 'Perfect Survey' },
  { id: 'level-6', label: 'Eagle Ace' },
  { id: 'level-7', label: 'The Purist' },
];

const CAMPAIGN_LABELS: Array<{ id: string; label: string }> = [
  { id: 'level-8', label: 'Terminid Spawn Camp' },
  { id: 'level-9', label: 'Automaton Hell Strike' },
  { id: 'level-10', label: 'Lethal Pacifist' },
  { id: 'level-11', label: 'Total Area Scorching' },
];

function NavLinks(props: {
  variant: Variant;
  pathname: string;
  isClient: boolean;
  sessionStatus: 'authenticated' | 'loading' | 'unauthenticated';
  meritPoints: number | null;
  closeMobile?: () => void;
}) {
  const {
    variant,
    pathname,
    isClient,
    sessionStatus,
    meritPoints,
    closeMobile,
  } = props;

  const ACADEMY_BASE = `/academy`;
  const ACADEMY_APPLY = `${ACADEMY_BASE}/apply`;
  const ACADEMY_MY = `${ACADEMY_BASE}/training`;

  const linkClick =
    variant === 'mobile' && closeMobile ? { onClick: closeMobile } : {};

  const linkCls = (active: boolean) =>
    `${styles.link} ${active ? styles.activeLink : ''}`;

  const baseItems = [
    { href: `/`, label: 'Home' },
    { href: `/merch`, label: 'Shop' },
    { href: `/leaderboard`, label: 'Leaderboard' },
    { href: `/challenges`, label: 'Challenges' },
    { href: `/campaigns`, label: 'Campaigns' },
    { href: `/academy`, label: 'Academy' },
  ] as const;

  const isDesktop = variant === 'desktop';

  return (
    <>
      {baseItems.map(({ href, label }) => {
        // Active states
        const exactActive = isClient && pathname === href;
        const startsWith = (p: string) => isClient && pathname.startsWith(p);

        if (label === 'Leaderboard') {
          const active = startsWith(`/leaderboard`);
          return (
            <Link
              key={href}
              href={toUrl(href)}
              className={linkCls(active)}
              prefetch={false}
              {...linkClick}
            >
              {label}
            </Link>
          );
        }

        if (label === 'Challenges') {
          const active = startsWith(`/challenges`);

          // Desktop: dropdown; Mobile: linear list + subitems
          if (isDesktop) {
            return (
              <div key={href} className={styles.dropdown}>
                <Link href={toUrl(href)} className={linkCls(active)} prefetch={false}>
                  {label}
                </Link>
                <div className={styles.dropdownMenu} role="menu" aria-label="Challenge levels">
                  {CHALLENGE_LEVEL_LABELS.map(({ id, label }) => (
                    <Link
                      key={id}
                      href={toUrl(`/challenges`, id)}
                      className={styles.dropdownItem}
                      role="menuitem"
                      prefetch={false}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }
          // Mobile
          return (
            <div key={href}>
              <Link href={toUrl(href)} className={styles.link} prefetch={false} {...linkClick}>
                {label}
              </Link>
              {CHALLENGE_LEVEL_LABELS.map(({ id, label }) => (
                <Link
                  key={id}
                  href={toUrl(`/challenges`, id)}
                  className={styles.link}
                  prefetch={false}
                  {...linkClick}
                >
                  {label}
                </Link>
              ))}
            </div>
          );
        }

        if (label === 'Campaigns') {
          const active = startsWith(`/campaigns`);

          if (isDesktop) {
            return (
              <div key={href} className={styles.dropdown}>
                <Link href={toUrl(href)} className={linkCls(active)} prefetch={false}>
                  {label}
                </Link>
                <div className={styles.dropdownMenu} role="menu" aria-label="Campaign missions">
                  {CAMPAIGN_LABELS.map(({ id, label }) => (
                    <Link
                      key={id}
                      href={toUrl(`/campaigns`, id)}
                      className={styles.dropdownItem}
                      role="menuitem"
                      prefetch={false}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }
          // Mobile
          return (
            <div key={href}>
              <Link href={toUrl(href)} className={styles.link} prefetch={false} {...linkClick}>
                {label}
              </Link>
              {CAMPAIGN_LABELS.map(({ id, label }) => (
                <Link
                  key={id}
                  href={toUrl(`/campaigns`, id)}
                  className={styles.link}
                  prefetch={false}
                  {...linkClick}
                >
                  {label}
                </Link>
              ))}
            </div>
          );
        }

        if (label === 'Academy') {
          const active = startsWith(ACADEMY_BASE);

          if (isDesktop) {
            return (
              <div key={href} className={styles.dropdown}>
                <Link href={toUrl(ACADEMY_BASE)} className={linkCls(active)} prefetch={false}>
                  Academy
                </Link>
                <div className={styles.dropdownMenu} role="menu" aria-label="Academy">
                  <Link href={toUrl(ACADEMY_APPLY)} className={styles.dropdownItem} role="menuitem" prefetch={false}>
                    Mod Team
                  </Link>
                </div>
              </div>
            );
          }
          // Mobile
          return (
            <div key={href}>
              <Link href={toUrl(ACADEMY_BASE)} className={styles.link} prefetch={false} {...linkClick}>
                Academy
              </Link>
              <Link href={toUrl(ACADEMY_APPLY)} className={styles.link} prefetch={false} {...linkClick}>
                Mod Team
              </Link>
            </div>
          );
        }

        // Streamers & simple items
        const defaultActive = exactActive;
        return (
          <Link key={href} href={toUrl(href)} className={linkCls(defaultActive)} prefetch={false} {...linkClick}>
            {label}
          </Link>
        );
      })}

      {/* Auth/Profile items removed per request */}
    </>
  );
}

const Navbar = () => {
  const [isClient, setIsClient] = useState(false);
  const [meritPoints, setMeritPoints] = useState<number | null>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();
  const { status: sessionStatus } = useSession();

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetch('/api/users/me', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setMeritPoints(data ? data.meritPoints ?? 0 : 0))
        .catch(() => setMeritPoints(0));
    } else {
      setMeritPoints(null);
    }
  }, [sessionStatus]);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <button
          className={styles.mobileMenuButton}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Desktop */}
        <div className={styles.desktopMenu}>
          <NavLinks
            variant="desktop"
            pathname={pathname}
            isClient={isClient}
            sessionStatus={sessionStatus}
            meritPoints={meritPoints}
          />
          <ThemeToggle />
        </div>

        {/* Mobile */}
        <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <NavLinks
            variant="mobile"
            pathname={pathname}
            isClient={isClient}
            sessionStatus={sessionStatus}
            meritPoints={meritPoints}
            closeMobile={closeMobile}
          />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
