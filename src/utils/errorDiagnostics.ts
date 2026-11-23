export type DiagnosticSeverity = 'warning' | 'error' | 'critical';

export interface DiagnosticErrorReport {
  id: string;
  timestamp: string;
  module: string;
  action: string;
  message: string;
  stack?: string;
  componentStack?: string;
  severity: DiagnosticSeverity;
}

const MAX_DIAGNOSTIC_ENTRIES = 30;
const DIAGNOSTIC_STORAGE_KEY = 'eao_diagnostic_log';

const diagnosticHistory: DiagnosticErrorReport[] = [];
let globalGuardsInstalled = false;

declare global {
  interface Window {
    __EAO_DIAGNOSTICS__?: {
      getHistory: () => DiagnosticErrorReport[];
      clearHistory: () => void;
    };
  }
}

function generateErrorCode(): string {
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const timePart = Date.now().toString(36).slice(-3).toUpperCase();
  return `ERR-${timePart}${randomPart}`;
}

export function normalizeError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return {
      message: err.message || err.name || 'Unknown runtime error',
      stack: err.stack,
    };
  }
  if (typeof err === 'string') {
    return { message: err };
  }
  try {
    return { message: JSON.stringify(err) };
  } catch {
    return { message: String(err) };
  }
}

export function recordDiagnosticError(params: {
  module: string;
  action: string;
  error: unknown;
  componentStack?: string;
  severity?: DiagnosticSeverity;
}): DiagnosticErrorReport {
  const { message, stack } = normalizeError(params.error);
  const report: DiagnosticErrorReport = {
    id: generateErrorCode(),
    timestamp: new Date().toISOString(),
    module: params.module,
    action: params.action,
    message,
    stack: stack ? stack.split('\n').slice(0, 8).join('\n') : undefined,
    componentStack: params.componentStack
      ? params.componentStack.trim().split('\n').slice(0, 8).join('\n')
      : undefined,
    severity: params.severity || 'error',
  };

  diagnosticHistory.unshift(report);
  if (diagnosticHistory.length > MAX_DIAGNOSTIC_ENTRIES) {
    diagnosticHistory.pop();
  }

  // Persist a lightweight session copy for post-mortem debugging without ever throwing
  try {
    sessionStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(diagnosticHistory));
  } catch {
    // Ignore storage quota / private-mode restrictions
  }

  // Structured developer console report pinpointing exact module, action, cause, and stack
  try {
    console.groupCollapsed(
      `[EAO Diagnostic][${report.severity.toUpperCase()}] ${report.id} — ${report.module} :: ${report.action}`
    );
    console.error('Cause:', report.message);
    if (report.stack) console.error('Location / Stack:\n', report.stack);
    if (report.componentStack) console.error('Component Tree:\n', report.componentStack);
    console.info('Timestamp:', report.timestamp);
    console.groupEnd();
  } catch {
    // Fallback if console grouping is unavailable
  }

  return report;
}

export function formatDiagnosticReport(report: DiagnosticErrorReport): string {
  const lines = [
    `Error Code: ${report.id}`,
    `Severity: ${report.severity.toUpperCase()}`,
    `Module: ${report.module}`,
    `Action: ${report.action}`,
    `Cause: ${report.message}`,
    `Timestamp: ${report.timestamp}`,
  ];
  if (report.stack) {
    lines.push(`Stack Trace:\n${report.stack}`);
  }
  if (report.componentStack) {
    lines.push(`Component Tree:\n${report.componentStack}`);
  }
  return lines.join('\n');
}

/**
 * Executes a synchronous operation safely inside try/catch, recording exact location & cause on failure.
 */
export function safeRun<T>(
  module: string,
  action: string,
  fn: () => T,
  fallback: T,
  severity: DiagnosticSeverity = 'warning'
): T {
  try {
    return fn();
  } catch (error) {
    recordDiagnosticError({ module, action, error, severity });
    return fallback;
  }
}

/**
 * Executes an async operation safely inside try/catch, recording exact location & cause on failure.
 */
export async function safeRunAsync<T>(
  module: string,
  action: string,
  fn: () => Promise<T>,
  fallback: T,
  severity: DiagnosticSeverity = 'warning'
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    recordDiagnosticError({ module, action, error, severity });
    return fallback;
  }
}

/**
 * Copies text to clipboard safely with textarea fallback and diagnostic logging.
 */
export async function copyTextSafely(
  module: string,
  text: string
): Promise<boolean> {
  return safeRunAsync(
    module,
    'copyTextSafely',
    async () => {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    },
    false,
    'warning'
  );
}

/**
 * Installs global window error and unhandledrejection listeners once at app startup
 * so unexpected runtime failures are always captured and diagnosed cleanly.
 */
export function installGlobalErrorGuards(): void {
  if (globalGuardsInstalled || typeof window === 'undefined') return;
  globalGuardsInstalled = true;

  window.__EAO_DIAGNOSTICS__ = {
    getHistory: () => [...diagnosticHistory],
    clearHistory: () => {
      diagnosticHistory.length = 0;
      try {
        sessionStorage.removeItem(DIAGNOSTIC_STORAGE_KEY);
      } catch {}
    },
  };

  window.addEventListener('error', (event: ErrorEvent) => {
    // Ignore benign cross-origin script or WebSocket HMR noise
    if (!event.error && event.message === 'Script error.') return;
    recordDiagnosticError({
      module: event.filename ? event.filename.split('/').pop() || 'WindowRuntime' : 'WindowRuntime',
      action: `line:${event.lineno || 0}:col:${event.colno || 0}`,
      error: event.error || event.message || 'Unhandled window error',
      severity: 'error',
    });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    recordDiagnosticError({
      module: 'AsyncPromiseRuntime',
      action: 'unhandledrejection',
      error: event.reason || 'Unhandled promise rejection',
      severity: 'error',
    });
  });
}
