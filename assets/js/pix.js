/**
 * Pix estático com valor ("copia e cola" no padrão BR Code do Banco Central).
 *
 * Não usa gateway, API nem cadastro: o texto é montado aqui mesmo, no
 * navegador do cliente, e qualquer app de banco lê e paga. O dinheiro vai
 * direto para a chave Pix da loja. Não há confirmação automática: a loja
 * confere o recebimento no app do banco antes de separar o pedido.
 *
 * Uso: ZildoPix.payload({ chave, nome, cidade, valor, txid }) -> string
 */
(function (global) {
  "use strict";

  function campo(id, valor) {
    var v = String(valor);
    if (v.length > 99) throw new Error("Campo Pix " + id + " grande demais");
    return id + (v.length < 10 ? "0" : "") + v.length + v;
  }

  // Remove acentos e caracteres fora do padrão do BR Code.
  function limpar(texto, max) {
    return String(texto || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9 .\-]/g, "")
      .toUpperCase().trim().slice(0, max);
  }

  // CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63.
  function crc16(texto) {
    var bytes = new TextEncoder().encode(texto), crc = 0xFFFF;
    for (var i = 0; i < bytes.length; i++) {
      crc ^= bytes[i] << 8;
      for (var b = 0; b < 8; b++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return ("0000" + crc.toString(16).toUpperCase()).slice(-4);
  }

  // Chave CNPJ/CPF/telefone vão só com dígitos (telefone com +55); e-mail e aleatória como estão.
  function normalizarChave(chave) {
    var c = String(chave || "").trim();
    if (/@/.test(c) || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(c)) return c;
    if (/^\+/.test(c)) return "+" + c.replace(/\D/g, "");
    return c.replace(/\D/g, "");
  }

  function payload(o) {
    var chave = normalizarChave(o.chave);
    if (!chave) throw new Error("Chave Pix não configurada");
    var txid = String(o.txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
    var s = campo("00", "01") +
      campo("26", campo("00", "br.gov.bcb.pix") + campo("01", chave)) +
      campo("52", "0000") +
      campo("53", "986") +
      (o.valor > 0 ? campo("54", Number(o.valor).toFixed(2)) : "") +
      campo("58", "BR") +
      campo("59", limpar(o.nome, 25) || "LOJA") +
      campo("60", limpar(o.cidade, 15) || "BRASIL") +
      campo("62", campo("05", txid)) +
      "6304";
    return s + crc16(s);
  }

  global.ZildoPix = { payload: payload, crc16: crc16 };
})(window);
