/* SMART NER — Main Application Controller & Event Dispatcher */

class SmartNERApp {
  constructor() {
    this.currentView = 'splash-view';
    this.activeRouteIndex = 1; // Default to Route B
    this.maps = {};

    this.init();
  }

  init() {
    // 1. Initialize Splash Screen
    new SplashAnimation('splash-canvas', () => {
      this.switchView('landing-view');
    });

    // 2. Setup Navigation, Forms, Modals & ScrollSpy
    this.setupNavigation();
    this.setupFormsAndModals();
    this.setupScrollSpy();
    this.fetchLiveWeatherAPI();

    // 3. Subscribe to Centralized StateStore
    if (window.store) {
      window.store.subscribe((state) => this.onStateUpdated(state));
    }

    this.renderAdminTable();
  }

  onStateUpdated(state) {
    // Sync User UI Labels
    const greetingEl = document.getElementById('user-display-name');
    if (greetingEl) greetingEl.textContent = state.currentUser.name;

    const headerNameEl = document.getElementById('header-user-name');
    const headerRoleEl = document.getElementById('header-user-role');
    if (headerNameEl) headerNameEl.textContent = state.currentUser.name;
    if (headerRoleEl) headerRoleEl.textContent = state.currentUser.role;

    const profNameEl = document.getElementById('profile-display-name');
    const profRoleEl = document.getElementById('profile-display-role');
    if (profNameEl) profNameEl.textContent = state.currentUser.name;
    if (profRoleEl) profRoleEl.textContent = `${state.currentUser.role} | ${state.currentUser.organization}`;

    // Admin Telemetry Counters
    if (document.getElementById('admin-users')) {
      document.getElementById('admin-users').textContent = (1420 + state.shipments.length * 2).toLocaleString();
      document.getElementById('admin-shipments').textContent = state.shipments.length;
      document.getElementById('admin-routes').textContent = 36;
      document.getElementById('admin-alerts').textContent = state.alerts.length;
    }

    const timeEl = document.getElementById('admin-last-updated-time');
    if (timeEl) timeEl.textContent = `Last updated: ${state.lastUpdatedTime}`;

    this.renderAdminTable();
  }

