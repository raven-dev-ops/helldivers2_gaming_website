// src/components/common/Footer.tsx
import React from 'react';
import styles from '@/styles/Footer.module.css';
import { FaDiscord, FaTwitch, FaYoutube } from 'react-icons/fa';
import { FaTiktok, FaXTwitter, FaInstagram, FaSnapchat } from 'react-icons/fa6';
import { FaFacebook } from 'react-icons/fa';
import { SiKick } from 'react-icons/si';

export default function Footer() {
  const discordUrl = process.env.NEXT_PUBLIC_SOCIAL_DISCORD_URL;
  const youtubeUrl = process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL;
  const twitchUrl = process.env.NEXT_PUBLIC_SOCIAL_TWITCH_URL;
  const tiktokUrl = process.env.NEXT_PUBLIC_SOCIAL_TIKTOK_URL;
  const xUrl = process.env.NEXT_PUBLIC_SOCIAL_X_URL;
  const instagramUrl = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL;
  const metaUrl =
    process.env.NEXT_PUBLIC_SOCIAL_META_URL; // Using Facebook icon as closest available
  const snapchatUrl = process.env.NEXT_PUBLIC_SOCIAL_SNAPCHAT_URL;
  const kickUrl = process.env.NEXT_PUBLIC_SOCIAL_KICK_URL;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.socialLinks} aria-label="Social links">
          {discordUrl && (
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              title="Discord"
              className={styles.socialIconLink}
            >
              <FaDiscord className={styles.socialIcon} />
            </a>
          )}
          {youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              title="YouTube"
              className={styles.socialIconLink}
            >
              <FaYoutube className={styles.socialIcon} />
            </a>
          )}
          {twitchUrl && (
            <a
              href={twitchUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitch"
              title="Twitch"
              className={styles.socialIconLink}
            >
              <FaTwitch className={styles.socialIcon} />
            </a>
          )}
          {tiktokUrl && (
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              title="TikTok"
              className={styles.socialIconLink}
            >
              <FaTiktok className={styles.socialIcon} />
            </a>
          )}
          {xUrl && (
            <a
              href={xUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              title="X (Twitter)"
              className={styles.socialIconLink}
            >
              <FaXTwitter className={styles.socialIcon} />
            </a>
          )}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className={styles.socialIconLink}
            >
              <FaInstagram className={styles.socialIcon} />
            </a>
          )}
          {metaUrl && (
            <a
              href={metaUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Meta"
              title="Meta"
              className={styles.socialIconLink}
            >
              <FaFacebook className={styles.socialIcon} />
            </a>
          )}
          {snapchatUrl && (
            <a
              href={snapchatUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Snapchat"
              title="Snapchat"
              className={styles.socialIconLink}
            >
              <FaSnapchat className={styles.socialIcon} />
            </a>
          )}
          {kickUrl && (
            <a
              href={kickUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Kick"
              title="Kick"
              className={styles.socialIconLink}
            >
              <SiKick className={styles.socialIcon} />
            </a>
          )}
        </div>
        <p>
          © {new Date().getFullYear()} Galactic Phantom Taskforce. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
