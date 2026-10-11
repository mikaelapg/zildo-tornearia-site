/**
 * Torno animado da abertura.
 * Desenha em <canvas> um torno visto de lado: placa girando, peça sendo usinada,
 * ferramenta avançando e cavacos saindo. A rotação é controlada pelo slider.
 * Com "reduzir movimento" ativo no sistema, mostra um quadro parado.
 */
(function () {
  "use strict";

  var canvas = document.getElementById("lathe");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var rpmInput = document.getElementById("rpm");
  var rpmOut = document.getElementById("rpm-out");
  var diaOut = document.getElementById("dia-out");
  var posOut = document.getElementById("pos-out");
  var pauseBtn = document.getElementById("lathe-pause");

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Espaço virtual de desenho
  var VW = 800, VH = 400;
  var CY = 188;                 // linha de centro
  var X0 = 236, X1 = 640;       // início e fim da peça
  var R_RAW = 54, R_CUT = 40;   // raios bruto e usinado
  var X_END = 300;              // até onde a ferramenta vai

  var state = {
    theta: 0,
    tx: X1,
    phase: "cut",               // cut | pause | swap | return
    t: 0,
    swapAlpha: 1,
    chips: [],
    paused: false,
    visible: true
  };

  var colors = {};
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    function v(name, fb) { var x = cs.getPropertyValue(name).trim(); return x || fb; }
    colors.machine = v("--lathe-machine", "#3F6B58");
    colors.machineDark = v("--lathe-machine-dark", "#2A4A3C");
    colors.bed = v("--lathe-bed", "#1B2E25");
    colors.steelLight = v("--lathe-steel-light", "#F1F3F2");
    colors.steel = v("--lathe-steel", "#B9C1BD");
    colors.steelDark = v("--lathe-steel-dark", "#5E6A65");
    colors.chip = v("--signal", "#F2C230");
    colors.line = v("--on-green-muted", "#B4C6BB");
  }

  var dpr = 1, scale = 1, offX = 0, offY = 0;
  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    scale = Math.min(canvas.width / VW, canvas.height / VH);
    offX = (canvas.width - VW * scale) / 2;
    offY = (canvas.height - VH * scale) / 2;
  }

  function rpm() { return rpmInput ? +rpmInput.value : 900; }

  // ---------- desenho ----------
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function cylinder(xa, xb, r, alpha, shiny) {
    if (xb <= xa) return;
    var g = ctx.createLinearGradient(0, CY - r, 0, CY + r);
    g.addColorStop(0, colors.steelDark);
    g.addColorStop(0.28, shiny ? colors.steelLight : colors.steel);
    g.addColorStop(0.5, colors.steel);
    g.addColorStop(1, colors.steelDark);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(xa, CY - r, xb - xa, r * 2);

    // faixas que andam com a rotação
    ctx.strokeStyle = shiny ? "rgba(255,255,255,.55)" : "rgba(0,0,0,.18)";
    ctx.lineWidth = shiny ? 1 : 1.4;
    for (var k = 0; k < 10; k++) {
      var phi = state.theta + k * (Math.PI / 5);
      var c = Math.cos(phi);
      if (c <= 0) continue;
      var y = CY + r * Math.sin(phi);
      ctx.globalAlpha = alpha * c * (shiny ? 0.9 : 0.6);
      ctx.beginPath();
      ctx.moveTo(xa, y);
      ctx.lineTo(xb, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offX, offY);

    // barramento
    ctx.fillStyle = colors.bed;
    roundRect(30, 300, 740, 34, 4); ctx.fill();
    ctx.fillStyle = colors.machineDark;
    ctx.fillRect(30, 300, 740, 6);
    // pés
    ctx.fillStyle = colors.bed;
    ctx.fillRect(60, 334, 70, 40);
    ctx.fillRect(670, 334, 70, 40);

    // cabeçote
    ctx.fillStyle = colors.machine;
    roundRect(40, 74, 150, 226, 8); ctx.fill();
    ctx.fillStyle = colors.machineDark;
    roundRect(40, 74, 150, 22, 8); ctx.fill();
    // mostrador de rotação
    ctx.fillStyle = colors.steelLight;
    ctx.beginPath(); ctx.arc(92, 250, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colors.bed; ctx.lineWidth = 3;
    var needle = -Math.PI * 0.75 + (rpm() - 200) / 1800 * Math.PI * 1.5;
    ctx.beginPath(); ctx.moveTo(92, 250);
    ctx.lineTo(92 + Math.cos(needle) * 14, 250 + Math.sin(needle) * 14); ctx.stroke();
    // alavancas
    ctx.strokeStyle = colors.steel; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(150, 240); ctx.lineTo(166, 214); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 270); ctx.lineTo(160, 262); ctx.stroke();
    ctx.lineCap = "butt";

    // placa (chuck)
    var g = ctx.createLinearGradient(0, CY - 86, 0, CY + 86);
    g.addColorStop(0, colors.steelDark); g.addColorStop(0.3, colors.steel); g.addColorStop(1, colors.steelDark);
    ctx.fillStyle = g;
    roundRect(190, CY - 86, 46, 172, 6); ctx.fill();
    // castanhas girando
    for (var j = 0; j < 3; j++) {
      var a = state.theta + j * (Math.PI * 2 / 3);
      var c = Math.cos(a);
      if (c <= -0.15) continue;
      var y = CY + Math.sin(a) * 66;
      ctx.globalAlpha = 0.45 + 0.55 * Math.max(0, c);
      ctx.fillStyle = colors.bed;
      ctx.fillRect(222, y - 9, 24, 18);
      ctx.globalAlpha = 1;
    }

    // peça: parte bruta e parte usinada
    var alpha = state.swapAlpha;
    cylinder(X0, state.tx, R_RAW, alpha, false);
    cylinder(state.tx, X1, R_CUT, alpha, true);
    // degrau
    if (state.tx < X1) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colors.steelDark;
      ctx.fillRect(state.tx - 2, CY - R_RAW, 3, R_RAW - R_CUT);
      ctx.fillRect(state.tx - 2, CY + R_CUT, 3, R_RAW - R_CUT);
      ctx.globalAlpha = 1;
    }

    // contraponto
    ctx.fillStyle = colors.machine;
    roundRect(668, 120, 92, 180, 8); ctx.fill();
    ctx.fillStyle = colors.machineDark;
    ctx.fillRect(668, 120, 92, 18);
    ctx.fillStyle = colors.steel;
    ctx.fillRect(650, CY - 14, 22, 28);
    ctx.beginPath(); ctx.moveTo(650, CY - 12); ctx.lineTo(634, CY); ctx.lineTo(650, CY + 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = colors.steel; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(760, 160); ctx.lineTo(786, 160); ctx.stroke();
    ctx.beginPath(); ctx.arc(788, 160, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.lineCap = "butt";

    // carro + porta-ferramenta
    var tx = state.tx;
    ctx.fillStyle = colors.machine;
    roundRect(tx - 46, 270, 112, 30, 4); ctx.fill();
    ctx.fillStyle = colors.machineDark;
    roundRect(tx - 20, CY + R_RAW + 14, 60, 270 - (CY + R_RAW + 14), 3); ctx.fill();
    // ferramenta (bit)
    ctx.fillStyle = colors.steelLight;
    ctx.beginPath();
    ctx.moveTo(tx, CY + R_CUT + 1);
    ctx.lineTo(tx + 26, CY + R_RAW + 20);
    ctx.lineTo(tx + 4, CY + R_RAW + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colors.chip;
    ctx.fillRect(tx - 2, CY + R_RAW + 20, 34, 6);

    // cavacos
    ctx.lineCap = "round";
    for (var i = 0; i < state.chips.length; i++) {
      var p = state.chips[i];
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
      ctx.strokeStyle = p.gold ? colors.chip : colors.steelLight;
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, p.rot, p.rot + p.span);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.lineCap = "butt";
  }

  // ---------- simulação ----------
  function spawnChips(dt) {
    var n = Math.random() < rpm() / 1800 * dt * 40 ? 1 + (Math.random() * 2 | 0) : 0;
    for (var i = 0; i < n; i++) {
      state.chips.push({
        x: state.tx + 4, y: CY + R_CUT + 2,
        vx: 40 + Math.random() * 120, vy: -60 - Math.random() * 160,
        r: 3 + Math.random() * 6, rot: Math.random() * 6.28, span: 2 + Math.random() * 3,
        vr: (Math.random() - 0.5) * 14, w: 1.6 + Math.random() * 1.4,
        age: 0, life: 0.9 + Math.random() * 0.8, gold: Math.random() < 0.35
      });
    }
    if (state.chips.length > 140) state.chips.splice(0, state.chips.length - 140);
  }

  function step(dt) {
    var speed = rpm() / 60 * Math.PI * 2 * 0.12;   // rotação visual
    state.theta += speed * dt;

    if (state.phase === "cut") {
      state.tx -= (12 + rpm() / 40) * dt;
      spawnChips(dt);
      if (state.tx <= X_END) { state.tx = X_END; state.phase = "pause"; state.t = 0; }
    } else if (state.phase === "pause") {
      state.t += dt;
      if (state.t > 0.9) { state.phase = "swap"; state.t = 0; }
    } else if (state.phase === "swap") {
      state.t += dt;
      state.swapAlpha = Math.max(0, 1 - state.t / 0.5);
      if (state.t > 0.5) { state.phase = "return"; state.t = 0; }
    } else if (state.phase === "return") {
      state.tx = Math.min(X1, state.tx + 420 * dt);
      state.swapAlpha = Math.min(1, state.swapAlpha + dt * 2);
      if (state.tx >= X1 && state.swapAlpha >= 1) { state.phase = "cut"; }
    }

    for (var i = state.chips.length - 1; i >= 0; i--) {
      var p = state.chips[i];
      p.age += dt;
      p.vy += 420 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.age > p.life) state.chips.splice(i, 1);
    }
  }

  function readouts() {
    if (rpmOut) rpmOut.textContent = rpm() + " rpm";
    var cutting = state.phase === "cut" || state.phase === "pause";
    var len = Math.max(0, (X1 - state.tx) / 2).toFixed(1).replace(".", ",");
    if (diaOut) diaOut.textContent = "Ø " + (R_RAW * 2 / 2).toFixed(0) + " → " + (R_CUT * 2 / 2).toFixed(0) + " mm";
    if (posOut) posOut.textContent = (cutting ? "Z −" + len : "Troca de peça");
  }

  var last = 0, raf = 0;
  function loop(ts) {
    raf = 0;
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    if (!state.paused) step(dt);
    draw();
    readouts();
    schedule();
  }
  function schedule() {
    if (!raf && state.visible && !reduce && !state.paused) raf = requestAnimationFrame(loop);
  }

  // ---------- início ----------
  readColors();
  resize();
  state.tx = reduce ? 470 : X1 - 60;
  draw();
  readouts();

  window.addEventListener("resize", function () { resize(); draw(); });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onScheme = function () { readColors(); draw(); };
    if (mq.addEventListener) mq.addEventListener("change", onScheme);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      state.visible = entries[0].isIntersecting;
      if (state.visible) { last = 0; schedule(); }
    }).observe(canvas);
  }

  if (rpmInput) rpmInput.addEventListener("input", function () { readouts(); if (reduce || state.paused) draw(); });

  if (pauseBtn) {
    if (reduce) { state.paused = true; pauseBtn.textContent = "Ligar"; pauseBtn.setAttribute("aria-pressed", "true"); }
    pauseBtn.addEventListener("click", function () {
      state.paused = !state.paused;
      reduce = false;
      pauseBtn.textContent = state.paused ? "Ligar" : "Desligar";
      pauseBtn.setAttribute("aria-pressed", String(state.paused));
      last = 0;
      schedule();
    });
  }

  schedule();
})();