  async fetchLiveWeatherAPI() {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=26.1445&longitude=91.7362&current_weather=true');
      if (!res.ok) throw new Error('Weather API offline');
      const data = await res.json();
      if (data && data.current_weather) {
        this.liveWeatherData = data.current_weather;
        const weatherEl = document.getElementById('weather-text');
        if (weatherEl) {
          weatherEl.textContent = `Guwahati Live Radar: ${this.liveWeatherData.temperature}°C | Wind ${this.liveWeatherData.windspeed} km/h`;
        }
      }
    } catch (err) {
      console.warn('Open-Meteo Weather API fallback:', err);
    }
  }

  renderAdminTable(filterStatus = 'ALL') {
    const tbody = document.getElementById('admin-table-tbody');
    if (!tbody || !window.store) return;

    let list = window.store.state.shipments;
    if (filterStatus !== 'ALL') {
      list = list.filter((s) => s.status === filterStatus);
    }

    tbody.innerHTML = list.map((s) => `
      <tr>
        <td style="font-weight: 700; color: var(--cyan-primary);">${s.id}</td>
        <td>${s.source}</td>
        <td>${s.destination}</td>
        <td>${s.cargo} (${s.weight} kg)</td>
        <td>${s.vehicle}</td>
        <td><span class="risk-badge ${s.status === 'IN TRANSIT' ? 'low' : s.status === 'DELAYED' ? 'high' : 'medium'}">${s.status}</span></td>
        <td>${s.eta}</td>
        <td>${s.accessibilityScore}/100</td>
        <td><button class="btn-secondary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="app.switchActiveShipment('${s.id}')">Track</button></td>
      </tr>
    `).join('');
  }

  filterAdminTable(status) {
    this.renderAdminTable(status);
    this.showToast(`Filtered Data Center by status: ${status}`);
  }

  refreshAdminData() {
    if (window.store) {
      window.store.state.lastUpdatedTime = new Date().toLocaleTimeString();
      window.store.notify();
    }
    this.showToast('✓ Admin Data Center Refreshed (Single Source of Truth Connected)');
  }

  switchActiveShipment(shipmentId) {
    if (!window.store) return;
    const shipment = window.store.state.shipments.find((s) => s.id === shipmentId);
    if (!shipment) return;

    const titleEl = document.getElementById('current-track-shipment-id');
    if (titleEl) titleEl.textContent = shipment.id;

    const trackTitle = document.getElementById('track-id-title');
    if (trackTitle) trackTitle.textContent = shipment.id;

    const routeSub = document.getElementById('track-route-subtitle');
    if (routeSub) routeSub.textContent = `${shipment.source} → ${shipment.destination}`;

    const vehicleVal = document.getElementById('track-vehicle-val');
    if (vehicleVal) vehicleVal.textContent = shipment.vehicle;

    const cargoVal = document.getElementById('track-cargo-val');
    if (cargoVal) cargoVal.textContent = `${shipment.cargo} (${shipment.weight} kg)`;

    const posVal = document.getElementById('track-pos-val');
    if (posVal) posVal.textContent = shipment.currentLocation;

    const etaVal = document.getElementById('track-eta-val');
    if (etaVal) etaVal.textContent = shipment.eta;

    const remVal = document.getElementById('track-rem-val');
    if (remVal) remVal.textContent = `${shipment.distanceRemaining} km`;

    const speedVal = document.getElementById('track-speed-val');
    if (speedVal) speedVal.textContent = shipment.speed;

    const statusBadge = document.getElementById('tracking-status-badge');
    if (statusBadge) {
      statusBadge.textContent = shipment.status;
      statusBadge.className = `risk-badge ${shipment.status === 'IN TRANSIT' ? 'low' : shipment.status === 'DELAYED' ? 'high' : 'medium'}`;
    }

    this.switchView('tracking-view');
    this.showToast(`🚚 Switched active live tracking to ${shipment.id}`);
  }

  setMapLayer(layerName, btnEl) {
    if (btnEl) {
      document.querySelectorAll('.layer-btn').forEach((b) => b.classList.remove('active'));
      btnEl.classList.add('active');
    }
    if (this.maps['tracking-map']) {
      this.maps['tracking-map'].setLayer(layerName);
    }
    this.showToast(`Map layer changed to ${layerName.toUpperCase()}`);
  }

  toggleFullscreenMap() {
    const panel = document.getElementById('tracking-map-panel');
    if (!panel) return;
    if (!document.fullscreenElement) {
      panel.requestFullscreen().catch((err) => console.warn(err));
    } else {
      document.exitFullscreen();
    }
  }

  calculateDynamicScore(routeIndex = 1) {
    let baseScore = 88;
    const srcInput = document.getElementById('plan-source')?.value || 'Guwahati';
    const destInput = document.getElementById('plan-dest')?.value || 'Kohima';

    if (routeIndex === 0) baseScore = 64; // High Risk Route A
    else if (routeIndex === 1) baseScore = 89; // Low Risk Route B AI Recommended
    else if (routeIndex === 2) baseScore = 76; // Medium Risk Route C

    // Apply Live Weather API adjustment
    if (this.liveWeatherData) {
      if (this.liveWeatherData.windspeed > 15) baseScore -= 4;
    }

    return Math.max(50, Math.min(99, baseScore));
  }

  selectRoute(index) {
    this.activeRouteIndex = index;

    document.querySelectorAll('.route-card').forEach((card, idx) => {
      if (idx === index) card.classList.add('selected');
      else card.classList.remove('selected');
    });

    if (this.maps['results-map']) {
      this.maps['results-map'].setSelectedRoute(index);
    }

    const score = this.calculateDynamicScore(index);
    UICharts.animateGauge('route-score-gauge', score);

    const routeLetters = ['A', 'B', 'C'];
    this.showToast(`✦ Selected Route ${routeLetters[index]} — Calculated AI Telemetry Score: ${score}/100`);
  }

  logout() {
    AuthService.logout();
  }

  switchView(viewId) {
    // ENFORCE STRICT AUTHENTICATION GUARD via AuthService
    if (!AuthService.checkAccess(viewId)) {
      viewId = 'login-view';
    }

    const overlay = document.getElementById('page-transition-overlay');

    if (overlay) {
      overlay.classList.add('sweep');
      setTimeout(() => {
        overlay.classList.remove('sweep');
      }, 500);
    }

    setTimeout(() => {
      document.querySelectorAll('.view-container').forEach((el) => {
        el.classList.remove('active');
        el.style.display = 'none';
      });

      const target = document.getElementById(viewId);
      if (target) {
        if (viewId.startsWith('landing-') || viewId.startsWith('login-') || viewId.startsWith('register-') || viewId === 'splash-view') {
          target.style.display = 'block';
        } else {
          const shell = document.getElementById('app-shell');
          if (shell) {
            shell.style.display = 'flex';
            shell.classList.add('active');
          }
          document.querySelectorAll('.app-view').forEach((v) => (v.style.display = 'none'));
          const subView = document.getElementById(viewId);
          if (subView) subView.style.display = 'block';
        }
        target.classList.add('active');
        this.currentView = viewId;

        this.onViewActivated(viewId);
      }
    }, 250);
  }

  onViewActivated(viewId) {
    if (viewId === 'dashboard-view') {
      UICharts.animateCountUp('stat-active-shipments', window.store.state.shipments.length);
      UICharts.animateCountUp('stat-deliveries-today', 17);
      UICharts.animateCountUp('stat-high-risk', 3);
      UICharts.animateCountUp('stat-delayed', 5);

      if (!this.maps['dash-map']) {
        this.maps['dash-map'] = new NERMapEngine('dash-map-canvas');
      }
    }

    if (viewId === 'results-view') {
      const initialScore = this.calculateDynamicScore(this.activeRouteIndex);
      UICharts.animateGauge('route-score-gauge', initialScore);
      if (!this.maps['results-map']) {
        this.maps['results-map'] = new NERMapEngine('results-map-canvas', {
          selectedRouteIndex: this.activeRouteIndex
        });
      }
    }

    if (viewId === 'accessibility-view') {
      UICharts.animateGauge('accessibility-score-gauge', 78);
      document.querySelectorAll('#accessibility-view .metric-bar-fill').forEach((bar) => {
        bar.style.width = bar.getAttribute('data-val') + '%';
      });
      if (!this.maps['access-map']) {
        this.maps['access-map'] = new NERMapEngine('access-map-canvas');
      }
    }

    if (viewId === 'tracking-view') {
      if (!this.maps['tracking-map']) {
        this.maps['tracking-map'] = new NERMapEngine('tracking-map-canvas', { showTruck: true });
      }
    }

    if (viewId === 'analytics-view') {
      UICharts.animateCountUp('analytics-total', 1250);
      UICharts.animateCountUp('analytics-ontime', 1087);
      UICharts.animateCountUp('analytics-delayed', 163);
      UICharts.renderSelfDrawingLineChart('analytics-chart-container', [120, 150, 180, 220, 310, 280, 340, 420]);
    }

    if (viewId === 'landing-view') {
      if (!this.maps['hero-map']) {
        this.maps['hero-map'] = new NERMapEngine('hero-map-canvas');
      }
    }

    if (viewId === 'admin-dashboard-view') {
      UICharts.animateCountUp('admin-users', 1420);
      UICharts.animateCountUp('admin-shipments', window.store.state.shipments.length);
      UICharts.animateCountUp('admin-routes', 36);
      UICharts.animateCountUp('admin-alerts', 12);
      if (!this.maps['admin-map']) {
        this.maps['admin-map'] = new NERMapEngine('admin-map-canvas');
      }
    }
  }

  setupNavigation() {
    document.querySelectorAll('.sidebar-item').forEach((item) => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-item').forEach((i) => i.classList.remove('active'));
        item.classList.add('active');
        const targetView = item.getAttribute('data-target');
        if (targetView) this.switchView(targetView);
      });
    });

    const planBtn = document.getElementById('hero-plan-btn');
    if (planBtn) planBtn.addEventListener('click', () => this.switchView('planning-view'));

    const exploreBtn = document.getElementById('hero-explore-btn');
    if (exploreBtn) exploreBtn.addEventListener('click', () => this.switchView('login-view'));
  }

  setupScrollSpy() {
    // Highlight visible sidebar & navbar elements on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            document.querySelectorAll('.sidebar-item').forEach((item) => {
              if (item.getAttribute('data-target') === id) {
                item.classList.add('active');
              } else {
                item.classList.remove('active');
              }
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('.app-view').forEach((view) => observer.observe(view));
  }

  setupFormsAndModals() {
    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailVal = loginForm.querySelector('input[type="email"]').value;
        const passVal = loginForm.querySelector('input[type="password"]').value;

        const btn = loginForm.querySelector('button[type="submit"]');
        if (btn) {
          btn.innerHTML = `<span>Authenticating...</span> <div class="spinner"></div>`;
          const res = await AuthService.login(emailVal, passVal);
          this.showToast(`✓ Login Successful. Welcome back, ${res.user.name}.`);
          this.switchView('dashboard-view');
          btn.innerHTML = `LOGIN →`;
        }
      });
    }

    // Register Form
    const regForm = document.getElementById('register-form');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
          name: document.getElementById('reg-name')?.value,
          email: document.getElementById('reg-email')?.value,
          phone: document.getElementById('reg-phone')?.value,
          organization: document.getElementById('reg-org')?.value,
          role: document.getElementById('reg-usertype')?.value
        };

        const res = await AuthService.register(userData);
        this.showToast(`✓ Account Created! Logging in as ${res.user.name}...`);
        setTimeout(() => this.switchView('dashboard-view'), 1000);
      });
    }

    // Save Profile & Settings
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const nameVal = document.getElementById('profile-name-input')?.value.trim();
        const emailVal = document.getElementById('profile-email-input')?.value.trim();
        const phoneVal = document.getElementById('profile-phone-input')?.value.trim();
        const orgVal = document.getElementById('profile-org-input')?.value.trim();
        const roleVal = document.getElementById('profile-role-select')?.value;

        if (window.store) {
          window.store.setUser({
            name: nameVal || window.store.state.currentUser.name,
            email: emailVal || window.store.state.currentUser.email,
            phone: phoneVal || window.store.state.currentUser.phone,
            organization: orgVal || window.store.state.currentUser.organization,
            role: roleVal || window.store.state.currentUser.role
          });
        }
        this.showToast('✓ Profile & Settings Saved Successfully!');
      });
    }

    // Source - Destination Swap Button
    const swapBtn = document.getElementById('swap-locations-btn');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        const srcInput = document.getElementById('plan-source');
        const destInput = document.getElementById('plan-dest');
        if (srcInput && destInput) {
          const temp = srcInput.value;
          srcInput.value = destInput.value;
          destInput.value = temp;
          this.showToast('Locations swapped successfully');
        }
      });
    }

    // Generate Smart Route AI Diagnostic Sequence
    const generateRouteBtn = document.getElementById('generate-route-btn');
    const aiModal = document.getElementById('ai-processing-modal');
    if (generateRouteBtn && aiModal) {
      generateRouteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        aiModal.classList.add('active');

        const steps = document.querySelectorAll('.ai-step-item');
        steps.forEach((s) => s.classList.remove('done'));

        steps.forEach((step, idx) => {
          setTimeout(() => {
            step.classList.add('done');
          }, (idx + 1) * 600);
        });

        setTimeout(() => {
          aiModal.classList.remove('active');
          this.switchView('results-view');
        }, 3600);
      });
    }

    // Confirm Route Button
    const confirmRouteBtn = document.getElementById('confirm-route-btn');
    if (confirmRouteBtn) {
      confirmRouteBtn.addEventListener('click', () => {
        this.showToast('✓ Route Confirmed! Dispatched to Fleet.');
        this.switchView('tracking-view');
      });
    }

    // Recalculate Route Button
    const recalcBtn = document.getElementById('recalculate-route-btn');
    if (recalcBtn) {
      recalcBtn.addEventListener('click', () => {
        this.showToast('✦ Recalculating Optimal Route with Real-Time Risk Data...');
        setTimeout(() => {
          this.showToast('✓ New Optimal Path Applied to Live Shipment.');
        }, 1500);
      });
    }
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3500);
  }
}

// Global App Instance
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SmartNERApp();
});
