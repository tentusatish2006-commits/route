/* SMART NER — Dynamic Charts, Gauges & Number Count-Up Animations */

class UICharts {
  static animateCountUp(elementId, targetValue, duration = 1500) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let start = 0;
    const increment = targetValue / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= targetValue) {
        el.textContent = Math.round(targetValue).toLocaleString();
        clearInterval(timer);
      } else {
        el.textContent = Math.round(start).toLocaleString();
      }
    }, 16);
  }

  static animateGauge(gaugeId, targetScore, maxScore = 100) {
    const gaugeFill = document.querySelector(`#${gaugeId} .gauge-fill`);
    const gaugeVal = document.querySelector(`#${gaugeId} .gauge-value`);
    if (!gaugeFill || !gaugeVal) return;

    const circumference = 380;
    const offset = circumference - (targetScore / maxScore) * circumference;

    gaugeFill.style.strokeDashoffset = offset;

    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      if (current >= targetScore) {
        gaugeVal.textContent = targetScore;
        clearInterval(timer);
      } else {
        gaugeVal.textContent = current;
      }
    }, 15);
  }

  static renderSelfDrawingLineChart(containerId, dataPoints) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 200;

    const maxVal = Math.max(...dataPoints) * 1.2;
    const points = dataPoints.map((val, idx) => {
      const x = (idx / (dataPoints.length - 1)) * (width - 40) + 20;
      const y = height - (val / maxVal) * (height - 40) - 20;
      return `${x},${y}`;
    }).join(' ');

    const svgHTML = `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#00f3ff" />
            <stop offset="100%" stop-color="#9d4edd" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(0, 243, 255, 0.3)" />
            <stop offset="100%" stop-color="rgba(0, 243, 255, 0)" />
          </linearGradient>
        </defs>
        <path d="M 20,${height - 20} L ${points} L ${width - 20},${height - 20} Z" fill="url(#areaGrad)" />
        <polyline points="${points}" fill="none" stroke="url(#lineGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="animated-path" />
      </svg>
    `;

    container.innerHTML = svgHTML;
  }
}
