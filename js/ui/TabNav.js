// TabNav manages switching between the four bottom tabs and the small
// red "needs attention" dots (pending Hesitation, active Round 1 modifier).

export class TabNav {
  constructor() {
    this.panels = document.querySelectorAll('.tab-panel');
    this.buttons = document.querySelectorAll('.tab-btn');
    this.buttons.forEach(btn => btn.addEventListener('click', () => this.switchTo(btn.dataset.tab)));
  }

  switchTo(tabName) {
    this.panels.forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    this.buttons.forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    window.scrollTo(0, 0);
  }

  toggleDot(tabName, show) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    let dot = btn.querySelector('.tab-dot');
    if (show && !dot) { dot = document.createElement('span'); dot.className = 'tab-dot'; btn.appendChild(dot); }
    if (!show && dot) dot.remove();
  }

  updateBadges(state) {
    this.toggleDot('moderator', state.entities.some(e => e.forcedBasic));
    this.toggleDot('arena', state.round1Active);
  }
}
