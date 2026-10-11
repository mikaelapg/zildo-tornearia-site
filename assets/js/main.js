/**
 * Zildo Tornearia — comportamento do site.
 *
 * Configuração no topo (horário, fundação, envio de e-mail).
 * Os textos ficam no index.html. O número do WhatsApp e o e-mail vêm
 * dos atributos data-whatsapp e data-email do <body>.
 */
(function () {
  "use strict";

  // ===================== CONFIGURAÇÃO =====================
  // Horário de funcionamento. 0 = domingo ... 6 = sábado. Lista vazia = fechado.
  var HORARIO = {
    0: [],
    1: [["08:00", "18:00"]],
    2: [["08:00", "18:00"]],
    3: [["08:00", "18:00"]],
    4: [["08:00", "18:00"]],
    5: [["08:00", "18:00"]],
    6: []
  };
  var FUSO = "America/Sao_Paulo";
  var FUNDACAO = 1994;
  // Envio do formulário por e-mail via FormSubmit (formsubmit.co), sem servidor próprio.
  // No primeiro envio, a FormSubmit manda um e-mail de ativação para a oficina.
  // Depois de ativar, dá para trocar o e-mail abaixo pelo código aleatório que eles fornecem.
  var FORM_ENDPOINT = "https://formsubmit.co/ajax/" + (document.body.getAttribute("data-email") || "");
  // =========================================================

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phone = (document.body.getAttribute("data-whatsapp") || "").replace(/\D/g, "");
  function waLink(text) { return "https://wa.me/" + phone + (text ? "?text=" + encodeURIComponent(text) : ""); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // ---------- WhatsApp: links com mensagem pronta ----------
  $$(".js-wa").forEach(function (a) {
    a.href = waLink(a.getAttribute("data-msg") || "Olá! Vim pelo site da Zildo Tornearia.");
  });

  // ---------- Ano e anos de oficina ----------
  var now = new Date();
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(now.getFullYear());
  var anos = $("#anos");
  if (anos) { var n = now.getFullYear() - FUNDACAO; anos.textContent = n; anos.setAttribute("data-to", n); }

  // ---------- Aberto / fechado ----------
  function nowInTZ() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: FUSO, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var m = {}; parts.forEach(function (p) { m[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[m.weekday], minutes: (parseInt(m.hour, 10) % 24) * 60 + parseInt(m.minute, 10) };
    } catch (e) { var d = new Date(); return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() }; }
  }
  function toMin(s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; }
  function fmt(s) { var p = s.split(":"); return +p[0] + "h" + (p[1] !== "00" ? p[1] : ""); }
  var DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  function openState() {
    var t = nowInTZ(), slots = HORARIO[t.day] || [], open = null;
    slots.forEach(function (s) { if (t.minutes >= toMin(s[0]) && t.minutes < toMin(s[1])) open = s; });
    if (open) return { open: true, text: "Aberto agora · fecha às " + fmt(open[1]) };
    for (var i = 0; i < 8; i++) {
      var day = (t.day + i) % 7, ss = HORARIO[day] || [];
      for (var j = 0; j < ss.length; j++) {
        if (i > 0 || toMin(ss[j][0]) > t.minutes) {
          var when = i === 0 ? "hoje" : i === 1 ? "amanhã" : DIAS[day];
          return { open: false, text: "Fechado agora · abre " + when + " às " + fmt(ss[j][0]) };
        }
      }
    }
    return { open: false, text: "Fechado agora" };
  }
  function updateStatus() {
    var st = openState(), el = $("#status");
    if (el) {
      el.classList.toggle("is-open", st.open);
      el.classList.toggle("is-closed", !st.open);
      $(".status-text", el).textContent = st.text;
    }
    var sub = $("#chat-sub");
    if (sub) sub.textContent = st.open ? "Online agora · responde em minutos" : "Responde no próximo horário comercial";
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  // ---------- Revelar ao rolar + contadores ----------
  function countUp(el) {
    var from = +el.getAttribute("data-from") || 0, to = +el.getAttribute("data-to") || 0;
    if (reduceMotion) { el.textContent = to; return; }
    var start = null, dur = 1400;
    function tick(ts) {
      if (!start) start = ts;
      var k = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        $$(".count", en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
    // segurança: nada fica invisível se o observer falhar
    setTimeout(function () { reveals.forEach(function (el) { el.classList.add("is-in"); }); }, 6000);
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  // ---------- Topo: sombra, engrenagem girando, seção atual ----------
  var top = $("#topo"), gear = $(".gear-spin"), ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || 0;
    if (top) top.classList.toggle("is-scrolled", y > 8);
    if (gear && !reduceMotion) gear.style.setProperty("--gear-rot", (y * 0.25) + "deg");
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  var navLinks = $$(".nav a");
  if ("IntersectionObserver" in window && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle("is-current", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) spy.observe(s); });
  }

  // ---------- Filtro de serviços ----------
  var chips = $$(".filters .chip"), items = $$("#svc-list li");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) { var on = c === chip; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", String(on)); });
      items.forEach(function (li, i) {
        var show = f === "todos" || li.getAttribute("data-cat") === f;
        if (!show) { li.classList.add("is-hidden"); return; }
        var wasHidden = li.classList.contains("is-hidden");
        li.classList.remove("is-hidden");
        if (wasHidden && !reduceMotion) {
          li.classList.add("is-entering");
          li.style.transitionDelay = (i % 6) * 40 + "ms";
          requestAnimationFrame(function () { requestAnimationFrame(function () { li.classList.remove("is-entering"); }); });
        }
      });
    });
  });

  // ---------- Galeria: ilustração enquanto não há foto + lightbox ----------
  var ART = {
    gear: function () {
      var d = "", teeth = 18, R = 62, r = 52, cx = 200, cy = 112;
      for (var i = 0; i < teeth; i++) {
        var a0 = i / teeth * Math.PI * 2, a1 = a0 + Math.PI / teeth * 0.45, a2 = a0 + Math.PI / teeth, a3 = a2 + Math.PI / teeth * 0.45;
        var pts = [[r, a0], [R, a1], [R, a2], [r, a3]];
        pts.forEach(function (p, k) { d += (i === 0 && k === 0 ? "M" : "L") + (cx + p[0] * Math.cos(p[1])).toFixed(1) + " " + (cy + p[0] * Math.sin(p[1])).toFixed(1); });
      }
      d += "Z";
      return '<g class="spin"><path class="f" d="' + d + '"/><path class="s" d="' + d + '"/><circle class="s" cx="200" cy="112" r="18"/><path class="a" d="M196 94h8v6h-8z"/></g>' +
        '<g class="spin" style="transition-duration:2s"><circle class="s" cx="300" cy="80" r="26" stroke-dasharray="6 5"/><circle class="s" cx="300" cy="80" r="8"/></g>';
    },
    pin: function () {
      return '<path class="s f" d="M60 70h40v90H60z"/><path class="s f" d="M100 90h30v50h-30z"/>' +
        '<g class="slide"><path class="a" d="M115 40v150"/><path class="s" d="M108 40h14"/></g>' +
        '<path class="s" d="M150 115c20-30 40-30 60 0s40 30 60 0"/>';
    },
    bushing: function () {
      return '<ellipse class="s f" cx="140" cy="80" rx="46" ry="16"/><path class="s" d="M94 80v70M186 80v70"/><path class="s" d="M94 150a46 16 0 0 0 92 0"/>' +
        '<ellipse class="a" cx="140" cy="80" rx="26" ry="9"/>' +
        '<g class="slide"><ellipse class="s" cx="260" cy="70" rx="24" ry="8"/><path class="s" d="M236 70v60M284 70v60"/><path class="s" d="M236 130a24 8 0 0 0 48 0"/></g>';
    },
    motor: function () {
      var coil = "";
      for (var i = 0; i < 12; i++) coil += '<path class="' + (i % 3 === 0 ? "a" : "s") + '" d="M' + (110 + i * 12) + ' 60v100"/>';
      return '<rect class="s f" x="96" y="50" width="160" height="120" rx="14"/>' + coil +
        '<path class="s" d="M256 110h60"/><g class="spin"><circle class="s" cx="316" cy="110" r="16"/><path class="s" d="M316 94v32M300 110h32"/></g>' +
        '<path class="s" d="M120 170v24M232 170v24M100 194h152"/>';
    },
    disc: function () {
      var holes = "";
      for (var i = 0; i < 5; i++) {
        var a = i / 5 * Math.PI * 2;
        holes += '<circle class="a" cx="' + (200 + Math.cos(a) * 26).toFixed(1) + '" cy="' + (112 + Math.sin(a) * 26).toFixed(1) + '" r="5"/>';
      }
      var vents = "";
      for (var j = 0; j < 16; j++) {
        var b = j / 16 * Math.PI * 2;
        vents += '<path class="s" d="M' + (200 + Math.cos(b) * 58).toFixed(1) + " " + (112 + Math.sin(b) * 58).toFixed(1) + "L" + (200 + Math.cos(b + 0.25) * 78).toFixed(1) + " " + (112 + Math.sin(b + 0.25) * 78).toFixed(1) + '"/>';
      }
      return '<g class="spin"><circle class="s f" cx="200" cy="112" r="84"/><circle class="s" cx="200" cy="112" r="44"/>' + holes + vents + '<circle class="s" cx="200" cy="112" r="12"/></g>';
    },
    planer: function () {
      return '<path class="s f" d="M60 120h280v26H60z"/><path class="s" d="M80 146v40M320 146v40"/>' +
        '<path class="s f" d="M150 62h100v40H150z"/>' +
        '<g class="spin"><circle class="s" cx="200" cy="112" r="10"/><path class="a" d="M190 112h20M200 102v20"/></g>' +
        '<g class="slide"><path class="a" d="M90 112h50"/><path class="a" d="M260 112h50"/></g>';
    }
  };
  $$(".shot").forEach(function (fig) {
    var img = $("img", fig);
    function empty() {
      if (fig.classList.contains("is-empty")) return;
      fig.classList.add("is-empty");
      var make = ART[fig.getAttribute("data-art")];
      if (make) fig.insertAdjacentHTML("afterbegin", '<svg class="art" viewBox="0 0 400 224" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + make() + "</svg>");
      var btn = $(".shot-btn", fig); if (btn) { btn.disabled = true; btn.removeAttribute("aria-label"); }
    }
    if (!img) return;
    if (img.complete && img.naturalWidth === 0) empty();
    img.addEventListener("error", empty);
  });

  var lb = $("#lightbox"), lbImg = $("#lb-img"), lbCap = $("#lb-cap"), lastFocus = null;
  function closeLb() { if (!lb) return; lb.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  $$(".shot-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var fig = btn.closest(".shot"), img = $("img", fig);
      if (!img || fig.classList.contains("is-empty")) return;
      lastFocus = btn;
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
      lbCap.textContent = $("figcaption", fig).textContent;
      lb.hidden = false; document.body.style.overflow = "hidden";
      $("#lb-close").focus();
    });
  });
  if (lb) {
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.id === "lb-close") closeLb(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeLb(); });
  }

  // ---------- Mapa sob demanda ----------
  var mapBtn = $("#map-load");
  if (mapBtn) mapBtn.addEventListener("click", function () {
    var map = $("#map");
    var q = encodeURIComponent("R. Vasco da Gama, 40, Sumaré, Alvorada - RS");
    map.innerHTML = '<iframe title="Mapa da Zildo Tornearia" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=' + q + '&z=16&output=embed"></iframe>';
  });

  // ---------- Formulário de orçamento ----------
  var form = $("#quote-form");
  if (form) {
    var errorBox = $("#form-error"), sendBtn = $("#send-email"), sent = $("#form-sent"), waBtn = $(".js-wa-form", form);
    function val(name) { var el = form.elements[name]; return el ? String(el.value).trim() : ""; }
    function message() {
      var lines = ["Olá! Vim pelo site e gostaria de um orçamento."];
      if (val("nome")) lines.push("Nome: " + val("nome") + " (" + val("tipo").toLowerCase() + ")");
      if (val("telefone")) lines.push("Contato: " + val("telefone"));
      lines.push("Serviço: " + val("servico"));
      if (val("mensagem")) lines.push("Problema: " + val("mensagem"));
      return lines.join("\n");
    }
    function syncWa() { if (waBtn) waBtn.href = waLink(message()); }
    form.addEventListener("input", function (e) {
      syncWa();
      var f = e.target.closest(".field"); if (f) f.classList.remove("has-error");
    });
    form.addEventListener("change", syncWa);
    syncWa();

    function showError(text) { errorBox.textContent = text; errorBox.hidden = !text; }
    function validate() {
      var missing = [];
      ["nome", "telefone", "mensagem"].forEach(function (name) {
        var el = form.elements[name];
        if (!String(el.value).trim()) { missing.push(el); el.closest(".field").classList.add("has-error"); }
      });
      var email = form.elements.email;
      if (email.value && !/^\S+@\S+\.\S+$/.test(email.value)) { missing.push(email); email.closest(".field").classList.add("has-error"); }
      if (missing.length) { showError("Preencha nome, telefone e o problema para enviar."); missing[0].focus(); return false; }
      showError(""); return true;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements._honey.value) return;
      if (!validate()) return;
      sendBtn.classList.add("is-loading");
      $(".send-label", sendBtn).textContent = "Enviando";
      var payload = {
        _subject: "Pedido de orçamento pelo site · " + val("servico"),
        _template: "table",
        _captcha: "false",
        Nome: val("nome"),
        Telefone: val("telefone"),
        "E-mail": val("email") || "não informado",
        Cliente: val("tipo"),
        Serviço: val("servico"),
        Mensagem: val("mensagem")
      };
      if (val("email")) payload._replyto = val("email");
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      }).then(function (data) {
        if (data && String(data.success) === "false") throw new Error(data.message || "falha");
        sent.hidden = false;
        $("#form-again").focus();
      }).catch(function () {
        showError("Não deu para enviar agora. Use o botão do WhatsApp ao lado, a mensagem já vai preenchida.");
      }).then(function () {
        sendBtn.classList.remove("is-loading");
        $(".send-label", sendBtn).textContent = "Enviar pedido";
      });
    });

    $("#form-again").addEventListener("click", function () {
      form.reset(); syncWa(); sent.hidden = true; form.elements.nome.focus();
    });
  }

  // ---------- Atendimento WhatsApp ----------
  var chatBtn = $("#chat-btn"), panel = $("#chat-panel");
  if (chatBtn && panel) {
    var greeted = false;
    function openChat(open) {
      panel.hidden = !open;
      chatBtn.setAttribute("aria-expanded", String(open));
      if (!open) return;
      chatBtn.classList.add("seen");
      if (!greeted) {
        greeted = true;
        setTimeout(function () {
          $("#chat-typing").hidden = true;
          $("#chat-hello").hidden = false;
          setTimeout(function () { $("#chat-quick").hidden = false; }, reduceMotion ? 0 : 250);
        }, reduceMotion ? 0 : 1100);
      }
      setTimeout(function () { $("#chat-text").focus(); }, 50);
    }
    chatBtn.addEventListener("click", function () { openChat(panel.hidden); });
    $("#chat-close").addEventListener("click", function () { openChat(false); chatBtn.focus(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { openChat(false); chatBtn.focus(); } });
    $("#chat-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var text = $("#chat-text").value.trim() || "Olá! Vim pelo site da Zildo Tornearia.";
      var a = document.createElement("a");
      a.href = waLink(text); a.target = "_blank"; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
      $("#chat-text").value = "";
    });
  }
})();
