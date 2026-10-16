/**
 * Loja Zildo — catálogo, carrinho, Pix e pedido pelo WhatsApp.
 *
 * Sem servidor e sem banco de dados: os produtos vêm da planilha do Google
 * (se configurada) ou da cópia local em assets/data/produtos.js; o carrinho
 * fica só no navegador do cliente; o pedido sai como mensagem de WhatsApp.
 */
(function () {
  "use strict";

  // ======================== CONFIGURAÇÃO DA LOJA ========================
  var LOJA = {
    nome: "Zildo Tornearia",
    whatsapp: "5551993135373",          // WhatsApp que recebe os pedidos (55 + DDD + número)
    cnpj: "00.000.000/0001-00",          // CNPJ exibido no rodapé
    pix: {
      chave: "00.000.000/0001-00",       // Chave Pix da empresa (de preferência o CNPJ)
      recebedor: "Zildo Tornearia",      // Nome como aparece no banco
      cidade: "Alvorada",
      exemplo: true                      // true = mostra aviso de demonstração. Trocar para false com a chave real.
    },
    // Link CSV da planilha publicada (Arquivo > Compartilhar > Publicar na Web > CSV).
    // Vazio = usa a lista de assets/data/produtos.js.
    planilhaCsv: ""
  };
  // =======================================================================

  var CART_KEY = "zildo-loja-carrinho-v1";
  var produtos = [];
  var porId = {};
  var filtro = { q: "", cat: "", marcas: [], min: null, max: null, estoque: false, feito: false, ordem: "relevancia" };
  var carrinho = carregarCarrinho();
  var etapa = "itens";
  var pedido = null;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function brl(v) { return moeda.format(v || 0); }
  function semAcento(t) { return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function waLink(texto) { return "https://wa.me/" + LOJA.whatsapp + "?text=" + encodeURIComponent(texto); }
  function abrirLink(url) {
    var a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  }

  // ------------------------------------------------------------ Desenhos
  function desenho(tipo) {
    var o = '<svg class="art-svg" viewBox="0 0 120 120" aria-hidden="true">';
    switch (tipo) {
      case "rolamento":
        o += '<circle class="ln" cx="60" cy="60" r="46"/><circle class="ln" cx="60" cy="60" r="40"/><circle class="ln" cx="60" cy="60" r="22"/><circle class="ln" cx="60" cy="60" r="16"/>';
        for (var i = 0; i < 10; i++) {
          var a = i / 10 * Math.PI * 2;
          o += '<circle class="ac" cx="' + (60 + Math.cos(a) * 31).toFixed(1) + '" cy="' + (60 + Math.sin(a) * 31).toFixed(1) + '" r="6"/>';
        }
        break;
      case "retentor":
        o += '<circle class="fl" cx="60" cy="60" r="44"/><circle class="ln" cx="60" cy="60" r="44"/><circle class="ln" cx="60" cy="60" r="34"/><circle class="ac" cx="60" cy="60" r="26" stroke-dasharray="3 3"/><circle class="ln bg" cx="60" cy="60" r="20"/>';
        break;
      case "bucha":
        o += '<ellipse class="fl" cx="52" cy="36" rx="30" ry="11"/><path class="ln" d="M22 36v48M82 36v48"/><path class="ln" d="M22 84a30 11 0 0 0 60 0"/><ellipse class="ln" cx="52" cy="36" rx="30" ry="11"/><ellipse class="ac" cx="52" cy="36" rx="18" ry="6.5"/><path class="ln" d="M90 30h14M90 90h14M97 30v60" stroke-dasharray="2 3"/>';
        break;
      case "pino":
        o += '<rect class="fl" x="18" y="50" width="74" height="20" rx="3"/><rect class="ln" x="18" y="50" width="74" height="20" rx="3"/><rect class="ln" x="10" y="44" width="12" height="32" rx="2"/><path class="ac" d="M80 50v20M86 50v20"/><ellipse class="ln" cx="100" cy="60" rx="8" ry="14"/><ellipse class="ac" cx="100" cy="60" rx="3.5" ry="7"/>';
        break;
      case "correia":
        o += '<rect class="ln" x="14" y="34" width="92" height="52" rx="26"/><rect class="ln" x="24" y="44" width="72" height="32" rx="16"/><circle class="ac" cx="40" cy="60" r="10"/><circle class="ac" cx="80" cy="60" r="10"/>';
        break;
      default:
        o += '<circle class="ln" cx="60" cy="60" r="40"/>';
    }
    return o + "</svg>";
  }

  // ------------------------------------------------------------ Produtos
  function prepararProdutos(lista) {
    produtos = lista.filter(function (p) { return p && p.codigo && p.nome && p.preco > 0; }).map(function (p, i) {
      p.id = p.id || ("p" + i);
      p.estoque = Number(p.estoque) || 0;
      p.preco = Math.round(Number(p.preco) * 100) / 100;
      p._busca = semAcento([p.codigo, p.nome, p.marca, p.categoria, p.medidas].join(" ")).replace(/[×x*]/g, " ");
      p._ordem = i;
      return p;
    });
    porId = {};
    produtos.forEach(function (p) { porId[p.id] = p; });
    // remove do carrinho o que não existe mais ou passou do estoque
    Object.keys(carrinho).forEach(function (id) {
      var p = porId[id];
      if (!p || p.estoque <= 0) delete carrinho[id];
      else if (carrinho[id] > p.estoque) carrinho[id] = p.estoque;
    });
    salvarCarrinho();
  }

  function lerCsv(texto) {
    var linhas = [], campo = "", linha = [], aspas = false;
    for (var i = 0; i < texto.length; i++) {
      var c = texto[i];
      if (aspas) {
        if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
        else if (c === '"') aspas = false;
        else campo += c;
      } else if (c === '"') aspas = true;
      else if (c === ",") { linha.push(campo); campo = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && texto[i + 1] === "\n") i++;
        linha.push(campo); linhas.push(linha); linha = []; campo = "";
      } else campo += c;
    }
    if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
    var cab = (linhas.shift() || []).map(function (h) { return semAcento(h).trim().replace(/\s+/g, "_"); });
    return linhas.filter(function (l) { return l.join("").trim(); }).map(function (l) {
      var o = {};
      cab.forEach(function (h, j) { o[h] = (l[j] || "").trim(); });
      return {
        id: o.id || o.codigo,
        codigo: o.codigo, nome: o.nome, categoria: o.categoria || "Outros", marca: o.marca || "",
        preco: Number(String(o.preco || "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")),
        estoque: Number(o.estoque), medidas: o.medidas, desenho: o.desenho || "rolamento",
        feitoAqui: /^(sim|s|x|1|true)$/i.test(o.feito_aqui || ""), descricao: o.descricao
      };
    });
  }

  function carregarProdutos() {
    prepararProdutos(window.ZILDO_PRODUTOS || []);
    if (!LOJA.planilhaCsv) return Promise.resolve();
    return fetch(LOJA.planilhaCsv, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (t) {
        var lista = lerCsv(t);
        if (lista.length) prepararProdutos(lista);
      })
      .catch(function () { /* fica a cópia local */ });
  }

  // ------------------------------------------------------------ Filtros
  function aplicaFiltro(p, ignorar) {
    if (filtro.q) {
      var termos = semAcento(filtro.q).replace(/[×x*]/g, " ").split(/\s+/).filter(Boolean);
      for (var i = 0; i < termos.length; i++) if (p._busca.indexOf(termos[i]) < 0) return false;
    }
    if (ignorar !== "cat" && filtro.cat && p.categoria !== filtro.cat) return false;
    if (ignorar !== "marca" && filtro.marcas.length && filtro.marcas.indexOf(p.marca) < 0) return false;
    if (filtro.min != null && p.preco < filtro.min) return false;
    if (filtro.max != null && p.preco > filtro.max) return false;
    if (filtro.estoque && p.estoque <= 0) return false;
    if (filtro.feito && !p.feitoAqui) return false;
    return true;
  }

  function contar(campo, ignorar) {
    var c = {};
    produtos.forEach(function (p) { if (aplicaFiltro(p, ignorar)) c[p[campo]] = (c[p[campo]] || 0) + 1; });
    return c;
  }

  function renderFiltros() {
    var cats = {}, marcas = {};
    produtos.forEach(function (p) { cats[p.categoria] = 1; if (p.marca) marcas[p.marca] = 1; });
    var cc = contar("categoria", "cat"), cm = contar("marca", "marca");
    var totalCat = produtos.filter(function (p) { return aplicaFiltro(p, "cat"); }).length;
    $("#f-cats").innerHTML =
      '<label class="radio"><input type="radio" name="cat" value=""' + (filtro.cat ? "" : " checked") + '> Todas <span class="n">' + totalCat + "</span></label>" +
      Object.keys(cats).map(function (c) {
        return '<label class="radio"><input type="radio" name="cat" value="' + esc(c) + '"' + (filtro.cat === c ? " checked" : "") + "> " + esc(c) + ' <span class="n">' + (cc[c] || 0) + "</span></label>";
      }).join("");
    $("#f-brands").innerHTML = Object.keys(marcas).sort().map(function (m) {
      return '<label class="check"><input type="checkbox" name="marca" value="' + esc(m) + '"' + (filtro.marcas.indexOf(m) >= 0 ? " checked" : "") + "> " + esc(m) + ' <span class="n">' + (cm[m] || 0) + "</span></label>";
    }).join("");
  }

  function renderChips() {
    var chips = [];
    if (filtro.q) chips.push(["q", "Busca: " + filtro.q]);
    if (filtro.cat) chips.push(["cat", filtro.cat]);
    filtro.marcas.forEach(function (m) { chips.push(["marca:" + m, m]); });
    if (filtro.min != null || filtro.max != null) chips.push(["preco", (filtro.min != null ? brl(filtro.min) : "R$ 0") + " a " + (filtro.max != null ? brl(filtro.max) : "mais")]);
    if (filtro.estoque) chips.push(["estoque", "Com estoque"]);
    if (filtro.feito) chips.push(["feito", "Feito na tornearia"]);
    $("#active-chips").innerHTML = chips.map(function (c) {
      return '<button type="button" class="chip-x" data-remove="' + esc(c[0]) + '">' + esc(c[1]) + ' <span aria-hidden="true">×</span><span class="visually-hidden"> (remover filtro)</span></button>';
    }).join("");
    var n = chips.length - (filtro.q ? 1 : 0), badge = $("#filters-badge");
    badge.hidden = n === 0;
    badge.textContent = n;
  }

  function renderGrade() {
    var lista = produtos.filter(function (p) { return aplicaFiltro(p); });
    var ord = filtro.ordem;
    lista.sort(function (a, b) {
      if (ord === "menor") return a.preco - b.preco;
      if (ord === "maior") return b.preco - a.preco;
      if (ord === "az") return a.nome.localeCompare(b.nome, "pt-BR");
      if ((a.estoque > 0) !== (b.estoque > 0)) return a.estoque > 0 ? -1 : 1;
      return a._ordem - b._ordem;
    });
    $("#count").textContent = lista.length;
    $("#results-title").lastChild.textContent = lista.length === 1 ? " produto" : " produtos";
    $("#empty").hidden = lista.length > 0;
    $("#grid").innerHTML = lista.map(cartao).join("");
    renderFiltros();
    renderChips();
  }

  function selo(p) {
    if (p.estoque <= 0) return '<span class="stock out">Sob encomenda</span>';
    if (p.estoque <= 5) return '<span class="stock low">Últimas ' + p.estoque + " unidades</span>";
    return '<span class="stock ok">Em estoque</span>';
  }

  function cartao(p) {
    var noCarrinho = carrinho[p.id] || 0;
    var acao = p.estoque > 0
      ? '<button type="button" class="btn btn-primary btn-add" data-add="' + p.id + '">' + (noCarrinho ? "No carrinho (" + noCarrinho + ")" : "Adicionar") + "</button>"
      : '<a class="btn btn-ghost btn-add" href="' + esc(waLink("Olá! Quero encomendar: " + p.codigo + " (" + p.nome + ")")) + '" target="_blank" rel="noopener">Encomendar</a>';
    return '<li class="card">' +
      '<button type="button" class="card-media" data-open="' + p.id + '" aria-label="Ver detalhes: ' + esc(p.nome) + '">' + desenho(p.desenho) +
      (p.feitoAqui ? '<span class="tag-made">Feito na tornearia</span>' : "") + "</button>" +
      '<div class="card-body">' +
      '<p class="card-code">' + esc(p.codigo) + "</p>" +
      '<h3 class="card-title"><button type="button" data-open="' + p.id + '">' + esc(p.nome) + "</button></h3>" +
      '<p class="card-meta">' + esc([p.marca, p.medidas].filter(Boolean).join(" · ")) + "</p>" +
      '<div class="card-price"><span class="price">' + brl(p.preco) + "</span>" + selo(p) + "</div>" +
      acao + "</div></li>";
  }

  // ------------------------------------------------------------ Detalhe
  function abrirProduto(id) {
    var p = porId[id];
    if (!p) return;
    var max = Math.max(1, p.estoque);
    $("#pd-body").innerHTML =
      '<button type="button" class="icon-btn modal-close" data-close aria-label="Fechar">×</button>' +
      '<div class="pd-grid"><div class="pd-media">' + desenho(p.desenho) + (p.feitoAqui ? '<span class="tag-made">Feito na tornearia</span>' : "") + "</div>" +
      '<div class="pd-info"><p class="card-code">' + esc(p.codigo) + "</p>" +
      '<h2 id="pd-title">' + esc(p.nome) + "</h2>" +
      '<p class="pd-desc">' + esc(p.descricao || "") + "</p>" +
      '<dl class="pd-specs">' +
      (p.marca ? "<div><dt>Marca</dt><dd>" + esc(p.marca) + "</dd></div>" : "") +
      (p.medidas ? "<div><dt>Medidas</dt><dd>" + esc(p.medidas) + "</dd></div>" : "") +
      "<div><dt>Categoria</dt><dd>" + esc(p.categoria) + "</dd></div></dl>" +
      '<div class="card-price"><span class="price big">' + brl(p.preco) + "</span>" + selo(p) + "</div>" +
      (p.estoque > 0
        ? '<div class="pd-buy"><div class="qty" role="group" aria-label="Quantidade"><button type="button" class="icon-btn" data-step="-1" aria-label="Diminuir">−</button><input type="number" id="pd-qty" value="1" min="1" max="' + max + '" inputmode="numeric" aria-label="Quantidade"><button type="button" class="icon-btn" data-step="1" aria-label="Aumentar">+</button></div>' +
          '<button type="button" class="btn btn-primary" data-add-qty="' + p.id + '">Adicionar ao carrinho</button></div>'
        : '<a class="btn btn-primary" href="' + esc(waLink("Olá! Quero encomendar: " + p.codigo + " (" + p.nome + ")")) + '" target="_blank" rel="noopener">Encomendar pelo WhatsApp</a>') +
      '<a class="pd-ask" href="' + esc(waLink("Olá! Tenho uma dúvida sobre o " + p.codigo + ".")) + '" target="_blank" rel="noopener">Dúvida sobre esta peça? Pergunte no WhatsApp</a>' +
      "</div></div>";
    $("#product-dialog").showModal();
  }

  // ------------------------------------------------------------ Carrinho
  function carregarCarrinho() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; }
  }
  function salvarCarrinho() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(carrinho)); } catch (e) { /* modo privado */ }
    var n = Object.keys(carrinho).reduce(function (s, id) { return s + carrinho[id]; }, 0);
    $("#cart-count").textContent = n;
    $("#cart-open").setAttribute("aria-label", "Carrinho, " + n + (n === 1 ? " item" : " itens"));
  }
  function itensCarrinho() {
    return Object.keys(carrinho).map(function (id) { return { p: porId[id], q: carrinho[id] }; }).filter(function (i) { return i.p; });
  }
  function totalCarrinho() {
    return Math.round(itensCarrinho().reduce(function (s, i) { return s + i.p.preco * i.q; }, 0) * 100) / 100;
  }
  function adicionar(id, qtd) {
    var p = porId[id];
    if (!p || p.estoque <= 0) return;
    var atual = carrinho[id] || 0, novo = Math.min(p.estoque, atual + (qtd || 1));
    carrinho[id] = novo;
    pedido = null;
    salvarCarrinho();
    renderGrade();
    var cb = $("#cart-open");
    cb.classList.remove("bump"); void cb.offsetWidth; cb.classList.add("bump");
    aviso(novo === atual ? "Limite do estoque: " + p.estoque + " unidades" : p.codigo + " no carrinho");
  }
  function mudarQtd(id, qtd) {
    var p = porId[id];
    if (!p) return;
    if (qtd <= 0) delete carrinho[id];
    else carrinho[id] = Math.min(p.estoque, qtd);
    pedido = null;
    salvarCarrinho();
    renderCarrinho();
    renderGrade();
  }

  function renderCarrinho() {
    var itens = itensCarrinho();
    $("#cart-empty").hidden = itens.length > 0;
    $("#cart-list").innerHTML = itens.map(function (i) {
      var p = i.p;
      return '<li class="cart-item"><div class="ci-art">' + desenho(p.desenho) + "</div>" +
        '<div class="ci-info"><p class="card-code">' + esc(p.codigo) + "</p><p class=\"ci-name\">" + esc(p.nome) + "</p>" +
        '<p class="ci-unit">' + brl(p.preco) + " cada</p>" +
        '<div class="ci-row"><div class="qty small" role="group" aria-label="Quantidade de ' + esc(p.codigo) + '">' +
        '<button type="button" class="icon-btn" data-qty="' + p.id + '" data-delta="-1" aria-label="Diminuir">−</button>' +
        '<span class="qty-n">' + i.q + "</span>" +
        '<button type="button" class="icon-btn" data-qty="' + p.id + '" data-delta="1" aria-label="Aumentar"' + (i.q >= p.estoque ? " disabled" : "") + ">+</button></div>" +
        '<strong class="ci-total">' + brl(p.preco * i.q) + "</strong></div>" +
        '<button type="button" class="link-btn" data-remove-item="' + p.id + '">Remover</button></div></li>';
    }).join("");
    $("#cart-total").textContent = brl(totalCarrinho());
    atualizarRodape();
  }

  // ------------------------------------------------------------ Etapas
  var ETAPAS = ["itens", "dados", "pix", "enviado"];
  function irPara(nova) {
    etapa = nova;
    $$("#cart [data-panel]").forEach(function (el) { el.hidden = el.getAttribute("data-panel") !== nova; });
    $$("#progress li").forEach(function (li) {
      var i = ETAPAS.indexOf(li.getAttribute("data-step")), atual = ETAPAS.indexOf(nova);
      li.classList.toggle("is-done", i < atual);
      li.classList.toggle("is-current", i === atual);
      if (i === atual) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    $("#progress").hidden = nova === "enviado";
    $("#cart-back").hidden = nova === "itens" || nova === "enviado";
    $("#cart-title").textContent = { itens: "Seu carrinho", dados: "Seus dados", pix: "Pagamento no Pix", enviado: "Pedido enviado" }[nova];
    if (nova === "pix") prepararPix();
    atualizarRodape();
    var foco = { dados: "#c-nome", pix: "#pix-copy", enviado: "#done-close" }[nova];
    if (foco) setTimeout(function () { var f = $(foco); if (f) f.focus(); }, 30);
  }

  function atualizarRodape() {
    var vazio = itensCarrinho().length === 0, btn = $("#cart-next");
    $("#drawer-foot").hidden = etapa === "enviado" || (etapa === "itens" && vazio);
    btn.disabled = vazio;
    btn.innerHTML = {
      itens: "Continuar",
      dados: "Ir para o pagamento",
      pix: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wa"/></svg> Já paguei · enviar pedido no WhatsApp'
    }[etapa] || "Continuar";
    $("#sum-note").textContent = etapa === "pix" ? "Valor já incluso no QR Code." : "Entrega combinada à parte no WhatsApp.";
  }

  function dadosCliente() {
    var f = $("#checkout-form");
    return {
      nome: f.nome.value.trim(), fone: f.fone.value.trim(),
      entrega: f.querySelector("input[name=entrega]:checked").value,
      endereco: f.endereco.value.trim(), obs: f.obs.value.trim()
    };
  }

  function validarDados() {
    var d = dadosCliente(), erro = "", campo = null;
    $$("#checkout-form .field").forEach(function (el) { el.classList.remove("has-error"); });
    if (d.nome.length < 3) { erro = "Informe seu nome."; campo = "#c-nome"; }
    else if (d.fone.replace(/\D/g, "").length < 10) { erro = "Informe um WhatsApp com DDD."; campo = "#c-fone"; }
    else if (d.entrega === "entrega" && d.endereco.length < 8) { erro = "Informe o endereço para entrega."; campo = "#c-end"; }
    var box = $("#c-error");
    box.textContent = erro; box.hidden = !erro;
    if (campo) { $(campo).closest(".field").classList.add("has-error"); $(campo).focus(); }
    return !erro;
  }

  function novoCodigo() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    var rnd = "";
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", buf = new Uint32Array(4);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    for (var i = 0; i < 4; i++) rnd += chars[buf[i] % chars.length];
    return "Z" + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + rnd;
  }

  function prepararPix() {
    var total = totalCarrinho();
    if (!pedido || pedido.total !== total) pedido = { codigo: novoCodigo(), total: total };
    var codigoPix = ZildoPix.payload({ chave: LOJA.pix.chave, nome: LOJA.pix.recebedor, cidade: LOJA.pix.cidade, valor: total, txid: pedido.codigo });
    pedido.pix = codigoPix;
    $("#pix-total").textContent = brl(total);
    $("#pix-order").textContent = pedido.codigo;
    $("#pix-name").textContent = LOJA.pix.recebedor;
    $("#pix-key").textContent = LOJA.pix.chave;
    $("#demo-warn").hidden = !LOJA.pix.exemplo;
    $("#pix-copy-status").textContent = "";
    $("#pix-qr").innerHTML = ZildoQR.svg(codigoPix, { ecl: "M", border: 3, label: "QR Code Pix de " + brl(total) });
  }

  function mensagemPedido() {
    var d = dadosCliente(), linhas = ["*Pedido " + pedido.codigo + "* · Loja " + LOJA.nome, ""];
    itensCarrinho().forEach(function (i) {
      linhas.push("• " + i.q + "× " + i.p.codigo + " · " + i.p.nome + " — " + brl(i.p.preco * i.q) + (i.q > 1 ? " (" + brl(i.p.preco) + " cada)" : ""));
    });
    linhas.push("", "*Total: " + brl(pedido.total) + "*", "Pagamento: Pix (identificador " + pedido.codigo + ")", "");
    linhas.push("Nome: " + d.nome, "WhatsApp: " + d.fone);
    linhas.push(d.entrega === "entrega" ? "Entrega em: " + d.endereco : "Retirada na loja");
    if (d.obs) linhas.push("Obs.: " + d.obs);
    linhas.push("", "Já fiz o Pix. Aguardo a confirmação do pagamento.");
    return linhas.join("\n");
  }

  function avancar() {
    if (etapa === "itens") { if (itensCarrinho().length) irPara("dados"); return; }
    if (etapa === "dados") { if (validarDados()) irPara("pix"); return; }
    if (etapa === "pix") {
      var url = waLink(mensagemPedido());
      abrirLink(url);
      $("#wa-again").href = url;
      $("#done-order").textContent = pedido.codigo;
      carrinho = {};
      salvarCarrinho();
      renderCarrinho();
      renderGrade();
      irPara("enviado");
    }
  }
  function voltar() {
    var i = ETAPAS.indexOf(etapa);
    if (i > 0) irPara(ETAPAS[i - 1]);
  }

  // ------------------------------------------------------------ Utilidades
  var avisoTimer;
  function aviso(texto) {
    var t = $("#toast");
    t.textContent = texto; t.hidden = false;
    t.classList.remove("is-out");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { t.classList.add("is-out"); setTimeout(function () { t.hidden = true; }, 250); }, 2200);
  }
  function copiar(texto, statusEl, ok) {
    function falha() {
      statusEl.textContent = "Não deu para copiar automaticamente. Selecione o código abaixo.";
      var pre = document.createElement("textarea");
      pre.className = "copy-fallback"; pre.readOnly = true; pre.value = texto;
      statusEl.after(pre); pre.select();
    }
    try {
      navigator.clipboard.writeText(texto).then(function () { statusEl.textContent = ok; }, falha);
    } catch (e) { falha(); }
  }

  function abrirCarrinho() {
    renderCarrinho();
    irPara(etapa === "enviado" ? "itens" : etapa);
    $("#cart").showModal();
  }

  // ------------------------------------------------------------ Eventos
  function ligarEventos() {
    var buscaTimer;
    $("#q").addEventListener("input", function (e) {
      clearTimeout(buscaTimer);
      buscaTimer = setTimeout(function () { filtro.q = e.target.value.trim(); renderGrade(); }, 120);
    });
    $("#search-form").addEventListener("submit", function (e) {
      e.preventDefault();
      filtro.q = $("#q").value.trim(); renderGrade();
      $("#catalogo").scrollIntoView({ behavior: "smooth" });
    });
    $("#sort").addEventListener("change", function (e) { filtro.ordem = e.target.value; renderGrade(); });

    $("#filters").addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "cat") filtro.cat = t.value;
      else if (t.name === "marca") filtro.marcas = $$("#f-brands input:checked").map(function (i) { return i.value; });
      else if (t.id === "f-stock") filtro.estoque = t.checked;
      else if (t.id === "f-made") filtro.feito = t.checked;
      else if (t.id === "f-min" || t.id === "f-max") {
        var v = parseFloat(t.value);
        filtro[t.id === "f-min" ? "min" : "max"] = isNaN(v) ? null : v;
      }
      renderGrade();
    });
    function limpar() {
      filtro = { q: "", cat: "", marcas: [], min: null, max: null, estoque: false, feito: false, ordem: filtro.ordem };
      $("#q").value = ""; $("#f-min").value = ""; $("#f-max").value = "";
      $("#f-stock").checked = false; $("#f-made").checked = false;
      renderGrade();
    }
    $("#filters-clear").addEventListener("click", limpar);
    $("#active-chips").addEventListener("click", function (e) {
      var b = e.target.closest("[data-remove]");
      if (!b) return;
      var k = b.getAttribute("data-remove");
      if (k === "q") { filtro.q = ""; $("#q").value = ""; }
      else if (k === "cat") filtro.cat = "";
      else if (k.indexOf("marca:") === 0) filtro.marcas = filtro.marcas.filter(function (m) { return m !== k.slice(6); });
      else if (k === "preco") { filtro.min = filtro.max = null; $("#f-min").value = ""; $("#f-max").value = ""; }
      else if (k === "estoque") { filtro.estoque = false; $("#f-stock").checked = false; }
      else if (k === "feito") { filtro.feito = false; $("#f-made").checked = false; }
      renderGrade();
    });

    function filtrosMobile(abrir) {
      document.body.classList.toggle("filters-on", abrir);
      $("#filters-open").setAttribute("aria-expanded", String(abrir));
      if (abrir) setTimeout(function () { $("#filters-close").focus(); }, 30);
      else $("#filters-open").focus();
    }
    $("#filters-open").addEventListener("click", function () { filtrosMobile(true); });
    $("#filters-close").addEventListener("click", function () { filtrosMobile(false); });
    $("#filters-apply").addEventListener("click", function () { filtrosMobile(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("filters-on")) filtrosMobile(false);
    });

    $("#grid").addEventListener("click", function (e) {
      var add = e.target.closest("[data-add]"), open = e.target.closest("[data-open]");
      if (add) adicionar(add.getAttribute("data-add"), 1);
      else if (open) abrirProduto(open.getAttribute("data-open"));
    });

    var pd = $("#product-dialog");
    pd.addEventListener("click", function (e) {
      if (e.target === pd || e.target.closest("[data-close]")) { pd.close(); return; }
      var step = e.target.closest("[data-step]");
      if (step) {
        var inp = $("#pd-qty"), max = Number(inp.max) || 1;
        inp.value = Math.min(max, Math.max(1, (Number(inp.value) || 1) + Number(step.getAttribute("data-step"))));
      }
      var addq = e.target.closest("[data-add-qty]");
      if (addq) {
        adicionar(addq.getAttribute("data-add-qty"), Math.max(1, Number($("#pd-qty").value) || 1));
        pd.close();
      }
    });

    var cart = $("#cart");
    $("#cart-open").addEventListener("click", abrirCarrinho);
    $("#cart-close").addEventListener("click", function () { cart.close(); });
    $("#cart-continue").addEventListener("click", function () { cart.close(); });
    $("#done-close").addEventListener("click", function () { cart.close(); irPara("itens"); });
    $("#cart-back").addEventListener("click", voltar);
    $("#cart-next").addEventListener("click", avancar);
    cart.addEventListener("click", function (e) {
      if (e.target === cart) { cart.close(); return; }
      var q = e.target.closest("[data-qty]");
      if (q) { var id = q.getAttribute("data-qty"); mudarQtd(id, (carrinho[id] || 0) + Number(q.getAttribute("data-delta"))); }
      var r = e.target.closest("[data-remove-item]");
      if (r) mudarQtd(r.getAttribute("data-remove-item"), 0);
    });
    $("#checkout-form").addEventListener("submit", function (e) { e.preventDefault(); avancar(); });
    $("#checkout-form").addEventListener("change", function (e) {
      if (e.target.name === "entrega") $("#addr-field").hidden = e.target.value !== "entrega";
    });
    $("#pix-copy").addEventListener("click", function () { copiar(pedido.pix, $("#pix-copy-status"), "Código copiado. Cole no app do seu banco, em Pix › Copia e cola."); });
    $("#pix-key-copy").addEventListener("click", function () { copiar(LOJA.pix.chave, $("#pix-copy-status"), "Chave Pix copiada."); });

    $$(".js-wa").forEach(function (a) { a.href = waLink(a.getAttribute("data-msg") || "Olá! Vim pela loja."); });
  }

  // ------------------------------------------------------------ Início
  function iniciar() {
    $("#year").textContent = String(new Date().getFullYear());
    $("#foot-cnpj").textContent = LOJA.cnpj;
    ligarEventos();
    var planilha = carregarProdutos();   // já prepara a cópia local na hora
    salvarCarrinho();
    renderGrade();
    planilha.then(function () { renderGrade(); salvarCarrinho(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
