'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/Quiz.module.css';

export interface Question {
  question: string;
  options: string[];
  answer: number;
}

interface QuizProps {
  title: string;
  questions: Question[];
  /** Hide the default trigger button; open via exposeOpen instead */
  hideTrigger?: boolean;
  /** Parent can capture an open() function to programmatically start the quiz */
  exposeOpen?: (open: () => void) => void;
}

export default function Quiz({ title, questions, hideTrigger, exposeOpen }: QuizProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  // for portal/focus trap/click-outside
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  const openModal = useCallback(() => {
    setSelected(Array(questions.length).fill(-1));
    setScore(0);
    setShowAnswer(false);
    setCurrent(0);
    setOpen(true);
  }, [questions]);

  // Expose open() to parent when requested
  useEffect(() => {
    if (exposeOpen) exposeOpen(openModal);
  }, [exposeOpen, openModal]);

  const closeModal = useCallback(() => setOpen(false), []);

  const handleSelect = (optionIndex: number) => {
    setSelected((prev) => {
      const next = [...prev];
      next[current] = optionIndex;
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected[current] === questions[current].answer) {
      setScore((s) => s + 1);
    }
    setShowAnswer(true);
  };

  const handleNext = () => {
    setShowAnswer(false);
    setCurrent((c) => c + 1);
  };

  const finished = current >= questions.length;
  const hasSelection = !finished && selected[current] !== -1;

  // Esc to close + focus trap + scroll lock
  useEffect(() => {
    if (!open) return;

    // lock scroll
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // focus first focusable element
    const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();

      // focus trap
      if (e.key === 'Tab' && focusables && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (active === first || !active) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow; // restore scroll
    };
  }, [open, closeModal]);

  // close on overlay click, but not when clicking inside the modal
  const onOverlayMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === overlayRef.current) {
      closeModal();
    }
  };

  const questionId = `quiz-${title}-q-${current}`;

  return (
    <>
      {!hideTrigger && (
        <button onClick={openModal} className={styles.quizButton}>
          Take Quiz
        </button>
      )}

      {open && mounted &&
        createPortal(
          <div
            ref={overlayRef}
            className={styles.overlay}
            onMouseDown={onOverlayMouseDown}
          >
            <div
              ref={modalRef}
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`quiz-${title}-heading`}
              aria-describedby={!finished ? questionId : undefined}
            >
              <button
                onClick={closeModal}
                className={styles.closeButton}
                aria-label="Close quiz"
              >
                ×
              </button>

              <h3 id={`quiz-${title}-heading`} className={styles.subHeading}>
                {title}
              </h3>

              {!finished ? (
                <>
                  <p id={questionId} className={styles.question}>
                    {current + 1}/{questions.length}. {questions[current].question}
                  </p>

                  <div role="group" aria-labelledby={`quiz-${title}-heading`}>
                    {questions[current].options.map((opt, oi) => {
                      const isCorrect = showAnswer && oi === questions[current].answer;
                      const isIncorrect =
                        showAnswer && selected[current] === oi && oi !== questions[current].answer;
                      const isChosen = selected[current] === oi;

                      return (
                        <label
                          key={oi}
                          className={[
                            styles.optionLabel,
                            isChosen ? styles.optionSelected : '',
                            isCorrect ? styles.correct : '',
                            isIncorrect ? styles.incorrect : '',
                          ].join(' ').trim()}
                        >
                          <input
                            type="radio"
                            name={`q-${title}-${current}`}
                            checked={isChosen}
                            onChange={() => handleSelect(oi)}
                            disabled={showAnswer}
                          />{' '}
                          {opt}
                        </label>
                      );
                    })}
                  </div>

                  {/* Footer actions anchored to bottom via CSS */}
                  <div className={styles.quizActions}>
                    {!showAnswer ? (
                      <button
                        onClick={handleSubmit}
                        className={styles.quizButton}
                        disabled={!hasSelection}
                      >
                        Submit
                      </button>
                    ) : (
                      <button onClick={handleNext} className={styles.quizButton}>
                        {current === questions.length - 1 ? 'Finish' : 'Next'}
                      </button>
                    )}

                    <button onClick={closeModal} className={styles.quizButton}>
                      Close
                    </button>
                  </div>

                  {/* Announce correctness for screen readers */}
                  {showAnswer && (
                    <div className={styles.srOnly} aria-live="polite">
                      {selected[current] === questions[current].answer ? 'Correct' : 'Incorrect'}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className={styles.score}>
                    Score: {score}/{questions.length}
                  </p>
                  <div className={styles.quizActions}>
                    <button onClick={closeModal} className={styles.quizButton}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
