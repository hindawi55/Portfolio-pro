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
  // Mirrors real aperture stop down during contraction (0..38%) then wide-open pull (38..100%)
  if (progress < 14) return 'f/2.8';
  if (progress < 26) return 'f/5.6';
  if (progress < 46) return 'f/8.0';
  if (progress < 64) return 'f/4.0';
  if (progress < 82) return 'f/2.0';
  return 'f/1.4';
}

function resolveIrisSwingDeg(progress: number): number {
  // Smooth two-phase mechanical cycle:
  // 0% -> 38%: blades emerge from bezel and swing inward (-8° -> +41°), contracting the pupil
  // 38% -> 100%: blades sweep outward (+41° -> -19°), folding cleanly behind the housing rim at f/1.4
  if (progress <= 38) {
    const t = Math.max(0, Math.min(1, progress / 38));
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return -8 + eased * 49;
  }
  const t = Math.max(0, Math.min(1, (progress - 38) / 62));
  const eased = 1 - Math.pow(1 - t, 3);
  return 41 - eased * 60;
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

    const seenInSession = (() => {
      try {
        return sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
      } catch {
        return false;
      }
    })();

    // Accessible reduced-motion mode: static clear frame with calm fade (unless ?intro=hold)
    if (prefersReducedMotion) {
      setProgress(100);
      setLocked(true);
      if (!isHoldPreview) {
        const reducedHoldMs = seenInSession ? 650 : 1100;
        lockTimer = window.setTimeout(() => {
          if (cancelled || skippedRef.current) return;
          markIntroSeenInSession();
          setParting(true);
          unmountTimer = window.setTimeout(() => {
            if (!cancelled) setUnmounted(true);
          }, 420);
        }, reducedHoldMs);
      }

      return () => {
        cancelled = true;
        if (lockTimer) window.clearTimeout(lockTimer);
        if (unmountTimer) window.clearTimeout(unmountTimer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    // Global production timing: 3.0s first visit (1.95s iris + 0.35s hold + 0.70s exit), 2.0s repeat visit
    const calibrationMs = seenInSession ? 1150 : 1950;
    const holdDwellMs = seenInSession ? 200 : 350;
    const curtainExitMs = seenInSession ? 650 : 700;

    const runSequence = () => {
      if (cancelled || skippedRef.current) return;
      const start = performance.now();

      const tick = (now: number) => {
        if (cancelled || skippedRef.current) return;
        const elapsed = now - start;
        const ratio = Math.min(1, elapsed / calibrationMs);
        setProgress(Math.round(ratio * 100));

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
  const bladeSwingDeg = resolveIrisSwingDeg(progress);
  const barrelRotationDeg = -14 + (progress / 100) * 14;
  const focusBlurPx =
    progress < 38
      ? 1.2 + (progress / 38) * 2.2
      : Math.max(0, 3.4 * (1 - Math.min(1, (progress - 38) / 48)));

  const statusText = locked
    ? 'SHUTTER READY'
    : progress < 38
    ? 'STOPPING DOWN'
    : 'PULLING FOCUS';

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

      {/* Precision Mechanical Pivot-Pin Iris & Cardinal Crosshairs (Option A) */}
      <div
        className="loader-iris-stage"
        aria-hidden="true"
        style={{
          transform: `translate(-50%, -50%) rotate(${barrelRotationDeg.toFixed(1)}deg)`,
        }}
      >
        <svg viewBox="0 0 400 400" className="loader-iris-svg">
          <defs>
            <clipPath id="loaderIrisClip">
              <circle cx="200" cy="200" r="172" />
            </clipPath>
          </defs>

          {/* Outer Focus Barrel Scale */}
          <circle
            cx="200"
            cy="200"
            r="188"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.95"
            strokeDasharray="2 9"
            opacity="0.48"
          />

          {/* 4 Cardinal Optical Calibration Marks (Strictly Outside Dotted Scale, Clear Gap) */}
          <g className="loader-iris-crosshairs" stroke="currentColor" strokeLinecap="round">
            <line x1="200" y1="2" x2="200" y2="9" strokeWidth="1.5" opacity="0.88" />
            <line x1="200" y1="391" x2="200" y2="398" strokeWidth="1.5" opacity="0.88" />
            <line x1="2" y1="200" x2="9" y2="200" strokeWidth="1.5" opacity="0.88" />
            <line x1="391" y1="200" x2="398" y2="200" strokeWidth="1.5" opacity="0.88" />
          </g>

          {/* Clipped 8-Blade Overlapping Mechanical Diaphragm */}
          <g clipPath="url(#loaderIrisClip)">
            {APERTURE_BLADES.map((angle) => (
              <path
                key={angle}
                d="M 200 28 C 295 -30, 395 -8, 425 98 Q 392 106, 358 112 Q 288 58, 200 28 Z"
                className="loader-iris-blade"
                transform={`rotate(${angle} 200 200) rotate(${bladeSwingDeg.toFixed(2)} 200 28)`}
              />
            ))}
          </g>

          {/* Crisp Lens Housing Rim */}
          <circle
            cx="200"
            cy="200"
            r="172"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            opacity="0.46"
          />
        </svg>
      </div>

      <div className="loader-core">
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
            <span className="loader-status-label">{statusText}</span>
            <span className="loader-meter-pct">{pctStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
