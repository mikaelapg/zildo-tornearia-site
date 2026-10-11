/**
 * Zildo Tornearia — comportamento do site.
 *
 * Os textos ficam no index.html. Aqui ficam só:
 *  - o horário de funcionamento (usado no aviso "Aberto agora");
 *  - os links do WhatsApp e o formulário de orçamento;
 *  - o painel das fotos que ainda não foram enviadas.
 */
(function () {
  "use strict";

  // Horário de funcionamento. 0 = domingo ... 6 = sábado. Horas em formato 24h.
  // Para fechar um dia, deixe a lista vazia. Para intervalo de almoço, use dois períodos.
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

  var phone = (document.body.getAttribute("data-whatsapp") || "").replace(/\D/g, "");
  var waBase = "https://wa.me/" + phone;
  function waLink(text) { return waBase + "?text=" + encodeURIComponent(text); }

  // Links genéricos de WhatsApp
  document.querySelectorAll(".js-wa").forEach(function (a) {
    a.href = waLink("Olá! Vim pelo site da Zildo Tornearia e gostaria de um orçamento.");
  });

  // Ano no rodapé
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Fotos que ainda não existem viram painel com legenda
  document.querySelectorAll(".shot img").forEach(function (img) {
    var mark = function () { img.closest(".shot").classList.add("is-empty"); };
    if (img.complete && img.naturalWidth === 0) mark();
    img.addEventListener("error", mark);
  });

  // "Aberto agora" / "Fechado agora"
  function nowInTZ() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: FUSO, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[map.weekday], minutes: (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function toMin(hhmm) { var p = hhmm.split(":"); return +p[0] * 60 + +p[1]; }
  function fmt(hhmm) { var p = hhmm.split(":"); return +p[0] + "h" + (p[1] !== "00" ? p[1] : ""); }
  var NOMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

  function nextOpening(now) {
    for (var i = 0; i < 8; i++) {
      var day = (now.day + i) % 7;
      var slots = HORARIO[day] || [];
      for (var j = 0; j < slots.length; j++) {
        if (i > 0 || toMin(slots[j][0]) > now.minutes) {
          var when = i === 0 ? "hoje" : i === 1 ? "amanhã" : NOMES[day];
          return "Abre " + when + " às " + fmt(slots[j][0]);
        }
      }
    }
    return "";
  }

  function updateStatus() {
    var el = document.getElementById("status");
    if (!el) return;
    var text = el.querySelector(".status-text");
    var now = nowInTZ();
    var slots = HORARIO[now.day] || [];
    var open = null;
    slots.forEach(function (s) {
      if (now.minutes >= toMin(s[0]) && now.minutes < toMin(s[1])) open = s;
    });
    el.classList.toggle("is-open", !!open);
    el.classList.toggle("is-closed", !open);
    text.textContent = open
      ? "Aberto agora · fecha às " + fmt(open[1])
      : "Fechado agora · " + nextOpening(now);
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  // Formulário de orçamento → mensagem pronta no WhatsApp
  var form = document.getElementById("quote-form");
  if (!form) return;
  var fallbackLink = form.querySelector(".js-wa-form");

  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function buildMessage() {
    var lines = ["Olá! Vim pelo site e gostaria de um orçamento."];
    var nome = val("f-nome");
    if (nome) lines.push("Nome: " + nome + " (" + val("f-tipo").toLowerCase() + ")");
    else lines.push("Sou: " + val("f-tipo").toLowerCase());
    lines.push("Serviço: " + val("f-servico"));
    var msg = val("f-msg");
    if (msg) lines.push("Problema: " + msg);
    lines.push("Vou mandar a foto da peça em seguida.");
    return lines.join("\n");
  }
  function sync() { if (fallbackLink) fallbackLink.href = waLink(buildMessage()); }

  form.addEventListener("input", sync);
  form.addEventListener("change", sync);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    sync();
    if (fallbackLink) fallbackLink.click();
  });
  sync();
})();
