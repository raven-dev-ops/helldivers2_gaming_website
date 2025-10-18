// src/app/leaderboard/page.tsx
import LeaderboardServer from '@/components/leaderboard/LeaderboardServer';
import base from '@/styles/Base.module.css';
import styles from '@/styles/LeaderboardPage.module.css';

export default function LeaderboardPage() {
  return (
    <div className={base.wrapper}>
      <div className={base.dividerLayer} />

      <main className={base.pageContainer} role="main" aria-label="Leaderboard">
        {/* Page header */}
        <header className={styles.header} style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <h1 className={styles.pageTitle}>Leaderboard</h1>
            <p className={styles.pageSubtitle}>Updated every 60s</p>
          </div>
        </header>

        {/* The component below renders tabs, search, and table with unified styling */}
        <section className={styles.container} aria-label="Leaderboard">
          <LeaderboardServer />
        </section>
      </main>
    </div>
  );
}

