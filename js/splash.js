/* SMART NER — N Logo AI Splash Screen Canvas & Boot Logic */

class SplashAnimation {
  constructor(canvasId, onComplete) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.onComplete = onComplete;

    this.width = (this.canvas.width = window.innerWidth);
    this.height = (this.canvas.height = window.innerHeight);

    this.particles = [];
    this.numParticles = 180;
    this.progress = 0;
    this.stageIndex = 0;
    this.stages = [
      'Initializing AI Engine',
      'Loading NER Data Structures',
      'Analyzing Regional Connectivity',
      'Preparing Smart Logistics Center'
    ];

    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    this.nPathProgress = 0;
    this.cyanLightOffset = 0;
    this.purpleBeamProgress = 0;
    this.nRotation = 0;
    this.ringProgress = 0;
    this.floatOffset = 0;
    this.bootStep = 1;

    this.init();
  }

  init() {
    this.createParticles();

    window.addEventListener('resize', () => {
      this.width = this.canvas.width = window.innerWidth;
      this.height = this.canvas.height = window.innerHeight;
    });

    window.addEventListener('mousemove', (e) => {
      this.targetMouseX = (e.clientX - this.width / 2) / (this.width / 2);
      this.targetMouseY = (e.clientY - this.height / 2) / (this.height / 2);
    });

    this.runProgressTimer();
    this.animate();
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * Math.max(this.width, this.height) * 0.6;
      this.particles.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        targetX: (Math.random() - 0.5) * 220,
        targetY: (Math.random() - 0.5) * 260,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.7 + 0.3,
        color: Math.random() > 0.4 ? '#00f3ff' : '#9d4edd',
        speed: Math.random() * 0.03 + 0.01,
        orbitRadius: Math.random() * 120 + 80,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: (Math.random() - 0.5) * 0.04
      });
    }
  }

  runProgressTimer() {
    const titleEl = document.getElementById('splash-title');
    const subtitleEl = document.getElementById('splash-subtitle');
    const loadingBoxEl = document.getElementById('splash-loading-box');
    const statusTextEl = document.getElementById('splash-status-text');
    const percentEl = document.getElementById('splash-percent');
    const fillEl = document.getElementById('splash-progress-fill');

    if (loadingBoxEl) loadingBoxEl.classList.add('visible');

    const interval = setInterval(() => {
      this.progress += 1;
      if (percentEl) percentEl.textContent = `${this.progress}%`;
      if (fillEl) fillEl.style.width = `${this.progress}%`;

      // Update stage text
      if (this.progress < 25) {
        this.stageIndex = 0;
        this.bootStep = 1; // particles appear & move center
      } else if (this.progress < 45) {
        this.stageIndex = 1;
        this.bootStep = 3; // neon line draw N
      } else if (this.progress < 70) {
        this.stageIndex = 2;
        this.bootStep = 5; // cyan/purple light, energy ring
      } else if (this.progress < 90) {
        this.stageIndex = 3;
        this.bootStep = 8; // orbit, float, text appear
        if (titleEl) titleEl.classList.add('visible');
        if (subtitleEl) subtitleEl.classList.add('visible');
      }

      if (statusTextEl) statusTextEl.textContent = this.stages[this.stageIndex];

      if (this.progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (this.onComplete) this.onComplete();
        }, 500);
      }
    }, 45);
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Smooth mouse parallax
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    const centerX = this.width / 2 + this.mouseX * 30;
    const centerY = this.height / 2 + this.mouseY * 20 - 40;

    // Step calculations
    if (this.progress > 20) this.nPathProgress = Math.min(1, this.nPathProgress + 0.02);
    if (this.progress > 40) this.cyanLightOffset += 0.04;
    if (this.progress > 50) this.purpleBeamProgress = Math.min(1, this.purpleBeamProgress + 0.03);
    if (this.progress > 60) this.nRotation = Math.sin(Date.now() * 0.0015) * 0.05;
    if (this.progress > 65) this.ringProgress = Math.min(1, this.ringProgress + 0.025);
    this.floatOffset = Math.sin(Date.now() * 0.002) * 10;

    const currentCenterY = centerY + this.floatOffset;

    // Draw Energy Ring (Step 7)
    if (this.ringProgress > 0) {
      this.ctx.save();
      this.ctx.translate(centerX, currentCenterY);
      this.ctx.rotate(Date.now() * 0.001);
      this.ctx.scale(1, 0.4); // 3D ring tilt perspective

      this.ctx.beginPath();
      this.ctx.arc(0, 0, 150 * this.ringProgress, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#00f3ff';
      this.ctx.lineWidth = 3;
      this.ctx.shadowColor = '#00f3ff';
      this.ctx.shadowBlur = 20;
      this.ctx.globalAlpha = this.ringProgress * 0.7;
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Draw Orbiting & Converging Particles (Steps 1, 2, 8)
    this.particles.forEach((p) => {
      this.ctx.save();

      if (this.progress < 60) {
        // Converge towards N shape
        p.x += (p.targetX - p.x) * p.speed;
        p.y += (p.targetY - p.y) * p.speed;
        this.ctx.translate(centerX + p.x, currentCenterY + p.y);
      } else {
        // Orbit N
        p.orbitAngle += p.orbitSpeed;
        const ox = Math.cos(p.orbitAngle) * p.orbitRadius;
        const oy = Math.sin(p.orbitAngle) * (p.orbitRadius * 0.4);
        this.ctx.translate(centerX + ox, currentCenterY + oy);
      }

      this.ctx.beginPath();
      this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fill();
      this.ctx.restore();
    });

    // Draw Central N Logo (Steps 3, 4, 5, 6)
    if (this.nPathProgress > 0) {
      this.ctx.save();
      this.ctx.translate(centerX, currentCenterY);
      this.ctx.rotate(this.nRotation);

      // Define N vertices (Huge letter N)
      const scale = 1.3;
      const p1 = { x: -60 * scale, y: 80 * scale };
      const p2 = { x: -60 * scale, y: -80 * scale };
      const p3 = { x: 60 * scale, y: 80 * scale };
      const p4 = { x: 60 * scale, y: -80 * scale };

      // Glow backdrop for N
      this.ctx.shadowColor = '#00f3ff';
      this.ctx.shadowBlur = 30;
      this.ctx.lineWidth = 14;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      // Neon Line Drawing (Step 3)
      this.ctx.beginPath();
      // Left vertical stem
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      // Diagonal stem
      this.ctx.lineTo(p3.x, p3.y);
      // Right vertical stem
      this.ctx.lineTo(p4.x, p4.y);

      const grad = this.ctx.createLinearGradient(-80, -80, 80, 80);
      grad.addColorStop(0, '#00f3ff');
      grad.addColorStop(0.5, '#0088ff');
      grad.addColorStop(1, '#9d4edd');

      this.ctx.strokeStyle = grad;
      this.ctx.globalAlpha = this.nPathProgress;
      this.ctx.stroke();

      // Cyan Traveling Light Dot (Step 4)
      if (this.cyanLightOffset > 0) {
        const totalDist = 160 + Math.hypot(120, 160) + 160;
        const currentDist = (this.cyanLightOffset * 200) % totalDist;

        let dotX = p1.x, dotY = p1.y;
        if (currentDist < 160) {
          dotX = p1.x;
          dotY = p1.y - currentDist;
        } else if (currentDist < 160 + Math.hypot(120, 160)) {
          const t = (currentDist - 160) / Math.hypot(120, 160);
          dotX = p2.x + (p3.x - p2.x) * t;
          dotY = p2.y + (p3.y - p2.y) * t;
        } else {
          const t = (currentDist - 160 - Math.hypot(120, 160)) / 160;
          dotX = p3.x;
          dotY = p3.y - (p3.y - p4.y) * t;
        }

        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, 12, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00f5d4';
        this.ctx.shadowColor = '#00f5d4';
        this.ctx.shadowBlur = 25;
        this.ctx.fill();
      }

      // Purple Cross Beam (Step 5)
      if (this.purpleBeamProgress > 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(p2.x, p2.y);
        this.ctx.lineTo(p2.x + (p3.x - p2.x) * this.purpleBeamProgress, p2.y + (p3.y - p2.y) * this.purpleBeamProgress);
        this.ctx.strokeStyle = '#9d4edd';
        this.ctx.lineWidth = 18;
        this.ctx.shadowColor = '#9d4edd';
        this.ctx.shadowBlur = 35;
        this.ctx.globalAlpha = 0.8;
        this.ctx.stroke();
      }

      this.ctx.restore();
    }

    requestAnimationFrame(() => this.animate());
  }
}
