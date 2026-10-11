/**
 * Zildo Tornearia — comportamento do site.
 *
 * O conteúdo (textos, telefone, endereço) fica no index.html.
 * Este arquivo só monta os links do WhatsApp e do mapa e cuida do formulário de orçamento.
 * O número do WhatsApp vem do atributo data-whatsapp do <body>.
 */
(function () {
  "use strict";

  var body = document.body;
  var phone = (body.getAttribute("data-whatsapp") || "").replace(/\D/g, "");
  var business = body.getAttribute("data-business") || "";
  var waBase = "https://wa.me/" + phone;

  function waLink(text) {
    return waBase + "?text=" + encodeURIComponent(text);
  }

  // Botões genéricos de WhatsApp
  var greeting = "Olá, vim pelo site da " + business + " e gostaria de um orçamento.";
  document.querySelectorAll(".js-wa").forEach(function (a) {
    a.href = waLink(greeting);
  });

  // Link do mapa a partir do endereço exibido na página
  document.querySelectorAll(".js-map").forEach(function (a) {
    var addrEl = a.parentElement && a.parentElement.querySelector("span");
    if (!addrEl) return;
    var address = addrEl.textContent.replace(/·/g, ",").trim();
    a.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
  });

  // Ano no rodapé
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Formulário de orçamento → mensagem pronta para o WhatsApp
  var form = document.getElementById("quote-form");
  if (!form) return;

  var preview = document.getElementById("f-preview");
  var send = form.querySelector(".js-wa-form");
  var copyBtn = document.getElementById("copy-btn");
  var status = document.getElementById("copy-status");

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function buildMessage() {
    var lines = ["Olá! Gostaria de um orçamento."];
    var nome = val("f-nome");
    var empresa = val("f-empresa");
    var qtd = val("f-qtd");
    var msg = val("f-msg");
    if (nome) lines.push("Nome: " + nome + (empresa ? " (" + empresa + ")" : ""));
    lines.push("Serviço: " + val("f-servico"));
    if (qtd) lines.push("Quantidade: " + qtd);
    if (msg) lines.push("Peça: " + msg);
    return lines.join("\n");
  }

  function update() {
    var message = buildMessage();
    if (preview) preview.textContent = message;
    if (send) send.href = waLink(message);
  }

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (send) send.click();
  });
  update();

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var text = buildMessage();
      function fallback() {
        if (!preview) return;
        var range = document.createRange();
        range.selectNodeContents(preview);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        status.textContent = "Texto selecionado. Use Ctrl+C para copiar.";
      }
      try {
        navigator.clipboard.writeText(text).then(function () {
          status.textContent = "Mensagem copiada.";
        }, fallback);
      } catch (err) {
        fallback();
      }
    });
  }
})();
