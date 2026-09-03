/* SMART NER — Google Map-Style Interactive Navigation Engine & Logistics Simulator */

class NERMapEngine {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.options = Object.assign(
      {
        interactive: true,
        showRoutes: true,
        showTruck: true,
        selectedRouteIndex: 1, // Default to Route B
        multiTrucks: false,
        layerMode: 'standard', // 'standard', 'terrain', 'risk', 'accessibility'
        zoomLevel: 1.0,
        offsetX: 0,
        offsetY: 0,
        onNodeHover: null,
        onNodeClick: null
      },
      options
    );

    this.width = 0;
    this.height = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // North East India Location Nodes
    this.nodes = [
      { id: 'guwahati', name: 'Guwahati Warehouse', state: 'Assam', x: 0.28, y: 0.44, risk: 'low', hub: true, accessibility: 92 },
      { id: 'shillong', name: 'Shillong Depot', state: 'Meghalaya', x: 0.26, y: 0.58, risk: 'low', accessibility: 84 },
      { id: 'dimapur', name: 'Dimapur Checkpoint', state: 'Nagaland', x: 0.58, y: 0.42, risk: 'medium', hub: true, accessibility: 80 },
      { id: 'kohima', name: 'Kohima Hub', state: 'Nagaland', x: 0.66, y: 0.48, risk: 'high', hub: true, accessibility: 78 },
      { id: 'imphal', name: 'Imphal Center', state: 'Manipur', x: 0.65, y: 0.66, risk: 'high', accessibility: 75 },
      { id: 'aizawl', name: 'Aizawl Terminal', state: 'Mizoram', x: 0.52, y: 0.82, risk: 'medium', accessibility: 71 },
      { id: 'agartala', name: 'Agartala Yard', state: 'Tripura', x: 0.22, y: 0.78, risk: 'low', accessibility: 88 },
      { id: 'itanagar', name: 'Itanagar Hub', state: 'Arunachal Pradesh', x: 0.55, y: 0.25, risk: 'low', accessibility: 81 },
      { id: 'gangtok', name: 'Gangtok Corridor', state: 'Sikkim', x: 0.08, y: 0.22, risk: 'medium', accessibility: 69 }
    ];

    // Navigation Corridors
    this.routes = [
      {
        id: 'route-a',
        name: 'Route A — Northern Highway',
        risk: 'high',
        color: '#ff0055',
        path: ['guwahati', 'itanagar', 'dimapur', 'kohima'],
        distance: '385 km',
        eta: '9h 15m'
      },
      {
        id: 'route-b',
        name: 'Route B — Guwahati-Kohima Expressway ⭐',
        risk: 'low',
        color: '#00f3ff',
        path: ['guwahati', 'dimapur', 'kohima'],
        distance: '335 km',
        eta: '6h 40m'
      },
      {
        id: 'route-c',
        name: 'Route C — Southern Bypass',
        risk: 'medium',
        color: '#ffb703',
        path: ['guwahati', 'shillong', 'imphal', 'kohima'],
        distance: '420 km',
        eta: '10h 05m'
      }
    ];

    // Truck Simulation Telemetry
    this.truckProgress = 0.48; // Dimapur checkpoint position
    this.truckSpeed = 0.0012;
    this.hoveredNode = null;
    this.activePopup = null;
    this.pulsePhase = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    if (this.options.interactive) {
      this.setupMapInteractions();
    }

