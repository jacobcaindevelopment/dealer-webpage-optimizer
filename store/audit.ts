import { DPOSession, HistoryEntry, Priority } from "@/lib/types";

const SESSION_KEY = "dpo_session";
const HISTORY_KEY = "dpo_history";
const FULL_AUDIT_PREFIX = "dpo_full_";
const MAX_HISTORY = 10;

export function saveSession(session: Partial<DPOSession> & { id: string }): void {
  if (typeof window === "undefined") return;
  const existing = getSession();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...(existing || {}), ...session }));
}

export function getSession(): DPOSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function saveToHistory(session: DPOSession): void {
  if (typeof window === "undefined") return;
  const history = getHistory();
  const entry: HistoryEntry = {
    id: session.id,
    domain: session.domain,
    createdAt: session.completedAt || session.createdAt,
    pageCount: session.results.length,
    topPriority: getTopPriority(session),
  };
  const updated = [entry, ...history.filter((h) => h.id !== entry.id)].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  saveFullAudit(session);
}

/**
 * Save full session so history items can be re-opened.
 * Strips rawHtml and large prose fields. If quota is exceeded,
 * removes the oldest stored audit and retries once.
 */
function saveFullAudit(session: DPOSession): void {
  const key = FULL_AUDIT_PREFIX + session.id;
  const lite: DPOSession = {
    ...session,
    results: session.results.map((r) => ({
      ...r,
      meta: r.meta ? { ...r.meta, rawHtml: "" } : null,
      // Trim large prose to reduce storage footprint
      suggestedContent: {
        ...r.suggestedContent,
        introParagraph: r.suggestedContent.introParagraph?.slice(0, 300) ?? "",
        faqs: r.suggestedContent.faqs?.slice(0, 3) ?? [],
        sections: r.suggestedContent.sections?.slice(0, 3) ?? [],
      },
    })),
  };

  try {
    localStorage.setItem(key, JSON.stringify(lite));
  } catch {
    // Quota likely exceeded — evict the oldest full audit and retry
    evictOldestFullAudit(session.id);
    try {
      localStorage.setItem(key, JSON.stringify(lite));
    } catch {
      // Still failing — skip silently
    }
  }
}

/** Remove the oldest full-audit entry (excluding the one we're about to write). */
function evictOldestFullAudit(currentId: string): void {
  const history = getHistory();
  // History is newest-first; remove from the tail
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].id !== currentId) {
      localStorage.removeItem(FULL_AUDIT_PREFIX + history[i].id);
      return;
    }
  }
}

/** Load a previously completed audit by ID for re-display on the results page. */
export function getFullAudit(id: string): DPOSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FULL_AUDIT_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getTopPriority(session: DPOSession): Priority {
  const priorities = session.results.map((r) => r.priority);
  if (priorities.includes("Fix Now")) return "Fix Now";
  if (priorities.includes("High Opportunity")) return "High Opportunity";
  if (priorities.includes("Needs Content Rebuild")) return "Needs Content Rebuild";
  return "Monitor";
}

export function generateId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
