// Logger wraps the Combat Log DOM element: append entries, and read/write
// its raw HTML so undo can snapshot and restore it verbatim.

export class Logger {
  constructor(el) {
    this.el = el;
  }

  log(text) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = text;
    this.el.prepend(entry);
  }

  getHtml() {
    return this.el.innerHTML;
  }

  setHtml(html) {
    this.el.innerHTML = html;
  }
}