    this.animate();
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.width = this.canvas.width = parent.clientWidth;
    this.height = this.canvas.height = parent.clientHeight;
  }

  setupMapInteractions() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX - this.options.offsetX;
      this.dragStartY = e.clientY - this.options.offsetY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.options.offsetX = e.clientX - this.dragStartX;
        this.options.offsetY = e.clientY - this.dragStartY;
      }
      this.handleMouseMove(e);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('click', (e) => {
      this.handleMapClick(e);
    });
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = null;
    this.nodes.forEach((node) => {
      const pos = this.getScreenCoords(node.x, node.y);
      const dist = Math.hypot(mx - pos.x, my - pos.y);
      if (dist < 20) {
        found = node;
      }
    });

    this.hoveredNode = found;
    this.canvas.style.cursor = found ? 'pointer' : this.isDragging ? 'grabbing' : 'grab';
  }

  handleMapClick(e) {
    if (this.hoveredNode) {
      this.activePopup = this.hoveredNode;
      if (window.app && window.app.showToast) {
        window.app.showToast(`📍 Selected ${this.hoveredNode.name} (${this.hoveredNode.state})`);
      }
    } else {
      this.activePopup = null;
    }
  }

  getScreenCoords(normX, normY) {
    const cx = this.width / 2 + this.options.offsetX;
    const cy = this.height / 2 + this.options.offsetY;

    const x = cx + (normX - 0.5) * this.width * this.options.zoomLevel;
    const y = cy + (normY - 0.5) * this.height * this.options.zoomLevel;

    return { x, y };
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.pulsePhase += 0.035;

    // Simulate realistic checkpoint movement
    this.truckProgress = (this.truckProgress + this.truckSpeed) % 1;

    // Trigger checkpoint arrival state
    if (Math.abs(this.truckProgress - 0.5) < 0.02) {
      const statusEl = document.getElementById('tracking-status-badge');
      if (statusEl) statusEl.textContent = 'AT CHECKPOINT';
    } else {
      const statusEl = document.getElementById('tracking-status-badge');
      if (statusEl) statusEl.textContent = 'IN TRANSIT';
    }

    this.drawTerrainBackground();
    this.drawHighwaysAndRoads();
    this.drawRoutes();
    this.drawNodesAndMarkers();

    if (this.options.showTruck) {
      this.drawLiveShipmentTruck();
    }

    if (this.hoveredNode || this.activePopup) {
      this.drawNodeTooltip(this.activePopup || this.hoveredNode);
    }

    requestAnimationFrame(() => this.animate());
  }

  drawTerrainBackground() {
    this.ctx.save();
    
    // Grid Lines & Compass Orientation
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.06)';
    this.ctx.lineWidth = 1;

    const gridSize = 45 * this.options.zoomLevel;
    const startX = (this.width / 2 + this.options.offsetX) % gridSize;
    const startY = (this.height / 2 + this.options.offsetY) % gridSize;

    for (let x = startX; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = startY; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    // Terrain Contour Layer (if layerMode === 'terrain')
    if (this.options.layerMode === 'terrain') {
      this.ctx.fillStyle = 'rgba(0, 245, 212, 0.04)';
      this.ctx.beginPath();
      this.ctx.arc(this.width * 0.6, this.height * 0.45, 180 * this.options.zoomLevel, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawHighwaysAndRoads() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    this.ctx.lineWidth = 2 * this.options.zoomLevel;

    // Connect major highways
    const highwayPairs = [
      ['guwahati', 'shillong'],
      ['shillong', 'agartala'],
      ['guwahati', 'itanagar'],
      ['dimapur', 'imphal'],
      ['shillong', 'aizawl']
    ];

    highwayPairs.forEach(([id1, id2]) => {
      const n1 = this.nodes.find((n) => n.id === id1);
      const n2 = this.nodes.find((n) => n.id === id2);
      if (n1 && n2) {
        const p1 = this.getScreenCoords(n1.x, n1.y);
        const p2 = this.getScreenCoords(n2.x, n2.y);

        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }
    });

    this.ctx.restore();
  }

  drawRoutes() {
    if (!this.options.showRoutes) return;

    this.routes.forEach((route, index) => {
      const isSelected = index === this.options.selectedRouteIndex;

      this.ctx.save();
      this.ctx.beginPath();

      const pathNodes = route.path.map((id) => this.nodes.find((n) => n.id === id)).filter(Boolean);
      pathNodes.forEach((node, idx) => {
        const pos = this.getScreenCoords(node.x, node.y);
        if (idx === 0) this.ctx.moveTo(pos.x, pos.y);
        else this.ctx.lineTo(pos.x, pos.y);
      });

      this.ctx.lineWidth = (isSelected ? 5 : 2.5) * this.options.zoomLevel;
      this.ctx.strokeStyle = isSelected ? route.color : 'rgba(0, 243, 255, 0.25)';
      this.ctx.globalAlpha = isSelected ? 1 : 0.4;

      if (isSelected) {
        this.ctx.shadowColor = route.color;
        this.ctx.shadowBlur = 20;
      }
      this.ctx.stroke();

      // Traveling Route Glow Particle
      if (isSelected) {
        const particlePos = this.getPointAlongPath(pathNodes, (this.truckProgress * 1.8) % 1);
        this.ctx.beginPath();
        this.ctx.arc(particlePos.x, particlePos.y, 6 * this.options.zoomLevel, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = route.color;
        this.ctx.shadowBlur = 20;
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  drawNodesAndMarkers() {
    this.nodes.forEach((node) => {
      const pos = this.getScreenCoords(node.x, node.y);
      const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;

      let color = '#00f5d4';
      if (node.risk === 'medium') color = '#ffb703';
      if (node.risk === 'high') color = '#ff0055';

      const pulseSize = (Math.sin(this.pulsePhase) + 1) * 5 + 4;

      this.ctx.save();

      // Pulse Ring
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, (10 + pulseSize) * this.options.zoomLevel, 0, Math.PI * 2);
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1.5;
      this.ctx.globalAlpha = Math.max(0, 1 - pulseSize / 15);
      this.ctx.stroke();

      // Node Marker
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, (isHovered ? 9 : 6) * this.options.zoomLevel, 0, Math.PI * 2);
      this.ctx.fillStyle = isHovered ? '#ffffff' : color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 15;
      this.ctx.fill();

      // Layer specific overlay icons
      if (this.options.layerMode === 'accessibility') {
        this.ctx.font = '600 11px "Outfit", sans-serif';
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.fillText(`${node.accessibility}/100`, pos.x + 12, pos.y - 12);
      }

      // Label Text
      this.ctx.font = '600 12px "Outfit", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#000000';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(node.name, pos.x + 12, pos.y + 4);

      this.ctx.restore();
    });
  }

  drawLiveShipmentTruck() {
    const selectedRoute = this.routes[this.options.selectedRouteIndex] || this.routes[1];
    const pathNodes = selectedRoute.path.map((id) => this.nodes.find((n) => n.id === id)).filter(Boolean);
    const pos = this.getPointAlongPath(pathNodes, this.truckProgress);

    this.ctx.save();
    this.ctx.translate(pos.x, pos.y);
    this.ctx.rotate(pos.angle);

    // Headlight Beam
    const beamGrad = this.ctx.createRadialGradient(20, 0, 2, 45, 0, 22);
    beamGrad.addColorStop(0, 'rgba(0, 243, 255, 0.9)');
    beamGrad.addColorStop(1, 'rgba(0, 243, 255, 0)');
    this.ctx.beginPath();
    this.ctx.moveTo(8, -6);
    this.ctx.lineTo(45, -20);
    this.ctx.lineTo(45, 20);
    this.ctx.lineTo(8, 6);
    this.ctx.fillStyle = beamGrad;
    this.ctx.fill();

    // Light Trail
    this.ctx.beginPath();
    this.ctx.moveTo(-10, 0);
    this.ctx.lineTo(-32, 0);
    this.ctx.strokeStyle = '#00f3ff';
    this.ctx.lineWidth = 3.5;
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();

    // 🚚 Truck Vessel Icon
    this.ctx.fillStyle = '#0a1026';
    this.ctx.strokeStyle = '#00f3ff';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.shadowBlur = 12;
    this.ctx.fillRect(-12, -7, 24, 14);
    this.ctx.strokeRect(-12, -7, 24, 14);

    this.ctx.fillStyle = '#00f3ff';
    this.ctx.fillRect(4, -5, 8, 10);

    this.ctx.restore();
  }

  getPointAlongPath(pathNodes, t) {
    if (!pathNodes || pathNodes.length < 2) return { x: 0, y: 0, angle: 0 };
    const numSegments = pathNodes.length - 1;
    const scaledT = Math.max(0, Math.min(1, t)) * numSegments;
    const segIndex = Math.min(Math.floor(scaledT), numSegments - 1);
    const segT = scaledT - segIndex;

    const p1 = this.getScreenCoords(pathNodes[segIndex].x, pathNodes[segIndex].y);
    const p2 = this.getScreenCoords(pathNodes[segIndex + 1].x, pathNodes[segIndex + 1].y);

    const x = p1.x + (p2.x - p1.x) * segT;
    const y = p1.y + (p2.y - p1.y) * segT;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    return { x, y, angle };
  }

  drawNodeTooltip(node) {
    if (!node) return;
    const pos = this.getScreenCoords(node.x, node.y);

    this.ctx.save();
    this.ctx.translate(pos.x, pos.y - 55);

    const padding = 12;
    const text = `${node.name} (${node.state})`;
    const subtext = `Accessibility: ${node.accessibility}/100 | Risk: ${node.risk}`;

    this.ctx.font = '600 13px "Outfit", sans-serif';
    const textWidth = Math.max(this.ctx.measureText(text).width, 140);

    this.ctx.fillStyle = 'rgba(10, 16, 38, 0.95)';
    this.ctx.strokeStyle = '#00f3ff';
    this.ctx.lineWidth = 1.5;
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.shadowBlur = 15;

    this.ctx.beginPath();
    this.ctx.roundRect(-textWidth / 2 - padding, -26, textWidth + padding * 2, 48, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, 0, -6);

    this.ctx.font = '500 11px "Inter", sans-serif';
    this.ctx.fillStyle = node.risk === 'HIGH' ? '#ff0055' : node.risk === 'MEDIUM' ? '#ffb703' : '#00f5d4';
    this.ctx.fillText(subtext, 0, 12);

    this.ctx.restore();
  }

  zoomIn() {
    this.options.zoomLevel = Math.min(2.5, this.options.zoomLevel + 0.25);
  }

  zoomOut() {
    this.options.zoomLevel = Math.max(0.6, this.options.zoomLevel - 0.25);
  }

  centerShipment() {
    this.options.zoomLevel = 1.0;
    this.options.offsetX = 0;
    this.options.offsetY = 0;
  }

  setLayer(layerName) {
    this.options.layerMode = layerName;
  }

  setSelectedRoute(index) {
    this.options.selectedRouteIndex = index;
  }
}
