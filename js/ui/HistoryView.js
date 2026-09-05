// HistoryView lets the GM switch the log panel between the live "Current
// Battle" and any archived past battle (filed away by Reset Tournament).
// Purely a display toggle — it doesn't own or mutate game state.

export class HistoryView {
  constructor({ select, archivedLog, currentLogWrap }) {
    this.select = select;
    this.archivedLog = archivedLog;
    this.currentLogWrap = currentLogWrap;
    this.viewing = 'current'; // 'current' or a battle number as a string
  }

  setViewing(value) {
    this.viewing = value;
  }

  render(state) {
    const options = ['<option value="current">Current Battle</option>']
      .concat(state.battleHistory.map(b => `<option value="${b.number}">Battle ${b.number}</option>`));
    this.select.innerHTML = options.join('');

    // If the battle being viewed no longer exists (shouldn't normally happen), fall back.
    const stillExists = this.viewing === 'current' || state.battleHistory.some(b => String(b.number) === this.viewing);
    if (!stillExists) this.viewing = 'current';

    this.select.value = this.viewing;

    const isCurrent = this.viewing === 'current';
    this.currentLogWrap.style.display = isCurrent ? '' : 'none';
    this.archivedLog.style.display = isCurrent ? 'none' : '';

    if (!isCurrent) {
      const battle = state.battleHistory.find(b => String(b.number) === this.viewing);
      this.archivedLog.innerHTML = battle ? battle.logHtml : '';
    }
  }
}
