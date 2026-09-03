/* SMART NER — 3D Physics Card Tilt & Custom Cursor Trail System */

class CardEffects {
  static init() {
    this.init3DTilt();
    this.initCustomCursor();
  }

  static init3DTilt() {
    document.addEventListener('mousemove', (e) => {
      const tiltCards = document.querySelectorAll('.tilt-card, .glass-card, .stat-card, .feature-card');

      tiltCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const mouseX = e.clientX - centerX;
          const mouseY = e.clientY - centerY;

          // Max 3 degree tilt as requested in prompt
          const rotateX = (-mouseY / (rect.height / 2)) * 3;
          const rotateY = (mouseX / (rect.width / 2)) * 3;

          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        } else {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        }
      });
    });
  }

  static initCustomCursor() {
    const canvas = document.getElementById('cursor-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const trail = [];
    const maxTrailLength = 12;

    window.addEventListener('mousemove', (e) => {
      trail.push({
        x: e.clientX,
        y: e.clientY,
        alpha: 0.8,
        size: 8
      });
      if (trail.length > maxTrailLength) {
        trail.shift();
      }
    });

    function drawCursorTrail() {
      ctx.clearRect(0, 0, width, height);

      trail.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (idx / maxTrailLength), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 243, 255, ${p.alpha * (idx / maxTrailLength)})`;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        ctx.fill();

        p.alpha *= 0.92;
      });

      requestAnimationFrame(drawCursorTrail);
    }

    drawCursorTrail();
  }
}

// Auto init on DOM ready
document.addEventListener('DOMContentLoaded', () => CardEffects.init());
