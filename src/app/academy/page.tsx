// src/app/academy/page.tsx
'use client';

import { useMemo, useRef, useState, useCallback, KeyboardEvent, MouseEvent } from 'react';
import Image from 'next/image';
import base from '@/styles/Base.module.css';
import styles from '@/styles/AcademyPage.module.css';
import { MODULES, type AcademyModule } from '@/lib/Academy';
import Modal from '@/components/common/Modal';

export default function AcademyPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const selectedModule = useMemo<AcademyModule | null>(
    () => MODULES.find((m) => m.id === selectedId) ?? null,
    [selectedId]
  );

  const openModal = useCallback((id: string, trigger: HTMLButtonElement | null) => {
    lastTriggerRef.current = trigger;
    setSelectedId(id);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedId(null);
    lastTriggerRef.current?.focus(); // restore focus to the trigger
  }, []);

  const onCardKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(id, e.currentTarget);
      }
    },
    [openModal]
  );

  return (
    <div className={base.wrapper}>
      <div className={base.dividerLayer} />

      <main className={base.pageContainer} role="main" aria-label="Academy">
        <section className={base.section} aria-label="Training Modules">
          <ul className={styles.modulesGrid} aria-label="Available modules">
            {MODULES.map((module) => {
              const { details: _omit, ...m } = module;
              return (
                <ModuleCard
                  key={m.id}
                  data={m}
                  onOpen={openModal}
                  onKeyOpen={onCardKeyDown}
                />
              );
            })}
          </ul>
        </section>
      </main>

      {/* Modal (removed unsupported `id` prop) */}
      <Modal
        open={!!selectedModule}
        onClose={closeModal}
        title={selectedModule?.title ?? ''}
        subtitle={selectedModule?.subtitle}
        hero={
          selectedModule
            ? {
                src: selectedModule.img || '/images/placeholder.svg',
                alt: selectedModule.imgAlt || 'Academy module image',
                width: 1200,
                height: 675,
              }
            : undefined
        }
        rightCta={
          selectedModule?.id === 'command' ? (
            <a href="/mod-team" className={styles.ctaButton} aria-label="Apply to Mod Team">
              Apply to Mod Team
            </a>
          ) : null
        }
      >
        {selectedModule && (
          <>
            <p id="academy-modal-desc" className={base.paragraph} style={{ marginBottom: '0.75rem' }}>
              {selectedModule.description}
            </p>

            {selectedModule.details.paragraphs.map((p, idx) => (
              <p key={`${selectedModule.id}-p-${idx}`} className={base.paragraph}>
                {p}
              </p>
            ))}

            {(selectedModule.details.tips?.length || selectedModule.details.cautions?.length) ? (
              <div className={styles.modalRow} aria-label="Tips and cautions">
                {selectedModule.details.tips?.length ? (
                  <div className={styles.modalListCard}>
                    <div className={styles.modalListTitle}>Tips</div>
                    <ul className={`${base.styledList} ${styles.moduleSkillsList}`}>
                      {selectedModule.details.tips.map((t, idx) => (
                        <li key={`${selectedModule.id}-tip-${idx}`} className={base.listItem}>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {selectedModule.details.cautions?.length ? (
                  <div className={styles.modalListCard}>
                    <div className={styles.modalListTitle}>Cautions</div>
                    <ul className={`${base.styledList} ${styles.moduleSkillsList}`}>
                      {selectedModule.details.cautions.map((c, idx) => (
                        <li key={`${selectedModule.id}-caution-${idx}`} className={base.listItem}>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className={styles.modalRow} style={{ marginTop: '1.25rem' }} aria-label="Skills">
              <div className={styles.modalListCard}>
                <div className={styles.modalListTitle}>Basic</div>
                <ul className={`${base.styledList} ${styles.moduleSkillsList}`}>
                  {selectedModule.basic.map((item, idx) => (
                    <li key={`${selectedModule.id}-basic-${idx}`} className={base.listItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.modalListCard}>
                <div className={styles.modalListTitle}>Advanced</div>
                <ul className={`${base.styledList} ${styles.moduleSkillsList}`}>
                  {selectedModule.advanced.map((item, idx) => (
                    <li key={`${selectedModule.id}-adv-${idx}`} className={base.listItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button
                type="button"
                onClick={closeModal}
                className={styles.ctaButton}
                aria-label="Close module"
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

/** Small card component */
function ModuleCard({
  data,
  onOpen,
  onKeyOpen,
}: {
  data: Omit<AcademyModule, 'details'>;
  onOpen: (id: string, trigger: HTMLButtonElement | null) => void;
  onKeyOpen: (e: KeyboardEvent<HTMLButtonElement>, id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <li className={styles.moduleCard} aria-label={`${data.title} module`}>
      <div className={styles.moduleCardImgWrap}>
        <Image
          className={styles.moduleCardImg}
          src={imgError ? '/images/placeholder.svg' : (data.img || '/images/placeholder.svg')}
          alt={data.imgAlt || `${data.title} image`}
          width={1200}
          height={675}
          sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
          priority={false}
          onError={() => setImgError(true)}
        />
      </div>

      <div className={styles.moduleCardBody}>
        <h3 className={styles.moduleCardTitle}>{data.title}</h3>
        <p className={styles.moduleCardSubtitle}>{data.subtitle}</p>
        <p className={styles.moduleCardDesc}>{data.description}</p>

        <div className={styles.moduleCardActions}>
          <button
            className={styles.ctaButton}
            onClick={(e: MouseEvent<HTMLButtonElement>) => onOpen(data.id, e.currentTarget)}
            onKeyDown={(e) => onKeyOpen(e, data.id)}
            aria-haspopup="dialog"
            // removed aria-controls since we’re not setting an external id on Modal
            aria-label={`Open ${data.title} module`}
          >
            Open
          </button>
        </div>
      </div>
    </li>
  );
}
