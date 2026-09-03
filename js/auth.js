/* SMART NER — Authentication Service & Security Guard Module */

class AuthService {
  static protectedViews = [
    'dashboard-view',
    'planning-view',
    'results-view',
    'accessibility-view',
    'risk-view',
    'tracking-view',
    'analytics-view',
    'notifications-view',
    'profile-view',
    'admin-dashboard-view',
    'admin-management-view'
  ];

  static isAuthenticated() {
    return window.store ? window.store.state.isAuthenticated : false;
  }

  static checkAccess(targetViewId) {
    if (this.protectedViews.includes(targetViewId) && !this.isAuthenticated()) {
      if (window.app && window.app.showToast) {
        window.app.showToast('🔒 Please login to access SMART NER.');
      }
      return false;
    }
    return true;
  }

  static login(email, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (window.store) {
          const parts = email.split('@')[0].split(/[._]/);
          const formattedName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          
          window.store.setUser({
            email: email,
            name: formattedName || 'Registered Operator'
          });
          window.store.setAuth(true);
        }
        resolve({ success: true, user: window.store.state.currentUser });
      }, 800);
    });
  }

  static register(userData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (window.store) {
          window.store.setUser({
            name: userData.name || 'Registered Operator',
            email: userData.email || 'operator@smartner.ai',
            phone: userData.phone || '+91 98765 43210',
            organization: userData.organization || 'North East Freight Command',
            role: userData.role || 'Fleet Director'
          });
          window.store.setAuth(true);
        }
        resolve({ success: true, user: window.store.state.currentUser });
      }, 900);
    });
  }

  static logout() {
    if (window.store) {
      window.store.setAuth(false);
    }
    const shell = document.getElementById('app-shell');
    if (shell) {
      shell.style.display = 'none';
      shell.classList.remove('active');
    }
    if (window.app) {
      window.app.showToast('✓ Logged out successfully.');
      window.app.switchView('login-view');
    }
  }
}
