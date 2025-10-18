// src/app/challenges/page.tsx
'use client';

import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

// Styles
import base from '@/styles/Base.module.css';
import exp from '@/styles/Expanders.module.css';
import code from '@/styles/CodeBlocks.module.css';

// Components
// Removed submission modal and button per request
import YoutubeCarouselPlaceholder from '@/components/challenges/YoutubeCarouselChallenges';

// Data (JH0–JH7)
import { challengeLevels, type ChallengeLevelData } from '@/lib/challenges';

export default function ChallengesPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // Submission modal removed

  const toggleExpansion = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={base.wrapper}>
      <div className={base.dividerLayer} />
      <div className={base.pageContainer}>
        <section className={base.section} id="gpt-challenge-levels">
          <h2 className={base.sectionTitle}>John Helldiver Challenge Levels</h2>

          <div className={base.subsectionCard}>
            <h3 className={base.subHeading}>Rules & Requirements</h3>
            <ul className={`${base.styledList} ${base.decimal}`}>
              <li className={base.listItem}>
                If it&apos;s on the map, it&apos;s in play unless the specific level states otherwise.
              </li>
              <li className={base.listItem}>
                Video submissions must be one continuous, unedited recording. No cuts, splits, or speed-ups.
              </li>
              <li className={base.listItem}>
                Mission privacy must be set to Invite Only.
              </li>
            </ul>
          </div>

          <div className={base.subsectionCard}>
            <h3 className={base.subHeading}>JH0–JH7 Challenges</h3>

            {challengeLevels.map((level: ChallengeLevelData) => {
              const isExpanded = !!expanded[level.id];
              return (
                <div
                  key={level.id}
                  className={exp.challengeLevelContainer}
                  id={level.id}
                  style={{ scrollMarginTop: 96 }}
                >
                  <div
                    className={`${exp.challengeHeader} ${!isExpanded ? exp.noBorderBottom : ''}`}
                    onClick={() => toggleExpansion(level.id)}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-controls={`challenge-content-${level.id}`}
                    tabIndex={0}
                    onKeyDown={(e) =>
                      (e.key === 'Enter' || e.key === ' ') && toggleExpansion(level.id)
                    }
                  >
                    <h4 className={base.subHeading}>{level.levelTitle}</h4>
                    <FaChevronDown
                      className={`${exp.expandIcon} ${isExpanded ? exp.rotated : ''}`}
                      aria-hidden="true"
                    />
                  </div>

                  <div
                    id={`challenge-content-${level.id}`}
                    className={`${exp.challengeDetailsContent} ${isExpanded ? exp.expanded : ''}`}
                  >
                    <pre className={code.codeBlock}>{level.details}</pre>

                    <YoutubeCarouselPlaceholder
                      videoUrls={level.videoUrls ?? []}
                      title={level.levelTitle}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Challenge button removed */}
        </section>

        {/* Submission modal removed */}
      </div>
    </div>
  );
}
