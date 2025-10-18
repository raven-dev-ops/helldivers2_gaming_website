'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import base from '@/styles/Base.module.css';
import styles from '@/styles/Apply.module.css';
import Quiz, { type Question } from '@/components/academy/training/Quiz';

const PROMPTS = [
  'What does democracy mean to you in Helldivers 2?',
  'How would you handle disruptive players?',
  'Why do you want to become a moderator?',
  'Share a favorite Helldivers 2 tactic.',
];

export default function ApplyPage() {
  const [interest, setInterest] = useState('');
  const [about, setAbout] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const quizOpenRef = useRef<(() => void) | null>(null);

  const [promptIndex, setPromptIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setPromptIndex((p) => (p + 1) % PROMPTS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const INTEREST_MAX = 600;
  const ABOUT_MAX = 600;
  const interestCount = useMemo(() => interest.length, [interest]);
  const aboutCount = useMemo(() => about.length, [about]);

  function parseTimeString(input: string): { hours: number; minutes: number } | null {
    if (!input) return null;
    const trimmed = input.trim();
    // Formats: HH:MM, H:MM, HH:MM AM/PM, H:MM am/pm
    const ampmMatch = trimmed.match(/^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])\s*$/);
    if (ampmMatch) {
      let h = parseInt(ampmMatch[1], 10);
      const m = parseInt(ampmMatch[2], 10);
      const mer = ampmMatch[3].toUpperCase();
      if (h === 12) h = 0;
      if (mer === 'PM') h += 12;
      if (h >= 0 && h < 24 && m >= 0 && m < 60) return { hours: h, minutes: m };
      return null;
    }
    const hhmm = trimmed.match(/^\s*(\d{1,2}):(\d{2})\s*$/);
    if (hhmm) {
      const h = parseInt(hhmm[1], 10);
      const m = parseInt(hhmm[2], 10);
      if (h >= 0 && h < 24 && m >= 0 && m < 60) return { hours: h, minutes: m };
      return null;
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      // Build a local Date from date + time (supports AM/PM)
      const t = parseTimeString(time) ?? parseTimeString((time || '').replace('.', ':'));
      let interviewAvailability: Date;
      if (t && date) {
        const [y, mo, d] = date.split('-').map((v) => parseInt(v, 10));
        interviewAvailability = new Date(y, (mo || 1) - 1, d || 1, t.hours, t.minutes, 0, 0);
      } else {
        interviewAvailability = new Date(`${date}T${time}`);
      }
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'discord-moderator',
          interest,
          about,
          interviewAvailability,
        }),
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : { message: await res.text() };
      if (!res.ok) throw new Error(data.message || 'Failed to submit');
      const friendly = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(new Date(interviewAvailability));
      setMessage(`${data.message || 'Application submitted'}. Interview target: ${friendly}.`);
      setInterest('');
      setAbout('');
      setDate('');
      setTime('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* --- Moderator Readiness Quiz (25 questions) --- */
  const modQuestions: Question[] = [
    {
      question:
        'A player is upset after being team-killed during an extraction rush. What is your first step?',
      options: [
        'Mute the offender immediately for 24h',
        'Acknowledge feelings, gather both sides briefly, check context (accident vs. pattern)',
        'Post the rules in chat and move on',
        'Ping admins to take over',
      ],
      answer: 1,
    },
    {
      question:
        'You see repeated accidental team-kills from a new recruit. Best approach?',
      options: [
        'Kick on the spot to â€œset an exampleâ€',
        'Quietly coach: suggest safer stratagem timing and spacing; log a note',
        'Publicly call them out in general chat',
        'Issue a permanent ban',
      ],
      answer: 1,
    },
    {
      question:
        'Two members escalate a shouting match in voice after a failed mission. What do you do?',
      options: [
        'Hard-mute both, end of story',
        'Move to calm channel, de-escalate, separate if needed, reference rules; document',
        'Let them â€œget it out of their systemâ€',
        'Record and post the clip to shame them',
      ],
      answer: 1,
    },
    {
      question:
        'A member is clearly intoxicated and derailing comms. Policy-aligned first action?',
      options: [
        'Laugh it offâ€”no harm done',
        'Ask them to take a break from voice; offer to reschedule play; document',
        'Immediate 7-day ban',
        'Ignoreâ€”only admins can act',
      ],
      answer: 1,
    },
    {
      question:
        'Someone accuses a mod of favoritism after a dispute. Whatâ€™s your move?',
      options: [
        'Defend the mod publicly',
        'Escalate to admins for review; avoid adjudicating your own team; preserve logs',
        'Delete the message',
        'Poll the channel',
      ],
      answer: 1,
    },
    {
      question:
        'A player spams stratagems on teammates mid-mission, then apologizes. Whatâ€™s proportionate?',
      options: [
        'Instant server ban',
        'Calm warning + expectations; note incident; repeat = timeout & escalate',
        'No actionâ€”apology is enough',
        'Kick from Discord immediately',
      ],
      answer: 1,
    },
    {
      question:
        'Two moderators break a rule during an event (e.g., mocking a recruit). Correct path?',
      options: [
        'Ignoreâ€”staff are exempt during events',
        'Politely stop behavior, capture context, escalate to admins for review',
        'Publicly call them out in #general',
        'DM them to delete VOD and move on',
      ],
      answer: 1,
    },
    {
      question:
        'When enforcing any player action (timeout/kick), what staffing requirement applies?',
      options: [
        'Solo mod can act',
        'Must have 3 other officers present and discuss in mod chat prior (unless emergency safety issue)',
        'Only admins can act',
        'Two mods are sufficient',
      ],
      answer: 1,
    },
    {
      question:
        'A heated complaint appears mid-mission. Best timing for resolution?',
      options: [
        'Pause mission immediately to hold a hearing',
        'Acknowledge briefly and move resolution post-mission in appropriate channel',
        'Ignore until tomorrow',
        'Ask squad to vote on punishment',
      ],
      answer: 1,
    },
    {
      question:
        'A user posts slurs in voice. Immediate policy-aligned response?',
      options: [
        'Issue a warning for â€œcolorful languageâ€',
        'Immediate mute/remove from voice; preserve clip/logs; escalate to admins',
        'Do nothing unless they repeat',
        'Ask others to talk over them',
      ],
      answer: 1,
    },
    {
      question:
        'Team-kill revenge loop starts after a failed objective. What do you do?',
      options: [
        'Let them sort it out',
        'Stop the behavior, separate parties, remind rules, log; repeated = timeout & escalate',
        'Kick both immediately without notes',
        'Switch to another channel yourself',
      ],
      answer: 1,
    },
    {
      question:
        'Player refuses to follow â€œClear Commsâ€ during high-intensity fights.',
      options: [
        'Public shaming',
        'One clear reminder; if continued, temporary voice timeout; document',
        'Instant ban',
        'Ask teammates to mute them',
      ],
      answer: 1,
    },
    {
      question:
        'You personally witnessed an incident, but youâ€™re emotionally involved. Best practice?',
      options: [
        'Decide anywayâ€”you saw it',
        'Recuse from decision; pass to other officers/admins; provide facts only',
        'Ignore conflict',
        'Delete evidence to avoid bias',
      ],
      answer: 1,
    },
    {
      question:
        'Evidence collection: whatâ€™s most useful when escalating to admins?',
      options: [
        'Vibes and hearsay',
        'Timestamps, clips/logs, brief neutral summary of context and prior actions',
        'Only the raw VOD link',
        'DM screenshots without dates',
      ],
      answer: 1,
    },
    {
      question:
        'A recruit repeatedly ignores loadout rules for a training run.',
      options: [
        'Immediate ban for â€œinsubordinationâ€',
        'Explain training goals, give single corrective step; log; escalate if pattern',
        'Public call-out in #announcements',
        'Let squad punish them',
      ],
      answer: 1,
    },
    {
      question:
        'Two moderators disagree on action severity. Correct step per policy?',
      options: [
        'Majority vote in public',
        'Discuss in mod chat; if unresolved, escalate to admins (final say)',
        'Flip a coin',
        'Ask chat to decide',
      ],
      answer: 1,
    },
    {
      question:
        'A user reports â€œtoo drunk to talk toâ€ member in voice. Best response?',
      options: [
        'Kick immediately',
        'Move them out of voice/kind pause; suggest break; document; repeat = timeout & escalate',
        'Do nothing',
        'Ask squad to handle privately',
      ],
      answer: 1,
    },
    {
      question:
        'When is it okay to take enforcement action without prior mod-chat discussion?',
      options: [
        'Never, under any circumstance',
        'Only if there is an immediate safety/harassment risk; then document and inform admins ASAP',
        'Whenever itâ€™s faster',
        'If two mods agree privately',
      ],
      answer: 1,
    },
    {
      question:
        'A player DMs you privately with accusations. What should you do?',
      options: [
        'Promise a punishment immediately',
        'Ask them to use the reporting channel/form; log the DM as evidence; keep decisions in official channels',
        'Ignore DMs',
        'Forward their DM to #general',
      ],
      answer: 1,
    },
    {
      question:
        'During a raid, a veteran mocks a new playerâ€™s mistakes. Whatâ€™s proportionate?',
      options: [
        'Let veterans vent',
        'Remind code of conduct, ask for constructive guidance; document; repeat = timeout',
        'Public humiliation of veteran',
        'Instant ban for toxicity',
      ],
      answer: 1,
    },
    {
      question:
        'A mod deletes messages about their own mistake. What now?',
      options: [
        'Nothingâ€”they fixed the feed',
        'Capture logs, escalate to admins for review; recuse that mod from related decisions',
        'Ask them to re-post an apology and move on',
        'Ban the mod immediately',
      ],
      answer: 1,
    },
    {
      question:
        'Player refuses to stop arguing about a past sanction.',
      options: [
        'Allow them to re-litigate in #general',
        'Direct them to appeals process; keep #general clear; document contact',
        'Block them',
        'Tell them â€œtoo badâ€',
      ],
      answer: 1,
    },
    {
      question:
        'How should you phrase warnings to align with â€œFair & Consistentâ€?',
      options: [
        'Personal remarks about character',
        'Short, neutral, behavior-based; reference rule; state next step',
        'Long lectures',
        'Sarcastic jokes',
      ],
      answer: 1,
    },
    {
      question:
        'What belongs in mod notes after any action?',
      options: [
        'Only the username',
        'Date/time, channel, behavior, rule cited, action taken, who present, link to evidence',
        'A summary without dates',
        'Nothing if they apologized',
      ],
      answer: 1,
    },
    {
      question:
        'Final check before any non-emergency enforcement?',
      options: [
        'Act fast before they log off',
        'Confirm 3 other officers present and discuss in mod chat; align on proportionate action',
        'Ask random members',
        'Wait for the next day',
      ],
      answer: 1,
    },
  ];

  // Shuffle answer positions so correct option is mixed up
  const shuffledModQuestions = useMemo(() => {
    function shuffleOne(q: Question): Question {
      const order = q.options.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const newOptions = order.map((i) => q.options[i]);
      const newAnswer = order.indexOf(q.answer);
      return { question: q.question, options: newOptions, answer: newAnswer };
    }
    return modQuestions.map(shuffleOne);
  }, []);

  return (
    <div className={base.wrapper}>
      <div className={base.dividerLayer} />
      <div className={base.pageContainer}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <div>
              <h1 className={styles.heroTitle}>Apply to the Mod Team</h1>
              <p className={styles.heroSubtitle}>
                Keep comms clear, morale high, and missions efficient. Moderators set the tone for
                Managed Democracy—on and off the field. Short answers now; we'll dig deeper in a brief interview.
              </p>
              <div className={styles.steps}>
                <div className={styles.step}><strong>1.</strong> Apply</div>
                <div className={styles.step}><strong>2.</strong> Interview</div>
                <div className={styles.step}><strong>3.</strong> Trial Run</div>
              </div>
              <div className={styles.heroCtaRow}>
                <a href="#application" className={styles.heroCta}>Start Application</a>
                <button type="button" className={`${styles.heroCta} ${styles.ghost}`} onClick={(e) => { e.preventDefault(); quizOpenRef.current?.(); }}>
                  Check Readiness
                </button>
              </div>
            </div>
            <div className={styles.videoWrapper} aria-hidden>
              <img src="/images/placeholder.png" alt="Mod team media placeholder" className={styles.videoFrame} loading="lazy" />
            </div>
          </div>
        </div>

        {/* Hidden Quiz instance; opened via the hero CTA */}
        <Quiz
          title="Moderator Readiness Quiz"
          questions={shuffledModQuestions}
          hideTrigger
          exposeOpen={(open) => { quizOpenRef.current = open; }}
        />
        <section className={base.section}>
          {/* --- INTRO (LEFT) + QUIZ (RIGHT) --- */}
          <div className={styles.introAndQuizRow}>
          {/* LEFT: Intro */}
          <div className={styles.introBlock}>
            <h2 className={base.sectionTitle}>Join Our Mod Team Today!</h2>
            <p className={base.paragraph}>
              Help us keep comms clear, morale high, and missions efficient. Moderators set the tone
              for Managed Democracyâ€”on and off the field.
            </p>

            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${styles.badgeActive}`}>Clear Comms</span>
              <span className={`${styles.badge} ${styles.badgeActive}`}>Team First</span>
              <span className={`${styles.badge} ${styles.badgeActive}`}>Calm Under Fire</span>
              <span className={`${styles.badge} ${styles.badgeActive}`}>Fair &amp; Consistent</span>
            </div>

            <ul className={styles.tipsList}>
              <li>Model good conduct and de-escalate conflicts quickly.</li>
              <li>Support new recruits and keep events running smoothly.</li>
              <li>Document incidents and follow server guidelines.</li>
            </ul>
          </div>

          {/* Quiz sidebar removed; hero CTA now starts the quiz directly */}
        </div>

        {/* --- TWO-COLUMN: FORM LEFT, VIDEO + PROMPTS RIGHT --- */}
        <div className={styles.applyTwoCol}>
          {/* Left: application form (one column) */}
          <form onSubmit={handleSubmit} className={styles.applicationFormWide} aria-describedby="apply-help">
            <p id="apply-help" className={styles.formHelper}>
              Short, specific answers beat long essays. You can elaborate during the interview.
            </p>

            <label className={styles.fieldLabel}>
              Why are you interested in becoming a moderator?
              <textarea
                value={interest}
                onChange={(e) => setInterest(e.target.value.slice(0, INTEREST_MAX))}
                required
                className={styles.input}
                rows={4}
                aria-describedby="interest-count"
                placeholder="What motivates you? What strengths do you bring to the team?"
              />
              <span id="interest-count" className={styles.charCount}>
                {interestCount}/{INTEREST_MAX}
              </span>
            </label>

            <label className={styles.fieldLabel}>
              Tell us about yourself
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value.slice(0, ABOUT_MAX))}
                required
                className={styles.input}
                rows={4}
                aria-describedby="about-count"
                placeholder="Brief background, moderation or leadership experience, availability."
              />
              <span id="about-count" className={styles.charCount}>
                {aboutCount}/{ABOUT_MAX}
              </span>
            </label>

            <div className={styles.row2}>
              <label className={styles.fieldLabel}>
                Interview Date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className={styles.input}
                />
              </label>
              <label className={styles.fieldLabel}>
                Interview Time
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className={styles.input}
                />
              </label>
            </div>

            {error && <p className={styles.formError} role="alert">{error}</p>}
            {message && <p className={styles.formSuccess} role="status" aria-live="polite">{message}</p>}

            <div className={styles.ctaRow}>
              <button type="submit" disabled={submitting} className={styles.applyButton}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => { setInterest(''); setAbout(''); setDate(''); setTime(''); }}
              >
                Clear Form
              </button>
            </div>

            <p className={styles.privacyNote}>
              We only use this information to evaluate your application and schedule an interview.
            </p>
          </form>

          {/* Right: image + rotating prompts (centered) */}
        </div>
      </section>
      </div>
    </div>
  );
}





