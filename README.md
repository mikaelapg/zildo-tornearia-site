# Zildo Tornearia — site institucional

Site de uma página para a Zildo Tornearia: serviços, materiais, como funciona e pedido de orçamento direto no WhatsApp.

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

## Como editar os dados da empresa

Tudo está no `index.html`. Use "Localizar e substituir" no editor:

| O que mudar | Onde |
|---|---|
| Número do WhatsApp | atributo `data-whatsapp` na tag `<body>` (só números: 55 + DDD + número) |
| Telefone exibido | seção `#orcamento`, item "WhatsApp" |
| Endereço e horário | seção `#orcamento` |
| E-mail | seção `#orcamento` |
| CNPJ | rodapé |
| Dados para o Google | bloco `application/ld+json` no `<head>` |

O link "Abrir no mapa" é gerado automaticamente a partir do endereço exibido.

## Checklist antes de publicar

Os campos abaixo estão com **dados de exemplo** e precisam ser confirmados com a cliente:

- [ ] Número do WhatsApp e telefone
- [ ] Endereço completo e cidade (também no JSON-LD)
- [ ] Horário de atendimento
- [ ] CNPJ
- [ ] Ano de fundação ("Na estrada desde")
- [ ] Capacidades técnicas: tolerância e diâmetro máximo
- [ ] Lista de serviços e materiais
- [ ] Fotos reais da oficina e de peças (opcional, mas aumenta a confiança)
- [ ] Imagem de compartilhamento (`og:image`, 1200×630) para quando o link for enviado no WhatsApp

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
