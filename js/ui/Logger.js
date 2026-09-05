// Logger wraps the Combat Log DOM element: append entries, and read/write
// its raw HTML so undo can snapshot and restore it verbatim. It also keeps
// an optional "latest entry" preview element in sync, so the persistent
// log bar can show the newest line without being expanded.

export class Logger {
  constructor(el, latestEl = null) {
    this.el = el;
    this.latestEl = latestEl;
  }

  log(text) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = text;
    this.el.prepend(entry);
    if (this.latestEl) this.latestEl.textContent = text;
  }

  getHtml() {
    return this.el.innerHTML;
  }

  setHtml(html) {
    this.el.innerHTML = html;
    if (this.latestEl) {
      const first = this.el.querySelector('.log-entry');
      this.latestEl.textContent = first ? first.textContent : 'No actions yet.';
    }
  }

  /** Wipes the live log (used right after archiving it as a past battle). */
  clear() {
    this.el.innerHTML = '';
    if (this.latestEl) this.latestEl.textContent = 'No actions yet.';
  }
}
