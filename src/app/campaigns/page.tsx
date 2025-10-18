// src/app/campaigns/page.tsx

'use client';

import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import base from '@/styles/Base.module.css';
import exp from '@/styles/Expanders.module.css';
import code from '@/styles/CodeBlocks.module.css';
// Removed submission modal and button per request
import YoutubeCarouselPlaceholder from '@/components/campaigns/YoutubeCarouselCampaigns';

// ⬇️ Use shared data/types from lib
import {
  prestigeMissions,
  campaignVideoUrls,
  type PrestigeMissionData,
} from '@/lib/campaigns';

export default function CampaignsPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // Submission modal removed

  const toggleExpansion = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={base.wrapper}>
      <div className={base.dividerLayer} />
      <div className={base.pageContainer}>
        <section className={base.section} id="gpt-campaign-missions">
          <h2 className={base.sectionTitle}>GPT Prestige Operations</h2>

          <div className={base.subsectionCard}>
            <h3 className={base.subHeading}>Rules & Requirements</h3>
            <ul className={`${base.styledList} ${base.decimal}`}>
              <li className={base.listItem}>
                If it&apos;s on the map, it&apos;s in play unless the specific
                challenge level states otherwise.
              </li>
              <li className={base.listItem}>
                Video submissions must be one continuous, unedited recording. No
                cuts, splits, or speed-ups.
              </li>
              <li className={base.listItem}>
                Mission privacy must be set to Invite Only.
              </li>
            </ul>
          </div>

          <div className={base.subsectionCard}>
            <h3 className={base.subHeading}>John Helldiver Campaigns</h3>

            {prestigeMissions.map((mission: PrestigeMissionData) => {
              const isExpanded = !!expanded[mission.id];
              const videosForMission = campaignVideoUrls[mission.id] || [];

              return (
                <div
                  key={mission.id}
                  className={exp.challengeLevelContainer}
                  id={mission.id}
                  style={{ scrollMarginTop: 96 }}
                >
                  <div
                    className={`${exp.challengeHeader} ${!isExpanded ? exp.noBorderBottom : ''}`}
                    onClick={() => toggleExpansion(mission.id)}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-controls={`mission-content-${mission.id}`}
                    tabIndex={0}
                    onKeyDown={(e) =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      toggleExpansion(mission.id)
                    }
                  >
                    <h4 className={base.subHeading}>{mission.title}</h4>
                    <FaChevronDown
                      className={`${exp.expandIcon} ${isExpanded ? exp.rotated : ''}`}
                      aria-hidden="true"
                    />
                  </div>

                  <div
                    id={`mission-content-${mission.id}`}
                    className={`${exp.challengeDetailsContent} ${isExpanded ? exp.expanded : ''}`}
                  >
                    <pre className={code.codeBlock}>{mission.details}</pre>

                    {/* YouTube carousel/placeholder fed by string URLs */}
                    <YoutubeCarouselPlaceholder
                      videoUrls={videosForMission}
                      title={mission.title}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Campaign button removed */}
        </section>

        {/* Submission modal removed */}
      </div>
    </div>
  );
}
