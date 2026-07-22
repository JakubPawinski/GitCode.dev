(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    var GLYPHS = '01<>{}[]/\\+-=.:';
    var CELL = 26;
    var canvas = document.createElement('canvas');
    canvas.id = 'gc-bg-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);

    var ctx = canvas.getContext('2d');
    var cells = [];
    var cols = 0;
    var rows = 0;
    var width = 0;
    var height = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var lastFrame = 0;
    var running = true;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(width / CELL) + 1;
      rows = Math.ceil(height / CELL) + 1;
      cells = new Array(cols * rows).fill(0).map(function () {
        return { glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0] };
      });
    }

    function frame(t) {
      if (!running) return;
      requestAnimationFrame(frame);
      if (t - lastFrame < 40) return; // ~25fps cap
      lastFrame = t;

      var time = t * 0.0006;
      ctx.clearRect(0, 0, width, height);
      ctx.font = (CELL - 8) + 'px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';

      for (var gy = 0; gy < rows; gy++) {
        for (var gx = 0; gx < cols; gx++) {
          var cell = cells[gy * cols + gx];
          var wave =
            Math.sin(gx * 0.35 + time * 1.4) *
              Math.cos(gy * 0.3 - time * 1.1) +
            Math.sin((gx + gy) * 0.15 + time * 0.8) * 0.6;
          var intensity = (wave + 1.6) / 3.2; // roughly 0..1

          if (intensity < 0.58) continue;

          if (Math.random() < 0.004) {
            cell.glyph = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }

          var alpha = Math.min(0.42, (intensity - 0.58) * 1.1);
          ctx.fillStyle = 'rgba(139, 92, 246, ' + alpha.toFixed(3) + ')';
          ctx.fillText(cell.glyph, gx * CELL, gy * CELL);
        }
      }
    }

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
  }
})();
