// src/app/page.tsx

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { FaDiscord } from 'react-icons/fa';
import styles from '@/styles/Base.module.css';
import reviews from '@/lib/reviews';

const ReviewsRotator = dynamic(() => import('@/components/home/ReviewsRotator'));

export default function HelldiversPage() {
  // hardcode socials
  const discordUrl = 'https://discord.gg/gptfleet';
  const youtubeUrl = 'https://www.youtube.com/@gptfleet';
  const tiktokUrl = process.env.NEXT_PUBLIC_SOCIAL_TIKTOK_URL;

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.dividerLayer} />
        <div className={styles.pageContainer}>
          {/* === YouTube Video Section === */}
          <section className={styles.section}>
            <div className={styles.youtubeEmbed}>
              <iframe
                width="100%"
                height="100%"
                // Use specific featured video; keep modest branding + autoplay muted
                src="https://www.youtube.com/embed/LiVr7VOykDs?si=NxGDOVzyHbggVlV1&autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1"
                title="GPT Fleet — Featured Video"
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </section>

          {/* === About (Split) Section: Text left, GIF right === */}
          <section className={`${styles.section} ${styles.splitSection}`}>
            <div className={styles.splitText}>
              <h2 className={styles.sectionTitle}>
                About GPT Helldivers 2
                <span className={styles.socialIconsGroup}>
                  <Link
                    href={discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Discord"
                    className={styles.socialIconLink}
                  >
                    <FaDiscord className={styles.socialIcon} />
                  </Link>
                </span>
              </h2>
              <p className={styles.paragraph}>
                Welcome to the Galactic Phantom Taskforce (GPT) Helldivers 2 Division! We are a rapidly
                growing, multi-game community focused on creating a non-toxic, mature, and fun environment
                for gamers. Whether you're a fresh recruit dropping onto Malevelon Creek for the first time
                or a seasoned Super Citizen spreading managed democracy across the galaxy, you have a place here.
              </p>
              <p className={styles.paragraph}>
                Our core values center around respect, teamwork, and enjoying the game together. We value
                every member and strive to provide an inclusive space where players can coordinate missions,
                share strategies, showcase their triumphs (and epic fails!), and simply hang out. We utilize
                Discord extensively for communication, LFG (Looking For Group), and organizing community
                events. Join us today!
              </p>
            </div>
            <div className={styles.splitImage}>
              <Image
                src="/images/ultrasad.gif"
                alt="Ultra Sad Helldiver"
                className={styles.centeredImage}
                width={800}
                height={450}
                loading="lazy"
              />
            </div>
          </section>

          {/* === New to the Fight (Split) Section: Image left, Text right === */}
          <section className={`${styles.section} ${styles.splitSection} ${styles.reverse}`}>
            <div className={styles.splitText}>
              <h2 className={styles.sectionTitle}>PC, PS5, Xbox, or Steamdeck!</h2>
              <p className={styles.paragraph}>
                Just bought the game? Feeling overwhelmed by Bile Titans or Hulks? Don't worry, we've all
                been there! GPT offers a supportive environment for new players. Ask questions, team up with
                experienced members who can show you the ropes (and the best ways to avoid friendly fire...
                mostly!), and learn the basics without fear of judgment.
              </p>
              <p className={styles.paragraph}>
                We have dedicated channels for LFG, tips, and loadout discussions. Joining voice chat is
                encouraged for better coordination during missions, but not mandatory if you prefer text.
                Find squadmates for anything from trivial difficulty farming to your first Helldive attempt!
              </p>
            </div>
            <div className={styles.splitImage}>
              <Image
                src="/images/helldiver_poster.gif"
                alt="New to the Fight"
                className={styles.centeredImage}
                width={800}
                height={450}
                loading="lazy"
              />
            </div>
          </section>

          {/* === Veterans (Split) Section: Text left, GIF right === */}
          <section className={`${styles.section} ${styles.splitSection}`}>
            <div className={styles.splitText}>
              <h2 className={styles.sectionTitle}>High Level Helldivers Requested!</h2>
              <p className={styles.paragraph}>
                Think you've seen it all? Mastered the art of the 500kg bomb? Looking for a consistent group
                to tackle Difficulty 9+ operations and coordinate advanced strategies? GPT is home to many
                experienced Helldivers eager to push the limits and contribute to the Galactic War effort effectively.
              </p>
              <p className={styles.paragraph}>
                Coordinate multi-squad planetary operations, share your high-level strategies, participate in
                community-organized challenges (like the John Helldiver Course!), or simply find reliable teammates
                who understand the importance of covering flanks and calling out patrols. Help mentor newer players
                or form elite squads for the toughest challenges the galaxy throws at us.
              </p>
            </div>
            <div className={styles.splitImage}>
              <Image
                src="/images/veteran_image.gif"
                alt="Seasoned Helldiver Veteran"
                className={styles.centeredImage}
                width={800}
                height={450}
                loading="lazy"
              />
            </div>
          </section>

          {/* === Reviews Section (Bottom) === */}
          <ReviewsRotator reviews={reviews} />

          {/* === Project Tasks Section === */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Project Documentation Tasks</h2>
            <p className={styles.paragraph}>
              Remaining docs to draft for this project:
            </p>
            <ul className={styles.paragraph}>
              <li>[ ] Create <code>timeline.md</code> (project history & key milestones)</li>
              <li>[ ] Create <code>roadmap.md</code> (upcoming features & priorities)</li>
              <li>[x] Create <code>wiki.md</code> (top-level project wiki overview)</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
