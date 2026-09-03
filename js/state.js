/* SMART NER — Centralized StateStore (Single Source of Truth) */

class StateStore {
  constructor() {
    this.listeners = [];

    this.state = {
      isAuthenticated: false,
      currentUser: {
        name: 'Registered Operator',
        email: 'operator@smartner.ai',
        phone: '+91 98765 43210',
        organization: 'North East Freight Command',
        role: 'Fleet Director'
      },
      // Unique Shipments Data Layer
      shipments: [
        {
          id: 'NER-2026-00124',
          source: 'Guwahati Warehouse',
          destination: 'Kohima Hub',
          cargo: 'Food Supplies & Rations',
          weight: 5000,
          vehicle: 'Heavy Truck (12 Wheeler)',
          currentLocation: 'Dimapur Checkpoint',
          distanceRemaining: 74,
          totalDistance: 335,
          eta: '12 Sep, 6:30 PM',
          speed: '48 km/h',
          risk: 'LOW',
          accessibilityScore: 78,
          status: 'IN TRANSIT',
          checkpoints: ['Guwahati ✓', 'Nagaon ✓', 'Dimapur (Current)', 'Kohima']
        },
        {
          id: 'NER-2026-00125',
          source: 'Shillong Depot',
          destination: 'Agartala Logistics Yard',
          cargo: 'Medical & Vaccine Supplies',
          weight: 2400,
          vehicle: 'All-Terrain Van',
          currentLocation: 'Badarpur Junction',
          distanceRemaining: 142,
          totalDistance: 365,
          eta: '13 Sep, 11:15 AM',
          speed: '52 km/h',
          risk: 'MEDIUM',
          accessibilityScore: 88,
          status: 'DISPATCHED',
          checkpoints: ['Shillong ✓', 'Badarpur (Current)', 'Silchar', 'Agartala']
        },
        {
          id: 'NER-2026-00126',
          source: 'Guwahati Central',
          destination: 'Itanagar Freight Hub',
          cargo: 'Bridge Construction Steel',
          weight: 12000,
          vehicle: 'Heavy Cargo Carrier',
          currentLocation: 'Tezpur Bridge',
          distanceRemaining: 95,
          totalDistance: 290,
          eta: '12 Sep, 9:00 PM',
          speed: '42 km/h',
          risk: 'LOW',
          accessibilityScore: 81,
          status: 'IN TRANSIT',
          checkpoints: ['Guwahati ✓', 'Tezpur (Current)', 'Itanagar']
        },
        {
          id: 'NER-2026-00127',
          source: 'Dimapur Station',
          destination: 'Imphal Relief Center',
          cargo: 'Emergency Shelter Tents',
          weight: 4100,
          vehicle: 'Medium Truck',
          currentLocation: 'Mao Pass',
          distanceRemaining: 62,
          totalDistance: 204,
          eta: '13 Sep, 2:45 PM',
          speed: '35 km/h',
          risk: 'HIGH',
          accessibilityScore: 75,
          status: 'DELAYED',
          checkpoints: ['Dimapur ✓', 'Mao (Current)', 'Imphal']
        },
        {
          id: 'NER-2026-00128',
          source: 'Silchar Warehouse',
          destination: 'Aizawl Cargo Terminal',
          cargo: 'Solar Microgrid Units',
          weight: 3800,
          vehicle: '6-Wheeler Mountain Van',
          currentLocation: 'Vairengte Border',
          distanceRemaining: 110,
          totalDistance: 310,
          eta: '14 Sep, 10:30 AM',
          speed: '38 km/h',
          risk: 'MEDIUM',
          accessibilityScore: 71,
          status: 'IN TRANSIT',
          checkpoints: ['Silchar ✓', 'Vairengte (Current)', 'Aizawl']
        }
      ],

      // Realistic Geographic Distance Matrix
      distances: {
        'Guwahati-Kohima': 335,
        'Guwahati-Shillong': 98,
        'Guwahati-Itanagar': 290,
        'Guwahati-Agartala': 565,
        'Guwahati-Gangtok': 540,
        'Shillong-Agartala': 365,
        'Dimapur-Imphal': 204,
        'Silchar-Aizawl': 310,
        'Kohima-Imphal': 142
      },

      // Dynamic Accessibility Dictionary
      locations: {
        'Kohima': { score: 78, road: 82, weather: 65, terrain: 71, transport: 79, lastMile: 73, state: 'Nagaland', risk: 'HIGH' },
        'Guwahati': { score: 92, road: 95, weather: 88, terrain: 94, transport: 96, lastMile: 89, state: 'Assam', risk: 'LOW' },
        'Shillong': { score: 84, road: 86, weather: 74, terrain: 80, transport: 88, lastMile: 82, state: 'Meghalaya', risk: 'LOW' },
        'Aizawl': { score: 71, road: 68, weather: 62, terrain: 65, transport: 72, lastMile: 69, state: 'Mizoram', risk: 'MEDIUM' },
        'Agartala': { score: 88, road: 90, weather: 82, terrain: 89, transport: 91, lastMile: 85, state: 'Tripura', risk: 'LOW' },
        'Imphal': { score: 75, road: 72, weather: 70, terrain: 68, transport: 76, lastMile: 74, state: 'Manipur', risk: 'HIGH' },
        'Itanagar': { score: 81, road: 83, weather: 78, terrain: 76, transport: 82, lastMile: 79, state: 'Arunachal Pradesh', risk: 'LOW' },
        'Gangtok': { score: 69, road: 65, weather: 58, terrain: 60, transport: 70, lastMile: 64, state: 'Sikkim', risk: 'MEDIUM' }
      },

      // Dynamic Risk Alerts
      alerts: [
        { id: 'ALT-101', title: 'Landslide Risk — NH-29', location: 'Kohima-Dimapur Pass', severity: 'HIGH', status: 'ACTIVE', time: '10 mins ago' },
        { id: 'ALT-102', title: 'Heavy Rainfall Warning', location: 'Cherrapunji Hills', severity: 'MEDIUM', status: 'ACTIVE', time: '45 mins ago' },
        { id: 'ALT-103', title: 'Road Disruption Cleared', location: 'Nagaon Bypass', severity: 'LOW', status: 'RESOLVED', time: '2 hours ago' },
        { id: 'ALT-104', title: 'Flash Flood Watch', location: 'Barak Valley', severity: 'HIGH', status: 'ACTIVE', time: '3 hours ago' }
      ],

      // Live AI Core Metrics
      aiTelemetry: {
        status: 'ONLINE',
        activeAnalyses: 24,
        routesAnalyzed: 142,
        riskPredictions: 18,
        accessibilityPredictions: 36,
        delayPredictions: 5,
        lastUpdated: 'Just now'
      },

      lastUpdatedTime: new Date().toLocaleTimeString()
    };

    // Periodically update dynamic telemetry
    this.startLiveSimulation();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  startLiveSimulation() {
    setInterval(() => {
      // Simulate slight realistic telemetry updates
      this.state.aiTelemetry.activeAnalyses = 20 + Math.floor(Math.random() * 8);
      this.state.aiTelemetry.routesAnalyzed += Math.floor(Math.random() * 2);
      this.state.lastUpdatedTime = new Date().toLocaleTimeString();
      this.state.aiTelemetry.lastUpdated = 'Just now';

      // Update shipment distances remaining slightly
      this.state.shipments.forEach((s) => {
        if (s.status === 'IN TRANSIT' && s.distanceRemaining > 10) {
          s.distanceRemaining = Math.max(5, s.distanceRemaining - 1);
        }
      });

      this.notify();
    }, 12000);
  }

  getDistance(source, destination) {
    const key = `${source}-${destination}`;
    const revKey = `${destination}-${source}`;
    return this.state.distances[key] || this.state.distances[revKey] || 320;
  }

  calculateAIScore(source, destination, cargoWeight, vehicleType, weatherWind = 12) {
    let score = 95;
    const distance = this.getDistance(source, destination);

    // Distance impact
    if (distance > 400) score -= 14;
    else if (distance > 250) score -= 8;
    else score -= 3;

    // Weight impact
    const weight = parseInt(cargoWeight) || 5000;
    if (weight > 10000) score -= 10;
    else if (weight > 5000) score -= 5;

    // Location terrain impact
    const locInfo = this.state.locations[destination] || this.state.locations['Kohima'];
    if (locInfo.risk === 'HIGH') score -= 12;
    else if (locInfo.risk === 'MEDIUM') score -= 6;

    // Weather impact
    if (weatherWind > 20) score -= 8;

    return Math.max(52, Math.min(98, Math.round(score)));
  }

  setUser(user) {
    this.state.currentUser = Object.assign(this.state.currentUser, user);
    this.notify();
  }

  setAuth(authed) {
    this.state.isAuthenticated = authed;
    this.notify();
  }
}

// Global Singleton Instance
window.store = new StateStore();
