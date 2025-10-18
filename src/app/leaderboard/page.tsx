// src/app/leaderboard/page.tsx
import LeaderboardServer from '@/components/leaderboard/LeaderboardServer';
import base from '@/styles/Base.module.css';
import styles from '@/styles/LeaderboardPage.module.css';

export default function LeaderboardPage() {
  return (
    <div className={base.wrapper}>
      <div className={base.dividerLayer} />

      <main className={base.pageContainer} role="main" aria-label="Leaderboard">
        {/* SEO-friendly but hidden heading */}
        <h1 className={base.visuallyHidden}>Helldivers 2 Leaderboard</h1>
        <section className={styles.container} aria-label="Leaderboard">
          <LeaderboardServer />
        </section>
      </main>
    </div>
  );
}
