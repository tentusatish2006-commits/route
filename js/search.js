/* SMART NER — Functional Global Search Engine & Dropdown Module */

class SearchEngine {
  static init() {
    const searchInput = document.getElementById('global-search-input');
    const dropdown = document.getElementById('search-results-dropdown');
    if (!searchInput || !dropdown) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length === 0) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
        return;
      }
      this.performSearch(query, dropdown);
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    searchInput.addEventListener('focus', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length > 0) {
        this.performSearch(query, dropdown);
      }
    });
  }

  static performSearch(query, dropdown) {
    const store = window.store ? window.store.state : null;
    if (!store) return;

    const results = [];

    // 1. Search Shipments
    store.shipments.forEach((s) => {
      if (s.id.toLowerCase().includes(query) || s.source.toLowerCase().includes(query) || s.destination.toLowerCase().includes(query) || s.cargo.toLowerCase().includes(query)) {
        results.push({
          type: 'SHIPMENT',
          icon: 'fa-truck-fast',
          title: `Shipment ${s.id}`,
          subtitle: `${s.source} → ${s.destination} (${s.status})`,
          targetView: 'tracking-view',
          query: query
        });
      }
    });

    // 2. Search Locations & Accessibility Nodes
    Object.keys(store.locations).forEach((locName) => {
      const loc = store.locations[locName];
      if (locName.toLowerCase().includes(query) || loc.state.toLowerCase().includes(query)) {
        results.push({
          type: 'LOCATION',
          icon: 'fa-location-dot',
          title: `${locName} Accessibility`,
          subtitle: `State: ${loc.state} | Accessibility Score: ${loc.score}/100`,
          targetView: 'accessibility-view',
          query: query
        });
      }
    });

    // 3. Search Alerts
    store.alerts.forEach((alt) => {
      if (alt.title.toLowerCase().includes(query) || alt.location.toLowerCase().includes(query) || alt.id.toLowerCase().includes(query)) {
        results.push({
          type: 'ALERT',
          icon: 'fa-triangle-exclamation',
          title: alt.title,
          subtitle: `Location: ${alt.location} | Severity: ${alt.severity}`,
          targetView: 'risk-view',
          query: query
        });
      }
    });

    // 4. Search Routes
    ['Guwahati → Kohima Expressway', 'Northern Highway NH-29', 'Southern Bypass Corridor', 'Tripura Freight Way'].forEach((rName) => {
      if (rName.toLowerCase().includes(query)) {
        results.push({
          type: 'ROUTE',
          icon: 'fa-route',
          title: rName,
          subtitle: 'Active Regional Logistics Corridor',
          targetView: 'results-view',
          query: query
        });
      }
    });

    // 5. Search Users
    if (store.currentUser && (store.currentUser.name.toLowerCase().includes(query) || store.currentUser.email.toLowerCase().includes(query) || store.currentUser.role.toLowerCase().includes(query))) {
      results.push({
        type: 'USER',
        icon: 'fa-user-gear',
        title: store.currentUser.name,
        subtitle: `${store.currentUser.role} | ${store.currentUser.organization}`,
        targetView: 'profile-view',
        query: query
      });
    }

    // Render Dropdown Results
    dropdown.style.display = 'block';
    if (results.length === 0) {
      dropdown.innerHTML = `
        <div class="search-empty-state">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 1.5rem; color: var(--text-dim); margin-bottom: 8px;"></i>
          <div>No results found for "${this.escapeHTML(query)}"</div>
        </div>
      `;
    } else {
      dropdown.innerHTML = results.map((item) => `
        <div class="search-result-item" onclick="SearchEngine.selectResult('${item.targetView}')">
          <div class="search-item-badge ${item.type.toLowerCase()}">${item.type}</div>
          <div style="flex: 1;">
            <div class="search-item-title"><i class="fa-solid ${item.icon}" style="margin-right: 6px; color: var(--cyan-primary);"></i> ${this.highlightText(item.title, query)}</div>
            <div class="search-item-subtitle">${this.highlightText(item.subtitle, query)}</div>
          </div>
          <i class="fa-solid fa-chevron-right" style="font-size: 0.8rem; color: var(--text-dim);"></i>
        </div>
      `).join('');
    }
  }

  static highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  }

  static escapeHTML(str) {
    return str.replace(/[&<>'"]/g, (tag) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
  }

  static selectResult(targetView) {
    const dropdown = document.getElementById('search-results-dropdown');
    if (dropdown) dropdown.style.display = 'none';

    if (window.app && window.app.switchView) {
      window.app.switchView(targetView);
    }
  }
}

// Auto Init on DOM Ready
document.addEventListener('DOMContentLoaded', () => SearchEngine.init());
