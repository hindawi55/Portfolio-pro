import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Language } from '../types';
import { useSiteCMS } from '../context/SiteCMSContext';
import { FALLBACK_IMAGE_URL, resolveAssetUrl } from '../utils/assets';

interface AboutProps {
  currentLang: Language;
}

/**
 * Strips legacy trailing separators (e.g. "Enaam Ali Osman ·" or "EAO-")
 * so older CMS text overrides still render cleanly in the editorial colophon.
 */
function cleanEditorialToken(value: string | undefined, fallback: string): string {
  const cleaned = (value || '').replace(/[\s·•\-–—]+$/g, '').trim();
  return cleaned || fallback;
}

export const About: React.FC<AboutProps> = ({ currentLang }) => {
  const { getTranslation, layout } = useSiteCMS();
  const t = getTranslation(currentLang);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const pointerRafRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const shutterTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const hasPlayedRevealRef = useRef(false);

  const [focusLocked, setFocusLocked] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [isRevealingDarkroom, setIsRevealingDarkroom] = useState(false);
  const [filmMode, setFilmMode] = useState<'color' | 'mono'>(
    layout.portraitDefaultMode || 'color'
  );
  const filmModeRef = useRef<'color' | 'mono'>(filmMode);
  filmModeRef.current = filmMode;

  // Sync default film mode whenever Admin Studio OS updates layout settings
  useEffect(() => {
    setFilmMode(layout.portraitDefaultMode || 'color');
  }, [layout.portraitDefaultMode]);

  const portraitSrc = layout.portraitUrl?.trim()
    ? resolveAssetUrl(layout.portraitUrl.trim())
    : FALLBACK_IMAGE_URL;

  const focusY =
    typeof layout.portraitFocusY === 'number'
      ? Math.min(100, Math.max(0, layout.portraitFocusY))
      : 38;

  const baseZoom =
    typeof layout.portraitZoom === 'number'
      ? Math.min(1.5, Math.max(1.0, layout.portraitZoom))
      : 1.06;

  const artistName = cleanEditorialToken(
    t.arch_name,
    currentLang === 'ar' ? 'إنعام علي عثمان' : 'Enaam Ali Osman'
  );
  const artistRole = cleanEditorialToken(
    t.arch_role,
    currentLang === 'ar' ? 'عدسة وثائقية' : 'Documentary Lens'
  );
  const platePrefix = cleanEditorialToken(t.arch_code_prefix, 'EAO');
  const plateNum = cleanEditorialToken(t.arch_code_num, 'ARCHIVE 01').replace(/-/g, ' ');

  // 1. Scroll-Linked Depth Parallax + One-Shot Living Darkroom Reveal on first sight
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stage = stageRef.current;
    if (!stage) return;

    let isVisible = false;

    const updateScrollParallax = () => {
      scrollRafRef.current = null;
      if (!isVisible || !stage || reducedMotion) return;

      const rect = stage.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const centerProgress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2);
      const clamped = Math.max(-1, Math.min(1, centerProgress));

      const plateShift = clamped * 11;
      const printShift = clamped * -4;
      stage.style.setProperty('--vf-scroll-plate', `${plateShift.toFixed(2)}px`);
      stage.style.setProperty('--vf-scroll-print', `${printShift.toFixed(2)}px`);
    };

    const scheduleParallax = () => {
      if (reducedMotion) return;
      if (scrollRafRef.current === null) {
        scrollRafRef.current = requestAnimationFrame(updateScrollParallax);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry?.isIntersecting ?? false;
        if (isVisible) {
          scheduleParallax();

          // Hybrid Gold Standard: trigger 1.65s Darkroom B&W-to-Color reveal ONCE when scrolled into view
          if (
            !hasPlayedRevealRef.current &&
            !reducedMotion &&
            filmModeRef.current === 'color' &&
            entry &&
            entry.intersectionRatio >= 0.3
          ) {
            hasPlayedRevealRef.current = true;
            setIsRevealingDarkroom(true);
            if (revealTimerRef.current !== null) {
              window.clearTimeout(revealTimerRef.current);
            }
            revealTimerRef.current = window.setTimeout(() => {
              setIsRevealingDarkroom(false);
            }, 1750);
          }
        }
      },
      { rootMargin: '80px 0px 80px 0px', threshold: [0, 0.32] }
    );

    observer.observe(stage);
    window.addEventListener('scroll', scheduleParallax, { passive: true });
    window.addEventListener('resize', scheduleParallax, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', scheduleParallax);
      window.removeEventListener('resize', scheduleParallax);
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
      if (pointerRafRef.current !== null) cancelAnimationFrame(pointerRafRef.current);
      if (shutterTimerRef.current !== null) window.clearTimeout(shutterTimerRef.current);
      if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
    };
  }, []);

  const triggerShutterPulse = useCallback(() => {
    setShutterFlash(true);
    if (shutterTimerRef.current !== null) {
      window.clearTimeout(shutterTimerRef.current);
    }
    shutterTimerRef.current = window.setTimeout(() => {
      setShutterFlash(false);
    }, 240);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = frameRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    const rotY = (nx - 0.5) * 6;
    const rotX = (0.5 - ny) * 6;
    const gx = Math.round(nx * 100);
    const gy = Math.round(ny * 100);

    if (pointerRafRef.current !== null) cancelAnimationFrame(pointerRafRef.current);
    pointerRafRef.current = requestAnimationFrame(() => {
      el.style.setProperty('--vf-rx', `${rotX.toFixed(2)}deg`);
      el.style.setProperty('--vf-ry', `${rotY.toFixed(2)}deg`);
      el.style.setProperty('--vf-gx', `${gx}%`);
      el.style.setProperty('--vf-gy', `${gy}%`);
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    if (pointerRafRef.current !== null) cancelAnimationFrame(pointerRafRef.current);
    pointerRafRef.current = requestAnimationFrame(() => {
      el.style.setProperty('--vf-rx', '0deg');
      el.style.setProperty('--vf-ry', '0deg');
      el.style.setProperty('--vf-gx', '50%');
      el.style.setProperty('--vf-gy', '35%');
    });
  }, []);

  const toggleFocusLock = useCallback(() => {
    setIsRevealingDarkroom(false);
    setFocusLocked((prev) => !prev);
    triggerShutterPulse();
  }, [triggerShutterPulse]);

  const handleFilmModeChange = useCallback(
    (nextMode: 'color' | 'mono') => {
      setIsRevealingDarkroom(false);
      if (nextMode === filmMode) return;
      setFilmMode(nextMode);
      triggerShutterPulse();
    },
    [filmMode, triggerShutterPulse]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFocusLock();
      }
    },
    [toggleFocusLock]
  );

  const portraitStyleVars = {
    '--vf-focus-y': `${focusY}%`,
    '--vf-zoom': String(baseZoom),
    '--vf-zoom-hover': String(Number((baseZoom + 0.035).toFixed(3))),
    '--vf-zoom-locked': String(Number((baseZoom + 0.095).toFixed(3))),
  } as React.CSSProperties;

  return (
    <section className="section about" id="about">
      <div className="section-header reveal active">
        <div className="section-label">{t.about_label}</div>
        <h2 className="section-title">{t.about_title}</h2>
        <p className="section-desc">{t.about_desc}</p>
      </div>

      <div className="about-grid">
        {/* Museum Monograph & Interactive Leica Optical Viewfinder Portrait */}
        <div ref={stageRef} className="vf-stage reveal active">
          <figure
            className={`vf-monograph ${focusLocked ? 'is-locked' : ''} ${
              filmMode === 'mono' ? 'is-mono' : 'is-color'
            }`}
          >
            <div className="vf-canvas-mount">
              {/* Architectural Offset Brass Hairline Plate with Scroll-Linked Depth Parallax */}
              <div className="vf-offset-plate" aria-hidden="true">
                <div className="vf-plate-glint"></div>
              </div>

              {/* Interactive 4:5 Edge-to-Edge Editorial Print Canvas */}
              <div
                ref={frameRef}
                className={`vf-canvas ${shutterFlash ? 'is-shutter' : ''}`}
                style={portraitStyleVars}
                role="button"
                tabIndex={0}
                aria-pressed={focusLocked}
                aria-label={
                  currentLang === 'ar'
                    ? 'معاينة عدسة المصورة — اضغط لتفعيل عزل الخلفية وتثبيت التركيز البصري'
                    : 'Photographer optical portrait — activate to toggle f/1.4 Eye-AF focus lock'
                }
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                onClick={toggleFocusLock}
                onKeyDown={handleKeyDown}
              >
                <img
                  src={portraitSrc}
                  alt={
                    currentLang === 'ar'
                      ? 'إنعام علي عثمان — مصورة وثائقية'
                      : 'Enaam Ali Osman — Documentary Photographer'
                  }
                  className="vf-photo-img"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== FALLBACK_IMAGE_URL) {
                      target.onerror = null;
                      target.src = FALLBACK_IMAGE_URL;
                    }
                  }}
                />

                {/* One-Shot Living Darkroom Reveal Curtain (B&W -> Color sweep on first scroll sight) */}
                {isRevealingDarkroom && (
                  <>
                    <div className="vf-darkroom-curtain" aria-hidden="true">
                      <img
                        src={portraitSrc}
                        alt=""
                        className="vf-photo-img vf-curtain-mono-img"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="vf-curtain-beam" aria-hidden="true"></span>
                  </>
                )}

                {/* True f/1.4 Shallow Depth-of-Field Bokeh Layer (Activates visibly on Focus Lock) */}
                <div className="vf-bokeh-dof" aria-hidden="true"></div>

                {/* Subtle Authentic Analog Film Grain Texture */}
                <div className="vf-film-grain" aria-hidden="true"></div>

                {/* Soft Edge Vignette & Museum Tonal Harmonizer */}
                <div className="vf-vignette" aria-hidden="true"></div>

                {/* Dynamic Optical Glass Sheen synced to Pointer */}
                <div className="vf-specular-sheen" aria-hidden="true"></div>

                {/* Whisper-Quiet Rule-of-Thirds Optical Composition Grid */}
                <div className="vf-thirds-grid" aria-hidden="true">
                  <span className="vf-line vf-line-v1"></span>
                  <span className="vf-line vf-line-v2"></span>
                  <span className="vf-line vf-line-h1"></span>
                  <span className="vf-line vf-line-h2"></span>
                </div>

                {/* Precision Rangefinder Corner Brackets + Eye-AF Lock Reticle */}
                <div className="vf-hud" aria-hidden="true">
                  <span className="vf-corner vf-c-tl"></span>
                  <span className="vf-corner vf-c-tr"></span>
                  <span className="vf-corner vf-c-bl"></span>
                  <span className="vf-corner vf-c-br"></span>

                  {/* Eye-AF Precision Lock Bracket positioned at the Golden-Ratio Eye Line */}
                  <div className="vf-eye-af">
                    <span className="vf-eye-corner vf-ec-tl"></span>
                    <span className="vf-eye-corner vf-ec-tr"></span>
                    <span className="vf-eye-corner vf-ec-bl"></span>
                    <span className="vf-eye-corner vf-ec-br"></span>
                    <span className="vf-eye-tag">
                      {focusLocked ? 'EYE AF' : 'AF'}
                    </span>
                  </div>
                </div>

                {/* Mechanical Shutter Exposure Flash Layer */}
                <div className="vf-shutter-veil" aria-hidden="true"></div>

                {/* Single-Line Unbreakable Optical Exposure Readout */}
                <div className="vf-optical-strip" aria-hidden="true">
                  <span className="vf-optical-spec">
                    35MM · {focusLocked ? 'f/1.4 DOF' : 'f/2.8'}
                  </span>
                  <span className={`vf-optical-mode ${focusLocked ? 'is-locked' : ''}`}>
                    {focusLocked ? 'AF-LOCK' : 'AF-C'}
                  </span>
                </div>
              </div>
            </div>

            {/* Unmistakable Interactive Darkroom Segmented Control (Discoverable UX) */}
            <div className="vf-darkroom-bar">
              <span className="vf-darkroom-label">
                <i className="fas fa-adjust" aria-hidden="true"></i>
                <span>{currentLang === 'ar' ? 'نمط الفيلم' : 'Film Look'}</span>
              </span>

              <div
                className="vf-seg-track"
                role="group"
                aria-label={
                  currentLang === 'ar'
                    ? 'تبديل نمط الصورة بين الألوان والأبيض والأسود'
                    : 'Switch portrait between Color and Monochrome B&W'
                }
              >
                <button
                  type="button"
                  className={`vf-seg-btn ${filmMode === 'color' ? 'is-active' : ''}`}
                  aria-pressed={filmMode === 'color'}
                  onClick={() => handleFilmModeChange('color')}
                >
                  {currentLang === 'ar' ? 'ألوان طبيعية' : 'Color'}
                </button>
                <button
                  type="button"
                  className={`vf-seg-btn ${filmMode === 'mono' ? 'is-active' : ''}`}
                  aria-pressed={filmMode === 'mono'}
                  onClick={() => handleFilmModeChange('mono')}
                >
                  {currentLang === 'ar' ? 'أبيض وأسود' : 'B&W Mono'}
                </button>
              </div>
            </div>

            {/* Clean Unboxed Museum Colophon */}
            <figcaption className="vf-colophon">
              <div className="vf-colophon-top">
                <div className="vf-colophon-identity">
                  <span className="vf-colophon-name">{artistName}</span>
                  <span className="vf-colophon-sep" aria-hidden="true">
                    /
                  </span>
                  <span className="vf-colophon-role">{artistRole}</span>
                </div>
                <span className="vf-colophon-plate">
                  {platePrefix} · {plateNum}
                </span>
              </div>

              <div className="vf-colophon-bottom">
                <span className="vf-colophon-hint">
                  {focusLocked
                    ? currentLang === 'ar'
                      ? 'تم تفعيل عزل الخلفية f/1.4 وقفل التركيز · اضغط للإلغاء'
                      : 'f/1.4 Eye-AF depth isolation active · Tap portrait to release'
                    : currentLang === 'ar'
                    ? 'اضغط على الصورة لتفعيل عزل العدسة f/1.4 وقفل التركيز'
                    : 'Tap portrait to engage f/1.4 Eye-AF focus isolation'}
                </span>
              </div>
            </figcaption>
          </figure>
        </div>

        <div className="about-content reveal active">
          <h3>{t.about_heading}</h3>
          <p>{t.about_p1}</p>
          <p>{t.about_p2}</p>
          <div className="about-stats">
            <div className="stat-item">
              <h4>2+</h4>
              <span>{t.stat_years}</span>
            </div>
            <div className="stat-item">
              <h4>57+</h4>
              <span>{t.stat_projects}</span>
            </div>
            <div className="stat-item">
              <h4>7+</h4>
              <span>{t.stat_workshops}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
