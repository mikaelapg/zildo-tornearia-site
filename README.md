# Zildo Tornearia — site institucional

Site de uma página da Zildo Tornearia, oficina de família em Alvorada/RS desde 1994: serviços, trabalhos, história, dúvidas e pedido de orçamento direto no WhatsApp.

É um site **estático**: só HTML, CSS e JavaScript, sem framework, sem banco de dados e sem etapa de build. Pode ser hospedado em qualquer lugar e não precisa de manutenção técnica.

## Estrutura

```
.
├── index.html            # página principal (todo o conteúdo fica aqui)
├── 404.html              # página de erro
├── assets/
│   ├── css/styles.css    # visual (cores no topo, em :root)
│   ├── js/main.js        # links do WhatsApp, mapa e formulário de orçamento
│   └── img/favicon.svg   # ícone da aba
├── robots.txt            # instruções para o Google
├── sitemap.xml           # mapa do site para o Google
└── .github/workflows/    # verificação automática do HTML a cada push
```

## Como editar

| O que mudar | Onde |
|---|---|
| Textos, serviços, dúvidas, endereço, telefones | `index.html` |
| Número do WhatsApp | atributo `data-whatsapp` na tag `<body>` (só números: 55 + DDD + número) |
| Horário de funcionamento (aviso "Aberto agora") | objeto `HORARIO` no topo de `assets/js/main.js` |
| Horário exibido na seção de contato | `index.html`, seção `#contato` |
| Dados para o Google | blocos `application/ld+json` no `<head>` |
| Cores | variáveis no topo de `assets/css/styles.css` |

### Fotos dos trabalhos

Coloque as fotos em `assets/img/trabalhos/` com estes nomes (JPG, de preferência 1200px no lado maior):

`engrenagem.jpg`, `pino-de-porta.jpg`, `embuchamento.jpg`, `rebobinagem.jpg`, `retifica-freio.jpg`, `desengrossadeira.jpg`

Enquanto a foto não existir, o site mostra um painel verde com o nome do serviço.

## Checklist antes de publicar

- [ ] Fotos reais dos trabalhos (as do site antigo estão no backup da Umbler)
- [ ] Logo oficial, se existir
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
