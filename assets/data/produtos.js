/**
 * Catálogo da loja (cópia local).
 *
 * É usado quando a planilha do Google não está configurada ou não responde,
 * então a loja nunca fica sem produtos. PREÇOS E ESTOQUES DE EXEMPLO:
 * substituir pela lista real da loja antes de publicar.
 *
 * Campos: id, codigo, nome, categoria, marca, preco, estoque, medidas,
 *         desenho (rolamento | retentor | bucha | pino | correia), feitoAqui, descricao
 */
window.ZILDO_PRODUTOS = [
  { id: "r6200", codigo: "6200-2RS", nome: "Rolamento rígido de esferas 6200-2RS", categoria: "Rolamentos", marca: "SKF", preco: 14.9, estoque: 32, medidas: "10 × 30 × 9 mm", desenho: "rolamento", descricao: "Vedado dos dois lados, já vem lubrificado. Usado em motores elétricos, bombas e máquinas leves." },
  { id: "r6201", codigo: "6201-2RS", nome: "Rolamento rígido de esferas 6201-2RS", categoria: "Rolamentos", marca: "NSK", preco: 15.9, estoque: 28, medidas: "12 × 32 × 10 mm", desenho: "rolamento", descricao: "Vedado dos dois lados. Comum em motores elétricos, roçadeiras e máquinas de marcenaria." },
  { id: "r6202", codigo: "6202-2RS", nome: "Rolamento rígido de esferas 6202-2RS", categoria: "Rolamentos", marca: "SKF", preco: 16.9, estoque: 40, medidas: "15 × 35 × 11 mm", desenho: "rolamento", descricao: "Vedado dos dois lados. Aplicação geral em motores, polias e eixos leves." },
  { id: "r6203", codigo: "6203-2RS", nome: "Rolamento rígido de esferas 6203-2RS", categoria: "Rolamentos", marca: "FAG", preco: 18.9, estoque: 36, medidas: "17 × 40 × 12 mm", desenho: "rolamento", descricao: "Vedado dos dois lados. Muito usado em motores de bomba d'água e eletrodomésticos." },
  { id: "r6204", codigo: "6204-2RS", nome: "Rolamento rígido de esferas 6204-2RS", categoria: "Rolamentos", marca: "NSK", preco: 22.9, estoque: 24, medidas: "20 × 47 × 14 mm", desenho: "rolamento", descricao: "Vedado dos dois lados. Aplicação em motores elétricos, mancais e máquinas agrícolas." },
  { id: "r6205", codigo: "6205-2RS", nome: "Rolamento rígido de esferas 6205-2RS", categoria: "Rolamentos", marca: "SKF", preco: 26.9, estoque: 30, medidas: "25 × 52 × 15 mm", desenho: "rolamento", descricao: "Vedado dos dois lados. Um dos mais usados em mancais, motores e redutores." },
  { id: "r6206", codigo: "6206-2RS", nome: "Rolamento rígido de esferas 6206-2RS", categoria: "Rolamentos", marca: "FAG", preco: 34.9, estoque: 14, medidas: "30 × 62 × 16 mm", desenho: "rolamento", descricao: "Vedado dos dois lados. Para cargas médias em mancais e equipamentos industriais." },
  { id: "r6305", codigo: "6305-2RS", nome: "Rolamento rígido de esferas 6305-2RS", categoria: "Rolamentos", marca: "NTN", preco: 39.9, estoque: 9, medidas: "25 × 62 × 17 mm", desenho: "rolamento", descricao: "Série reforçada, para cargas maiores no mesmo diâmetro de eixo." },
  { id: "r6004", codigo: "6004-ZZ", nome: "Rolamento rígido de esferas 6004-ZZ", categoria: "Rolamentos", marca: "NTN", preco: 21.9, estoque: 18, medidas: "20 × 42 × 12 mm", desenho: "rolamento", descricao: "Blindado com placas metálicas dos dois lados. Indicado para rotações mais altas." },
  { id: "r608", codigo: "608-ZZ", nome: "Rolamento miniatura 608-ZZ", categoria: "Rolamentos", marca: "NSK", preco: 9.9, estoque: 60, medidas: "8 × 22 × 7 mm", desenho: "rolamento", descricao: "Blindado. Usado em ferramentas elétricas, rodízios e pequenas máquinas." },
  { id: "r30205", codigo: "30205", nome: "Rolamento de rolos cônicos 30205", categoria: "Rolamentos", marca: "SKF", preco: 54.9, estoque: 6, medidas: "25 × 52 × 16,25 mm", desenho: "rolamento", descricao: "Aguenta carga radial e axial ao mesmo tempo. Comum em cubos de roda e redutores." },
  { id: "r6207", codigo: "6207-2RS", nome: "Rolamento rígido de esferas 6207-2RS", categoria: "Rolamentos", marca: "SKF", preco: 44.9, estoque: 0, medidas: "35 × 72 × 17 mm", desenho: "rolamento", descricao: "Vedado dos dois lados. Para mancais e equipamentos industriais de porte médio." },

  { id: "t355207", codigo: "RET 35×52×7", nome: "Retentor 35 × 52 × 7", categoria: "Retentores", marca: "Sabó", preco: 14.9, estoque: 22, medidas: "35 × 52 × 7 mm", desenho: "retentor", descricao: "Borracha nitrílica com mola. Veda óleo e graxa em eixos e cubos." },
  { id: "t406208", codigo: "RET 40×62×8", nome: "Retentor 40 × 62 × 8", categoria: "Retentores", marca: "Sabó", preco: 17.9, estoque: 15, medidas: "40 × 62 × 8 mm", desenho: "retentor", descricao: "Borracha nitrílica com mola. Para redutores, bombas e cubos de roda." },
  { id: "t254007", codigo: "RET 25×40×7", nome: "Retentor 25 × 40 × 7", categoria: "Retentores", marca: "Corteco", preco: 12.9, estoque: 26, medidas: "25 × 40 × 7 mm", desenho: "retentor", descricao: "Lábio duplo, protege contra poeira e vazamento." },
  { id: "t456208", codigo: "RET 45×62×8", nome: "Retentor 45 × 62 × 8", categoria: "Retentores", marca: "Corteco", preco: 19.9, estoque: 11, medidas: "45 × 62 × 8 mm", desenho: "retentor", descricao: "Lábio duplo com mola. Aplicação em máquinas agrícolas e industriais." },

  { id: "b202530", codigo: "BUCHA BR 20×25×30", nome: "Bucha de bronze 20 × 25 × 30", categoria: "Buchas", marca: "Zildo", preco: 39.9, estoque: 12, medidas: "20 × 25 × 30 mm", desenho: "bucha", feitoAqui: true, descricao: "Bronze TM-23 torneado na nossa oficina. Elimina folga em eixos e articulações." },
  { id: "b303540", codigo: "BUCHA BR 30×35×40", nome: "Bucha de bronze 30 × 35 × 40", categoria: "Buchas", marca: "Zildo", preco: 64.9, estoque: 8, medidas: "30 × 35 × 40 mm", desenho: "bucha", feitoAqui: true, descricao: "Bronze TM-23 torneado na nossa oficina. Para mancais de deslizamento e prensas." },
  { id: "b253025", codigo: "BUCHA NY 25×30×25", nome: "Bucha de nylon 25 × 30 × 25", categoria: "Buchas", marca: "Zildo", preco: 24.9, estoque: 20, medidas: "25 × 30 × 25 mm", desenho: "bucha", feitoAqui: true, descricao: "Nylon técnico, não precisa de lubrificação. Ideal para roletes e guias." },

  { id: "p-gol", codigo: "KIT PINO VW G2-G4", nome: "Kit pino e bucha de porta · VW Gol G2 a G4", categoria: "Pinos de porta", marca: "Zildo", preco: 79.9, estoque: 10, medidas: "Par (1 porta)", desenho: "pino", feitoAqui: true, descricao: "Pinos em aço e buchas em bronze, feitos na tornearia. Acaba com a porta caída e o barulho." },
  { id: "p-uno", codigo: "KIT PINO FIAT UNO", nome: "Kit pino e bucha de porta · Fiat Uno", categoria: "Pinos de porta", marca: "Zildo", preco: 74.9, estoque: 7, medidas: "Par (1 porta)", desenho: "pino", feitoAqui: true, descricao: "Pinos em aço e buchas em bronze, feitos na tornearia. Inclui as duas dobradiças da porta." },
  { id: "p-celta", codigo: "KIT PINO GM CELTA", nome: "Kit pino e bucha de porta · GM Celta e Corsa", categoria: "Pinos de porta", marca: "Zildo", preco: 84.9, estoque: 0, medidas: "Par (1 porta)", desenho: "pino", feitoAqui: true, descricao: "Pinos em aço e buchas em bronze, feitos na tornearia. Sob encomenda quando sem estoque." },

  { id: "c-a38", codigo: "CORREIA A-38", nome: "Correia em V A-38", categoria: "Correias", marca: "Gates", preco: 29.9, estoque: 16, medidas: "Perfil A · 38 pol", desenho: "correia", descricao: "Para motores, compressores e máquinas de marcenaria." },
  { id: "c-a42", codigo: "CORREIA A-42", nome: "Correia em V A-42", categoria: "Correias", marca: "Gates", preco: 32.9, estoque: 12, medidas: "Perfil A · 42 pol", desenho: "correia", descricao: "Para motores, compressores e máquinas de marcenaria." },
  { id: "c-b50", codigo: "CORREIA B-50", nome: "Correia em V B-50", categoria: "Correias", marca: "Gates", preco: 44.9, estoque: 9, medidas: "Perfil B · 50 pol", desenho: "correia", descricao: "Perfil mais largo, para transmissões com mais potência." }
];
