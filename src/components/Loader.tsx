import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Language } from '../types';
import { useSiteCMS } from '../context/SiteCMSContext';

interface LoaderProps {
  currentLang?: Language;
}

const INTRO_SEEN_KEY = 'eao_intro_seen_v3';

function markIntroSeenInSession() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // Ignore storage failures in sandboxed contexts
  }
}

function resolveFStopLabel(progress: number): string {
  if (progress >= 94) return 'f/1.4';
  if (progress >= 76) return 'f/2.0';
  if (progress >= 56) return 'f/2.8';
  if (progress >= 36) return 'f/4.0';
  if (progress >= 16) return 'f/5.6';
  return 'f/8.0';
}

const APERTURE_BLADES = [0, 45, 90, 135, 180, 225, 270, 315];

export const Loader: React.FC<LoaderProps> = ({ currentLang }) => {
  const { layout } = useSiteCMS();
  const [progress, setProgress] = useState(0);
  const [locked, setLocked] = useState(false);
  const [parting, setParting] = useState(false);
  const [unmounted, setUnmounted] = useState(false);
  const skippedRef = useRef(false);

  const activeLang: Language =
    currentLang || (typeof document !== 'undefined' && document.documentElement.lang === 'ar' ? 'ar' : 'en');

  const brandDisplay =
    activeLang === 'ar'
      ? layout.brandNameAr || 'إنعام علي عثمان'
      : (layout.brandNameEn || 'ENAAM ALI OSMAN').toUpperCase();

  const subtitleDisplay =
    activeLang === 'ar' ? 'أرشيف التوثيق البصري' : 'DOCUMENTARY ARCHIVE';

  const triggerExit = useCallback(() => {
    if (skippedRef.current) return;
    skippedRef.current = true;
    markIntroSeenInSession();
    setProgress(100);
    setLocked(true);
    setParting(true);
    window.setTimeout(() => setUnmounted(true), 760);
  }, []);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const isDirectPinLink =
      typeof window !== 'undefined' &&
      (window.location.search.includes('pin=') || window.location.hash.includes('pin='));

    const isHoldPreview =
      typeof window !== 'undefined' && window.location.search.includes('intro=hold');

    if (isDirectPinLink) {
      markIntroSeenInSession();
      setProgress(100);
      setLocked(true);
      setParting(true);
      const pinTimer = window.setTimeout(() => setUnmounted(true), 120);
      return () => window.clearTimeout(pinTimer);
    }

    let cancelled = false;
    let rafId = 0;
    let fontStartTimer: number | undefined;
    let lockTimer: number | undefined;
    let unmountTimer: number | undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Accessible reduced-motion mode: static clear frame (held for visual QA review unless ?intro=hold)
    if (prefersReducedMotion) {
      setProgress(100);
      setLocked(true);
      if (!isHoldPreview) {
        lockTimer = window.setTimeout(() => {
          if (cancelled || skippedRef.current) return;
          markIntroSeenInSession();
          setParting(true);
          unmountTimer = window.setTimeout(() => {
            if (!cancelled) setUnmounted(true);
          }, 420);
        }, 5500);
      }

      return () => {
        cancelled = true;
        if (lockTimer) window.clearTimeout(lockTimer);
        if (unmountTimer) window.clearTimeout(unmountTimer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    // Visual QA Inspection Timing (3.5s smooth iris focus + 5.5s shutter-lock hold)
    const calibrationMs = 3500;
    const holdDwellMs = 5500;
    const curtainExitMs = 750;

    const runSequence = () => {
      if (cancelled || skippedRef.current) return;
      const start = performance.now();

      const tick = (now: number) => {
        if (cancelled || skippedRef.current) return;
        const elapsed = now - start;
        const ratio = Math.min(1, elapsed / calibrationMs);
        const eased =
          ratio < 0.5
            ? 4 * ratio * ratio * ratio
            : 1 - Math.pow(-2 * ratio + 2, 3) / 2;
        setProgress(Math.round(eased * 100));

        if (ratio < 1) {
          rafId = window.requestAnimationFrame(tick);
        } else {
          markIntroSeenInSession();
          setLocked(true);

          if (!isHoldPreview) {
            lockTimer = window.setTimeout(() => {
              if (cancelled || skippedRef.current) return;
              setParting(true);
              unmountTimer = window.setTimeout(() => {
                if (!cancelled) setUnmounted(true);
              }, curtainExitMs);
            }, holdDwellMs);
          }
        }
      };

      rafId = window.requestAnimationFrame(tick);
    };

    const fontPromise =
      typeof document !== 'undefined' && document.fonts?.ready
        ? Promise.race([
            document.fonts.ready,
            new Promise<void>((resolve) => window.setTimeout(resolve, 260)),
          ])
        : Promise.resolve();

    fontStartTimer = window.setTimeout(() => {
      void fontPromise.then(() => {
        if (!cancelled) runSequence();
      });
    }, 60);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      if (fontStartTimer) window.clearTimeout(fontStartTimer);
      if (lockTimer) window.clearTimeout(lockTimer);
      if (unmountTimer) window.clearTimeout(unmountTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [triggerExit]);

  if (unmounted) return null;

  const pctStr = `${String(progress).padStart(3, '0')}%`;
  const fStop = resolveFStopLabel(progress);
  const irisRotation = -18 + (progress / 100) * 18;
  const irisScale = 0.92 + (progress / 100) * 0.1;
  const focusBlurPx = Math.max(0, 4 * (1 - Math.min(1, progress / 52)));

  return (
    <div
      className={`loader is-entered ${locked ? 'is-locked' : ''} ${
        parting ? 'is-parting is-ready' : ''
      }`}
      id="loader"
      aria-hidden={parting}
    >
      <div className="loader-shutter-blade loader-shutter-top" aria-hidden="true" />
      <div className="loader-shutter-blade loader-shutter-bottom" aria-hidden="true" />

      {/* Anti-Banding Smooth Ambient Vignette & Subtle Film Grain */}
      <div className="loader-ambient" aria-hidden="true" />
      <div className="loader-grain" aria-hidden="true" />

      {/* Clear-Center Optical Iris Ring (blades stay strictly on the outer perimeter) */}
      <div
        className="loader-iris-stage"
        aria-hidden="true"
        style={{
          transform: `translate(-50%, -50%) scale(${irisScale.toFixed(3)}) rotate(${irisRotation.toFixed(1)}deg)`,
        }}
      >
        <svg viewBox="0 0 400 400" className="loader-iris-svg">
          {/* Outer degree barrel ring */}
          <circle
            cx="200"
            cy="200"
            r="186"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeDasharray="2 9"
            opacity="0.45"
          />
          <circle
            cx="200"
            cy="200"
            r="174"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.22"
          />
          {/* Perimeter octagonal diaphragm chords (tangent outside r=134 so center stays 100% clear) */}
          {APERTURE_BLADES.map((angle) => (
            <line
              key={angle}
              x1="92"
              y1="66"
              x2="322"
              y2="66"
              stroke="currentColor"
              strokeWidth="0.85"
              opacity="0.34"
              transform={`rotate(${angle} 200 200)`}
            />
          ))}
          {/* Clean inner clear aperture ring */}
          <circle
            cx="200"
            cy="200"
            r="134"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            opacity="0.28"
          />
        </svg>
      </div>

      <div className="loader-core">
        <span className="loader-reticle tl" aria-hidden="true" />
        <span className="loader-reticle tr" aria-hidden="true" />
        <span className="loader-reticle bl" aria-hidden="true" />
        <span className="loader-reticle br" aria-hidden="true" />

        <div className="loader-kicker" dir="ltr">
          <span>35MM</span>
          <span className="loader-kicker-dot">·</span>
          <span className="loader-kicker-fstop">{fStop}</span>
        </div>

        <div
          className="loader-text"
          style={{
            filter: focusBlurPx > 0.05 ? `blur(${focusBlurPx.toFixed(2)}px)` : 'none',
          }}
        >
          {brandDisplay}
        </div>

        <div className="loader-subtitle">{subtitleDisplay}</div>

        <div className="loader-telemetry">
          <div className="loader-bar">
            <div
              className="loader-bar-inner"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
          <div className="loader-meter-row" dir="ltr">
            <span className="loader-status-label">
              {locked ? 'SHUTTER READY' : 'PULLING FOCUS'}
            </span>
            <span className="loader-meter-pct">{pctStr}</span>
          </div>
        </div>
      </div>

      {!parting && (
        <button
          type="button"
          className="loader-skip-btn"
          onClick={triggerExit}
          aria-label={activeLang === 'ar' ? 'تخطي شاشة الافتتاح' : 'Skip intro'}
        >
          <span>{activeLang === 'ar' ? 'تخطي' : 'Skip'}</span>
          <i className={`fas ${activeLang === 'ar' ? 'fa-chevron-left' : 'fa-chevron-right'}`} />
        </button>
      )}
    </div>
  );
};
