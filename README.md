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
│   ├── js/main.js        # horário, WhatsApp, formulário por e-mail, galeria, animações
│   ├── js/lathe.js       # torno animado da abertura (canvas)
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
| Horário de funcionamento (aviso "Aberto agora" e atendimento) | objeto `HORARIO` no topo de `assets/js/main.js` |
| E-mail que recebe os pedidos | atributo `data-email` na tag `<body>` |
| Horário exibido na seção de contato | `index.html`, seção `#contato` |
| Dados para o Google | blocos `application/ld+json` no `<head>` |
| Cores | variáveis no topo de `assets/css/styles.css` |

### Fotos dos trabalhos

Coloque as fotos em `assets/img/trabalhos/` com estes nomes (JPG, de preferência 1200px no lado maior):

`engrenagem.jpg`, `pino-de-porta.jpg`, `embuchamento.jpg`, `rebobinagem.jpg`, `retifica-freio.jpg`, `desengrossadeira.jpg`

Enquanto a foto não existir, o site mostra uma ilustração animada do serviço. Quando a foto existe, ela abre ampliada ao clicar.

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
