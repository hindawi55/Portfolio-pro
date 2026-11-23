import React from 'react';
import { Language } from '../types';
import {
  DiagnosticErrorReport,
  copyTextSafely,
  formatDiagnosticReport,
  recordDiagnosticError,
} from '../utils/errorDiagnostics';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  moduleName: string;
  scope?: 'app' | 'section' | 'modal';
  currentLang?: Language;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  report: DiagnosticErrorReport | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      report: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const report = recordDiagnosticError({
      module: this.props.moduleName,
      action: 'ReactRenderBoundary',
      error,
      componentStack: errorInfo.componentStack || undefined,
      severity: this.props.scope === 'app' ? 'critical' : 'error',
    });

    this.setState({ report });
  }

  private resolveLanguage(): Language {
    if (this.props.currentLang) return this.props.currentLang;
    if (typeof document !== 'undefined' && document.documentElement.lang === 'ar') {
      return 'ar';
    }
    return 'en';
  }

  private handleRecover = (): void => {
    this.setState({
      hasError: false,
      report: null,
      showDetails: false,
      copied: false,
    });
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (error) {
        recordDiagnosticError({
          module: this.props.moduleName,
          action: 'onResetCallback',
          error,
          severity: 'warning',
        });
      }
    }
  };

  private handleSafeReload = (): void => {
    try {
      window.location.reload();
    } catch (error) {
      recordDiagnosticError({
        module: this.props.moduleName,
        action: 'windowReload',
        error,
        severity: 'warning',
      });
    }
  };

  private handleCopyReport = async (): Promise<void> => {
    if (!this.state.report) return;
    const ok = await copyTextSafely(
      this.props.moduleName,
      formatDiagnosticReport(this.state.report)
    );
    if (ok) {
      this.setState({ copied: true });
      setTimeout(() => {
        this.setState({ copied: false });
      }, 2800);
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const lang = this.resolveLanguage();
    const isAr = lang === 'ar';
    const scope = this.props.scope || 'section';
    const { report, showDetails, copied } = this.state;

    return (
      <div
        className={`error-boundary-shell scope-${scope}`}
        role="alert"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="error-boundary-card">
          <div className="error-boundary-header">
            <div className="error-boundary-icon" aria-hidden="true">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="error-boundary-titles">
              <span className="error-boundary-badge">
                {report?.id || 'ERR-SAFE'} · {this.props.moduleName}
              </span>
              <h3>
                {isAr
                  ? scope === 'app'
                    ? 'تم احتواء خطأ تقني لحماية الموقع'
                    : `تم عزل خطأ مؤقت في قسم (${this.props.moduleName})`
                  : scope === 'app'
                  ? 'A technical error was safely contained'
                  : `Temporary error isolated in ${this.props.moduleName}`}
              </h3>
            </div>
          </div>

          <p className="error-boundary-desc">
            {isAr
              ? scope === 'app'
                ? 'تعذّر عرض جزء من الواجهة مؤقتاً، لكن بياناتك وجلسة التصفح محمية بالكامل. يمكنك المحاولة مجدداً أو إعادة التحميل بأمان.'
                : 'تم عزل هذا الجزء تلقائياً لضمان استمرار عمل باقي أقسام الموقع دون أي انقطاع أو انهيار.'
              : scope === 'app'
              ? 'Part of the interface encountered an unexpected issue, but your session remains protected. You can retry or safely reload.'
              : 'This module was automatically isolated so the rest of the website continues working smoothly without interruption.'}
          </p>

          <div className="error-boundary-actions">
            <button
              type="button"
              className="error-btn-primary"
              onClick={this.handleRecover}
            >
              <i className="fas fa-redo-alt"></i>
              <span>
                {isAr
                  ? scope === 'modal'
                    ? 'إغلاق والعودة للموقع'
                    : 'إعادة المحاولة'
                  : scope === 'modal'
                  ? 'Close & Return'
                  : 'Try Again'}
              </span>
            </button>

            {scope === 'app' && (
              <button
                type="button"
                className="error-btn-secondary"
                onClick={this.handleSafeReload}
              >
                <i className="fas fa-sync"></i>
                <span>{isAr ? 'إعادة تحميل آمن' : 'Safe Reload'}</span>
              </button>
            )}

            <button
              type="button"
              className="error-btn-ghost"
              onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              aria-expanded={showDetails}
            >
              <i className={`fas ${showDetails ? 'fa-chevron-up' : 'fa-bug'}`}></i>
              <span>
                {isAr
                  ? showDetails
                    ? 'إخفاء التشخيص'
                    : 'تفاصيل التشخيص'
                  : showDetails
                  ? 'Hide Diagnostics'
                  : 'Diagnostic Details'}
              </span>
            </button>
          </div>

          {showDetails && report && (
            <div className="error-diag-panel">
              <div className="error-diag-meta">
                <div>
                  <strong>{isAr ? 'الموقع المتأثر:' : 'Affected Module:'}</strong>{' '}
                  <span>{report.module}</span>
                </div>
                <div>
                  <strong>{isAr ? 'سبب المشكلة:' : 'Root Cause:'}</strong>{' '}
                  <span>{report.message}</span>
                </div>
                <div>
                  <strong>{isAr ? 'الرمز المرجعي:' : 'Diagnostic Code:'}</strong>{' '}
                  <span dir="ltr">{report.id}</span>
                </div>
              </div>

              {(report.stack || report.componentStack) && (
                <pre className="error-diag-stack" dir="ltr">
                  {report.stack || report.componentStack}
                </pre>
              )}

              <button
                type="button"
                className="error-btn-copy"
                onClick={this.handleCopyReport}
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                <span>
                  {copied
                    ? isAr
                      ? 'تم نسخ تقرير التشخيص'
                      : 'Diagnostic Report Copied'
                    : isAr
                    ? 'نسخ تقرير التشخيص كاملاً'
                    : 'Copy Full Diagnostic Report'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}
