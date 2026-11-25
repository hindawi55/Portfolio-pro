import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../../types';

interface SegmentedPinVaultProps {
  currentLang: Language;
  value: string;
  onChange: (nextPin: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  onSubmitReady?: () => void;
}

type VaultMode = '4-digit' | '6-digit' | 'extended';

export const SegmentedPinVault: React.FC<SegmentedPinVaultProps> = ({
  currentLang,
  value,
  onChange,
  hasError = false,
  disabled = false,
  onSubmitReady,
}) => {
  const isAr = currentLang === 'ar';
  const [showPin, setShowPin] = useState(false);
  const [peekIndex, setPeekIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<VaultMode>('4-digit');
  const cellRefs = useRef<Array<HTMLInputElement | null>>([]);
  const peekTimerRef = useRef<number | null>(null);

  const cellCount = mode === '4-digit' ? 4 : mode === '6-digit' ? 6 : 0;

  // Automatically promote to extended or 6-digit mode if an external/URL value exceeds 4 chars
  useEffect(() => {
    if (value.length > 6 && mode !== 'extended') {
      setMode('extended');
    } else if (value.length > 4 && value.length <= 6 && mode === '4-digit') {
      setMode('6-digit');
    }
  }, [value, mode]);

  useEffect(() => {
    return () => {
      if (peekTimerRef.current) window.clearTimeout(peekTimerRef.current);
    };
  }, []);

  const triggerPeek = (idx: number) => {
    if (peekTimerRef.current) window.clearTimeout(peekTimerRef.current);
    setPeekIndex(idx);
    peekTimerRef.current = window.setTimeout(() => {
      setPeekIndex(null);
    }, 750);
  };

  const sanitizeChar = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '');

  const handleCellChange = (idx: number, rawInput: string) => {
    if (disabled) return;
    const cleaned = sanitizeChar(rawInput);
    const prevChar = value[idx] || '';

    // Multi-char autofill / SMS OTP drop (3+ chars), while 2 chars means typing over an existing visible digit
    if (cleaned.length >= 3) {
      handleBulkFill(cleaned);
      return;
    }

    const nextSingle =
      cleaned.length === 2 && prevChar
        ? cleaned.startsWith(prevChar)
          ? cleaned.slice(1)
          : cleaned.slice(0, 1)
        : cleaned.slice(-1);

    const chars = Array.from({ length: cellCount }, (_, i) => value[i] || '');
    chars[idx] = nextSingle;
    const joined = chars.join('');
    onChange(joined);

    if (nextSingle) {
      triggerPeek(idx);
      if (idx + 1 < cellCount) {
        cellRefs.current[idx + 1]?.focus();
      }
    }
  };

  const handleBulkFill = (rawText: string) => {
    const cleaned = sanitizeChar(rawText).slice(0, 32);
    if (!cleaned) return;
    if (cleaned.length > 6) {
      setMode('extended');
      onChange(cleaned);
      return;
    }
    if (cleaned.length > 4 && mode === '4-digit') {
      setMode('6-digit');
    }
    const targetLen = cleaned.length > 4 ? 6 : cellCount || 4;
    onChange(cleaned.slice(0, targetLen));
    const focusIdx = Math.min(cleaned.length - 1, targetLen - 1);
    window.setTimeout(() => cellRefs.current[focusIdx]?.focus(), 10);
  };

  const handleCellKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      const chars = Array.from({ length: cellCount }, (_, i) => value[i] || '');
      if (chars[idx]) {
        chars[idx] = '';
        onChange(chars.join(''));
      } else if (idx > 0) {
        chars[idx - 1] = '';
        onChange(chars.join(''));
        cellRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      cellRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx + 1 < cellCount) {
      e.preventDefault();
      cellRefs.current[idx + 1]?.focus();
    } else if (e.key === 'Enter' && value.trim().length >= 3 && onSubmitReady) {
      onSubmitReady();
    }
  };

  const handleCycleMode = () => {
    const next: VaultMode =
      mode === '4-digit' ? '6-digit' : mode === '6-digit' ? 'extended' : '4-digit';
    setMode(next);
    if (next === '4-digit' && value.length > 4) {
      onChange(value.slice(0, 4));
    } else if (next === '6-digit' && value.length > 6) {
      onChange(value.slice(0, 6));
    }
  };

