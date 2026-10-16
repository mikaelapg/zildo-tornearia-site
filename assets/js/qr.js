/**
 * Gerador de QR Code próprio (sem biblioteca externa).
 *
 * Mantido dentro do site de propósito: o QR do Pix nunca depende de um
 * script de terceiros que poderia ser trocado por outro (ataque de cadeia
 * de fornecimento). Baseado no algoritmo de referência de Project Nayuki
 * (qrcodegen, licença MIT), reduzido ao modo byte.
 *
 * Uso: ZildoQR.svg(texto, { ecl: "M", border: 4 }) -> string <svg>
 */
(function (global) {
  "use strict";

  var ECL = { L: { ord: 0, bits: 1 }, M: { ord: 1, bits: 0 }, Q: { ord: 2, bits: 3 }, H: { ord: 3, bits: 2 } };

  var ECC_CODEWORDS_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  var NUM_ERROR_CORRECTION_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];

  function utf8(str) {
    return Array.prototype.slice.call(new TextEncoder().encode(str));
  }
  function getBit(x, i) { return ((x >>> i) & 1) !== 0; }

  function numRawDataModules(ver) {
    var result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }
  function numDataCodewords(ver, ecl) {
    return Math.floor(numRawDataModules(ver) / 8) -
      ECC_CODEWORDS_PER_BLOCK[ecl.ord][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl.ord][ver];
  }

  // ---- Reed-Solomon sobre GF(2^8), polinômio 0x11D ----
  function rsMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function rsDivisor(degree) {
    var result = [];
    for (var i = 0; i < degree - 1; i++) result.push(0);
    result.push(1);
    var root = 1;
    for (i = 0; i < degree; i++) {
      for (var j = 0; j < result.length; j++) {
        result[j] = rsMul(result[j], root);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      root = rsMul(root, 0x02);
    }
    return result;
  }
  function rsRemainder(data, divisor) {
    var result = divisor.map(function () { return 0; });
    data.forEach(function (b) {
      var factor = b ^ result.shift();
      result.push(0);
      divisor.forEach(function (coef, i) { result[i] ^= rsMul(coef, factor); });
    });
    return result;
  }

  function QrCode(ver, ecl, dataCodewords) {
    this.version = ver;
    this.size = ver * 4 + 17;
    this.ecl = ecl;
    this.modules = [];
    this.isFunction = [];
    for (var i = 0; i < this.size; i++) {
      this.modules.push(new Array(this.size).fill(false));
      this.isFunction.push(new Array(this.size).fill(false));
    }
    this.drawFunctionPatterns();
    this.drawCodewords(this.addEccAndInterleave(dataCodewords));

    var best = 0, minPenalty = Infinity;
    for (var m = 0; m < 8; m++) {
      this.applyMask(m);
      this.drawFormatBits(m);
      var p = this.penalty();
      if (p < minPenalty) { best = m; minPenalty = p; }
      this.applyMask(m);
    }
    this.applyMask(best);
    this.drawFormatBits(best);
  }

  QrCode.prototype.setFn = function (x, y, dark) {
    this.modules[y][x] = dark;
    this.isFunction[y][x] = true;
  };

  QrCode.prototype.drawFunctionPatterns = function () {
    var size = this.size, i, j;
    for (i = 0; i < size; i++) {
      this.setFn(6, i, i % 2 === 0);
      this.setFn(i, 6, i % 2 === 0);
    }
    this.drawFinder(3, 3);
    this.drawFinder(size - 4, 3);
    this.drawFinder(3, size - 4);
    var pos = this.alignmentPositions(), n = pos.length;
    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        if (!(i === 0 && j === 0 || i === 0 && j === n - 1 || i === n - 1 && j === 0)) this.drawAlignment(pos[i], pos[j]);
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  };

  QrCode.prototype.drawFormatBits = function (mask) {
    var data = this.ecl.bits << 3 | mask, rem = data, i;
    for (i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = (data << 10 | rem) ^ 0x5412, size = this.size;
    for (i = 0; i <= 5; i++) this.setFn(8, i, getBit(bits, i));
    this.setFn(8, 7, getBit(bits, 6));
    this.setFn(8, 8, getBit(bits, 7));
    this.setFn(7, 8, getBit(bits, 8));
    for (i = 9; i < 15; i++) this.setFn(14 - i, 8, getBit(bits, i));
    for (i = 0; i < 8; i++) this.setFn(size - 1 - i, 8, getBit(bits, i));
    for (i = 8; i < 15; i++) this.setFn(8, size - 15 + i, getBit(bits, i));
    this.setFn(8, size - 8, true);
  };

  QrCode.prototype.drawVersion = function () {
    if (this.version < 7) return;
    var rem = this.version, i;
    for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    var bits = this.version << 12 | rem;
    for (i = 0; i < 18; i++) {
      var bit = getBit(bits, i), a = this.size - 11 + i % 3, b = Math.floor(i / 3);
      this.setFn(a, b, bit);
      this.setFn(b, a, bit);
    }
  };

  QrCode.prototype.drawFinder = function (x, y) {
    for (var dy = -4; dy <= 4; dy++) {
      for (var dx = -4; dx <= 4; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) this.setFn(xx, yy, dist !== 2 && dist !== 4);
      }
    }
  };

  QrCode.prototype.drawAlignment = function (x, y) {
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) this.setFn(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  };

  QrCode.prototype.alignmentPositions = function () {
    if (this.version === 1) return [];
    var numAlign = Math.floor(this.version / 7) + 2;
    var step = Math.floor((this.version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
    var result = [6];
    for (var pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  };

  QrCode.prototype.addEccAndInterleave = function (data) {
    var ver = this.version, ecl = this.ecl;
    var numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl.ord][ver];
    var blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl.ord][ver];
    var rawCodewords = Math.floor(numRawDataModules(ver) / 8);
    var numShortBlocks = numBlocks - rawCodewords % numBlocks;
    var shortBlockLen = Math.floor(rawCodewords / numBlocks);
    var blocks = [], divisor = rsDivisor(blockEccLen), i, k;
    for (i = 0, k = 0; i < numBlocks; i++) {
      var dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, divisor);
      if (i < numShortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var result = [];
    for (i = 0; i < blocks[0].length; i++) {
      blocks.forEach(function (block, j) {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
      });
    }
    return result;
  };

  QrCode.prototype.drawCodewords = function (data) {
    var size = this.size, i = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  };

  QrCode.prototype.applyMask = function (mask) {
    for (var y = 0; y < this.size; y++) {
      for (var x = 0; x < this.size; x++) {
        var inv;
        switch (mask) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = x * y % 2 + x * y % 3 === 0; break;
          case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
        if (!this.isFunction[y][x] && inv) this.modules[y][x] = !this.modules[y][x];
      }
    }
  };

  // Penalidade simplificada (sequências, blocos 2x2 e equilíbrio claro/escuro).
  // Qualquer máscara gera um QR válido; isto só escolhe a mais legível.
  QrCode.prototype.penalty = function () {
    var size = this.size, m = this.modules, result = 0, x, y, run, dark = 0;
    for (y = 0; y < size; y++) {
      run = 1;
      for (x = 1; x < size; x++) {
        if (m[y][x] === m[y][x - 1]) { run++; if (run === 5) result += 3; else if (run > 5) result++; }
        else run = 1;
      }
    }
    for (x = 0; x < size; x++) {
      run = 1;
      for (y = 1; y < size; y++) {
        if (m[y][x] === m[y - 1][x]) { run++; if (run === 5) result += 3; else if (run > 5) result++; }
        else run = 1;
      }
    }
    for (y = 0; y < size - 1; y++) {
      for (x = 0; x < size - 1; x++) {
        var c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) result += 3;
      }
    }
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
    var total = size * size;
    var kk = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    return result + Math.max(0, kk) * 10;
  };

  function encode(text, eclName) {
    var ecl = ECL[eclName || "M"], data = utf8(text), ver, cap, ccBits;
    for (ver = 1; ; ver++) {
      cap = numDataCodewords(ver, ecl) * 8;
      ccBits = ver < 10 ? 8 : 16;
      if (4 + ccBits + data.length * 8 <= cap) break;
      if (ver >= 40) throw new Error("Texto grande demais para um QR Code");
    }
    var bits = [];
    function append(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    append(0x4, 4);
    append(data.length, ccBits);
    data.forEach(function (b) { append(b, 8); });
    append(0, Math.min(4, cap - bits.length));
    append(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) append(pad, 8);
    var codewords = [];
    for (var i = 0; i < bits.length; i += 8) {
      var byte = 0;
      for (var j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      codewords.push(byte);
    }
    return new QrCode(ver, ecl, codewords);
  }

  function svg(text, opts) {
    opts = opts || {};
    var qr = encode(text, opts.ecl || "M"), border = opts.border == null ? 4 : opts.border;
    var n = qr.size + border * 2, d = [];
    for (var y = 0; y < qr.size; y++) {
      for (var x = 0; x < qr.size; x++) {
        if (qr.modules[y][x]) d.push("M" + (x + border) + "," + (y + border) + "h1v1h-1z");
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + " " + n +
      '" shape-rendering="crispEdges" role="img" aria-label="' + (opts.label || "QR Code") + '">' +
      '<rect width="100%" height="100%" fill="#FFFFFF"/><path d="' + d.join("") + '" fill="#000000"/></svg>';
  }

  global.ZildoQR = { encode: encode, svg: svg };
})(window);
