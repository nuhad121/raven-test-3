/**
 * RAVEN - UI utilities: toast, theme, loaders, validation
 */
const RavenUI = {
  toast(message, type = 'info', duration = 3200) {
    let container = document.getElementById('raven-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'raven-toast-container';
      container.className = 'raven-toast-container';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `raven-toast raven-toast-${type}`;
    el.innerHTML = `<span>${message}</span><button type="button" aria-label="Close">&times;</button>`;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    const close = () => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    };
    el.querySelector('button').addEventListener('click', close);
    setTimeout(close, duration);
  },

  initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => this.toggleTheme());
    });
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    this.toast(`${next === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'info');
  },

  showLoader(target, rows = 4) {
    if (!target) return;
    target.innerHTML = Array(rows)
      .fill(0)
      .map(
        () =>
          `<div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-line w-75"></div><div class="skeleton-line w-50"></div></div>`
      )
      .join('');
  },

  starsHtml(rating, small = false) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < full) html += '<i class="bi bi-star-fill text-warning"></i>';
      else if (i === full && half) html += '<i class="bi bi-star-half text-warning"></i>';
      else html += '<i class="bi bi-star text-muted"></i>';
    }
    return `<span class="raven-stars ${small ? 'small' : ''}">${html}</span>`;
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validatePhone(phone) {
    return /^01[3-9]\d{8}$/.test(phone.replace(/\s/g, ''));
  },

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  initPasswordToggles(root = document) {
    root.querySelectorAll('[data-toggle-password]').forEach((btn) => {
      const id = btn.getAttribute('data-toggle-password');
      const input = id ? document.getElementById(id) : btn.previousElementSibling;
      if (!input) return;
      btn.addEventListener('click', () => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        const icon = btn.querySelector('i');
        if (icon) {
          icon.classList.toggle('bi-eye', !show);
          icon.classList.toggle('bi-eye-slash', show);
        }
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    });
  },

  passwordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['danger', 'warning', 'info', 'success'];
    const idx = Math.min(score, 3);
    return { score, label: labels[idx], color: colors[idx], percent: (score / 4) * 100 };
  },

  initPasswordStrength(inputId, barId) {
    const input = document.getElementById(inputId);
    const bar = document.getElementById(barId);
    if (!input || !bar) return;
    input.addEventListener('input', () => {
      const s = this.passwordStrength(input.value);
      bar.style.width = s.percent + '%';
      bar.className = `progress-bar bg-${s.color}`;
      const labelEl = bar.parentElement?.nextElementSibling;
      if (labelEl) labelEl.textContent = input.value ? s.label : '';
    });
  },

  formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  getQueryParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  },

  saveRecentSearch(q) {
    if (!q || q.length < 2) return;
    let recent = [];
    try {
      recent = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SEARCH)) || [];
    } catch {}
    recent = [q, ...recent.filter((r) => r !== q)].slice(0, 8);
    localStorage.setItem(STORAGE_KEYS.RECENT_SEARCH, JSON.stringify(recent));
  },

  getRecentSearches() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SEARCH)) || [];
    } catch {
      return [];
    }
  },

  smoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length > 1) {
          const target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  },

  pageLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      window.addEventListener('load', () => {
        setTimeout(() => loader.classList.add('hide'), 400);
      });
    }
  },
};
