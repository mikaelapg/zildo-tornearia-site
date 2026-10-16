# Zildo Tornearia — site institucional

Site de uma página da Zildo Tornearia, oficina de família em Alvorada/RS desde 1994: serviços, trabalhos, história, dúvidas e pedido de orçamento direto no WhatsApp.

É um site **estático**: só HTML, CSS e JavaScript, sem framework, sem banco de dados e sem etapa de build. Pode ser hospedado em qualquer lugar e não precisa de manutenção técnica.

## Estrutura

```
.
├── index.html            # site institucional
├── loja.html             # loja virtual: catálogo, carrinho, Pix e pedido no WhatsApp
├── 404.html              # página de erro
├── assets/
│   ├── css/styles.css    # visual (cores no topo, em :root)
│   ├── js/main.js        # horário, WhatsApp, formulário por e-mail, galeria, animações
│   ├── js/lathe.js       # torno animado da abertura (canvas)
│   ├── js/loja.js        # loja: filtros, carrinho, etapas da compra (configuração no topo)
│   ├── js/pix.js         # monta o Pix "copia e cola" com valor (padrão BR Code)
│   ├── js/qr.js          # gerador de QR Code próprio, sem biblioteca externa
│   ├── data/produtos.js  # cópia local do catálogo (usada se a planilha falhar)
│   └── img/
│       ├── logo.svg          # logo vetorizado (recriado a partir do original)
│       ├── logo-original.png # logo enviado pela cliente
│       ├── favicon.svg       # ícone da aba
│       └── trabalhos/        # fotos da galeria
├── robots.txt            # instruções para o Google
├── sitemap.xml           # mapa do site para o Google
└── .github/workflows/    # verificação automática do HTML a cada push
```

## Como editar

| O que mudar | Onde |
|---|---|
| Textos, serviços, dúvidas, endereço, telefones | `index.html` |
| Número do WhatsApp | atributo `data-whatsapp` na tag `<body>` (só números: 55 + DDD + número) |
| Horário de funcionamento (aviso "Aberto agora" e atendimento) | objeto `HORARIO` no topo de `assets/js/main.js` |
| E-mail que recebe os pedidos | atributo `data-email` na tag `<body>` |
| Horário exibido na seção de contato | `index.html`, seção `#contato` |
| Dados para o Google | blocos `application/ld+json` no `<head>` |
| Cores (laranja e grafite do logo) | variáveis no topo de `assets/css/styles.css` |

### Fotos dos trabalhos

Coloque as fotos em `assets/img/trabalhos/` com estes nomes (JPG, de preferência 1200px no lado maior):

`engrenagem.jpg`, `pino-de-porta.jpg`, `embuchamento.jpg`, `rebobinagem.jpg`, `retifica-freio.jpg`, `desengrossadeira.jpg`

Enquanto a foto não existir, o site mostra uma ilustração animada do serviço. Quando a foto existe, ela abre ampliada ao clicar.

## Loja virtual (`loja.html`)

Catálogo com busca por código, filtros, carrinho e pagamento por **Pix com o valor exato**. O pedido sai pronto no WhatsApp da loja. Não tem servidor, banco de dados, mensalidade nem taxa por venda: o Pix cai direto na conta da empresa.

### Antes de publicar

No topo de `assets/js/loja.js`, objeto `LOJA`:

| Campo | O que colocar |
|---|---|
| `whatsapp` | WhatsApp que recebe os pedidos (55 + DDD + número) |
| `cnpj` | CNPJ que aparece no rodapé |
| `pix.chave` | Chave Pix da empresa, de preferência o CNPJ |
| `pix.recebedor` / `pix.cidade` | Nome e cidade como aparecem no banco |
| `pix.exemplo` | Trocar para `false` (tira o aviso de demonstração) |
| `planilhaCsv` | Link CSV da planilha de produtos (opcional, ver abaixo) |

### Produtos pela planilha do Google

1. Crie uma planilha com as colunas: `codigo, nome, categoria, marca, preco, estoque, medidas, desenho, feito_aqui, descricao`.
2. Arquivo › Compartilhar › Publicar na Web › escolha a aba e o formato **CSV** › Publicar.
3. Cole o link em `planilhaCsv`. A partir daí, preço e estoque mudam na planilha e o site atualiza sozinho.
4. Só a conta da empresa pode editar a planilha, com verificação em duas etapas.

