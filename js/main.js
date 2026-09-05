// Entry point: boots the App once the DOM is ready.

import { App } from './ui/App.js';

document.addEventListener('DOMContentLoaded', () => {
  new App().init();
});