  const modeBadgeLabel =
    mode === '4-digit'
      ? isAr
        ? '4 خانات · تبديل لـ 6'
        : '4 Digits · Switch to 6'
      : mode === '6-digit'
      ? isAr
        ? '6 خانات · رمز مطوّل'
        : '6 Digits · Extended'
      : isAr
      ? 'رمز حر · العودة لـ 4'
      : 'Custom Code · 4-Digit';

  return (
    <div className="portal-pin-vault">
      {/* Top control bar: Eye Show/Hide + Length Mode Switch */}
      <div className="pin-vault-controls">
        <button
          type="button"
          className="pin-eye-btn"
          onClick={() => setShowPin((prev) => !prev)}
          aria-pressed={showPin}
          aria-label={
            showPin
              ? isAr
                ? 'إخفاء رمز المرور'
                : 'Hide PIN'
              : isAr
              ? 'إظهار رمز المرور'
              : 'Show PIN'
          }
          disabled={disabled}
        >
          <i className={`fas ${showPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          <span>
            {showPin
              ? isAr
                ? 'إخفاء الأرقام'
                : 'Hide Digits'
              : isAr
              ? 'إظهار الأرقام'
              : 'Show Digits'}
          </span>
        </button>

        <button
          type="button"
          className="pin-mode-btn"
          onClick={handleCycleMode}
          disabled={disabled}
          title={isAr ? 'تغيير عدد خانات الرمز السري' : 'Switch PIN code length format'}
        >
          <i className="fas fa-sliders-h"></i>
          <span>{modeBadgeLabel}</span>
        </button>
      </div>

      {/* Segmented Frosted-Glass Cells OR Extended Single Frosted Input */}
      {mode === 'extended' ? (
        <div className={`portal-input-wrap extended-frosted ${hasError ? 'is-error' : ''}`}>
          <i className="fas fa-key"></i>
          <input
            type={showPin ? 'text' : 'password'}
            dir="ltr"
            value={value}
            onChange={(e) => onChange(sanitizeChar(e.target.value).slice(0, 32))}
            placeholder={isAr ? 'أدخل رمز الجلسة المخصص' : 'Enter extended session PIN'}
            disabled={disabled}
            autoComplete="one-time-code"
            autoFocus
            required
          />
        </div>
      ) : (
        <div
          className={`pin-vault-grid ${hasError ? 'is-error' : ''} ${
            cellCount === 6 ? 'is-six' : 'is-four'
          }`}
          dir="ltr"
          role="group"
          aria-label={isAr ? 'خانات رمز الوصول السري' : 'Access PIN digit cells'}
        >
          {Array.from({ length: cellCount }).map((_, idx) => {
            const char = value[idx] || '';
            const isCharVisible = showPin || peekIndex === idx;
            const displayVal = char ? (isCharVisible ? char : '•') : '';

            return (
              <div
                key={idx}
                className={`pin-vault-cell ${char ? 'is-filled' : ''} ${
                  isCharVisible && char ? 'is-revealed' : ''
                }`}
              >
                <input
                  ref={(el) => {
                    cellRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  disabled={disabled}
                  value={displayVal}
                  aria-label={`${isAr ? 'خانة الرمز' : 'PIN digit'} ${idx + 1}`}
                  autoFocus={idx === 0}
                  onFocus={(e) => e.currentTarget.select()}
                  onPaste={(e) => {
                    e.preventDefault();
                    handleBulkFill(e.clipboardData.getData('text'));
                  }}
                  onChange={(e) => {
                    const nextRaw = e.target.value;
                    // Strip mask dot if user typed directly into a masked filled cell
                    const stripped = nextRaw.replace(/•/g, '');
                    handleCellChange(idx, stripped);
                  }}
                  onKeyDown={(e) => handleCellKeyDown(idx, e)}
                  className="pin-cell-input"
                />
                <span className="pin-cell-underline" aria-hidden="true"></span>
              </div>
            );
          })}
        </div>
      )}

      <p className="pin-vault-hint">
        <i className="fas fa-shield-alt"></i>
        <span>
          {isAr
            ? 'تظهر الأرقام لحظياً أثناء الإدخال ثم تُخفى تلقائياً — ويمكنك التبديل بزر العين في أي وقت.'
            : 'Digits flash briefly as you type for accuracy — toggle full visibility anytime with the eye control.'}
        </span>
      </p>
    </div>
  );
};