Se a planilha não responder, a loja usa a cópia de `assets/data/produtos.js`. `desenho` aceita `rolamento`, `retentor`, `bucha`, `pino` ou `correia`. `feito_aqui` = `sim` mostra o selo "Feito na tornearia".

### Segurança (regras para a loja)

- **Só separar o pedido depois que o Pix aparecer no app do banco.** Comprovante por imagem não confirma pagamento.
- **Conferir itens × valor recebido.** O pedido chega com o código (ex.: `Z261016K2H5`), que também vai no Pix como identificador.
- **Contas com 2FA**: hospedagem, GitHub e Google. Quem invade uma delas poderia trocar a chave Pix.
- O QR Code é gerado dentro do próprio site (`qr.js`), sem depender de script de terceiros. A página tem política de segurança (CSP) que bloqueia scripts de fora.
- O site não guarda dados de clientes. Nome, telefone e endereço vão só na mensagem do WhatsApp.

## Formulário por e-mail

O formulário de orçamento envia para o e-mail da oficina pela [FormSubmit](https://formsubmit.co), sem servidor próprio e sem custo.

1. Publique o site e envie um pedido de teste.
2. A FormSubmit manda um e-mail de **ativação** para `zildotornearia@gmail.com`. Clique em "Activate Form".
3. A partir daí, todo pedido chega no e-mail, já formatado em tabela, com o nome, o telefone, o serviço e a mensagem.
4. Opcional: depois de ativar, a FormSubmit fornece um código aleatório. Troque o e-mail pelo código em `FORM_ENDPOINT` (`main.js`) para não deixar o e-mail exposto no código.

Se o envio falhar, o site mostra um aviso e oferece o botão do WhatsApp com a mensagem já preenchida.

## WhatsApp

- Todos os botões abrem o WhatsApp da oficina com uma mensagem pronta para cada situação (serviço escolhido, empresa ou particular, etc.).
- O botão flutuante abre um painel de atendimento com respostas rápidas. O aviso "Online agora" segue o horário de funcionamento.
- Recomendado para a oficina: usar o **WhatsApp Business** no número (51) 99313-5373, com mensagem de ausência fora do horário e respostas rápidas.

## Checklist antes de publicar

- [ ] Fotos reais dos trabalhos (as do site antigo estão no backup da Umbler; também dá para usar as do Instagram)
- [ ] Ativar o formulário na FormSubmit (ver acima)
- [ ] Arquivo original do logo em alta resolução (o `logo.svg` é uma recriação; conferir com a cliente)
- [ ] Horário de funcionamento real (hoje: seg a sex, 8h às 18h)
- [ ] CEP correto (o site antigo mostrava "94820-4902", com um dígito a mais)
- [ ] Imagem de compartilhamento (`og:image`, 1200×630)

## Rodar localmente

Abra o `index.html` direto no navegador, ou, com Node instalado:

```bash
npm run dev     # servidor local
npm run check   # valida o HTML
```

## Publicar

Qualquer uma destas opções funciona. As três primeiras são gratuitas.

1. **Cloudflare Pages / Netlify / Vercel**: conectar este repositório e publicar. Não há comando de build; a pasta de saída é a raiz (`/`).
2. **GitHub Pages**: Settings → Pages → Branch `main`, pasta `/ (root)`.
3. **Hospedagem tradicional (ex.: Umbler)**: enviar os arquivos para a pasta pública do site via gerenciador de arquivos ou FTP.

Depois, apontar o domínio `zildotornearia.com.br` para a hospedagem escolhida (DNS no registro do domínio).

## Entrega à cliente

Ao final, tudo deve ficar no nome da cliente:

- [ ] Domínio registrado no nome/CPF ou CNPJ dela
- [ ] Conta de hospedagem criada com o e-mail dela
- [ ] Repositório transferido para a conta GitHub dela (Settings → Transfer ownership), ou arquivos entregues em .zip
- [ ] Senhas entregues e trocadas por ela

O código passa a ser da cliente, que pode alterá-lo e hospedá-lo onde quiser.
