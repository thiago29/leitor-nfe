# 💀 Leitor NF-e

Site **100% estático** (HTML + CSS + JavaScript puro, sem backend, sem banco, sem framework e sem build) para policiais fiscalizarem NF-e pelo celular — com foco em iPhone/Safari.

Lê com a câmera traseira o código de barras **CODE-128** do DANFE (chave de acesso de 44 dígitos), valida o dígito verificador (módulo 11) e abre uma **tela de consulta nativa** no próprio app: chave formatada, resumo decodificado da nota, botão **“Abrir a consulta oficial”** (portal da SEFAZ — onde o policial só resolve o captcha e toca em “Continuar”), nova leitura e copiar chave. A última consulta fica guardada no aparelho e é restaurada ao reabrir o app.

## O que ele faz

- 📷 Botão grande **“Ler código de barras”** que abre a câmera traseira em alta resolução (ideal 1920×1080). A câmera só abre por toque do usuário (exigência do iOS).
- Usa `BarcodeDetector` nativo quando disponível (Android/Chrome); nos demais casos usa **ZXing** (`@zxing/library@0.21.3`) servido do próprio diretório (`vendor/zxing.min.js`), configurado só para CODE_128 com `TRY_HARDER` — sem depender de CDN externa no momento da leitura em campo.
- Moldura horizontal larga + dica de posicionamento; seletor de câmera (grande-angular/ultra-angular) e botão de lanterna quando suportado.
- **Validação na hora**: exatamente 44 dígitos + DV módulo 11. Se inválida: vibração, aviso e continua lendo.
- Se válida: a **tela de consulta** exibe a chave em grupos de 4 e o resumo decodificado (UF, emissão MM/AAAA, CNPJ/CPF do emitente, modelo 55/65, série, número sem zeros à esquerda, tipo de emissão, código numérico, DV) — tudo gerado localmente, sem rede.
- Botões da tela de consulta: **🧾 Abrir a consulta oficial**, **Nova leitura**, **Copiar chave**, **Voltar**. Existe também um embed experimental (“Carregar a consulta aqui dentro”) — ver abaixo por que não é o padrão.
- **Última consulta persistida** (`localStorage`, sempre revalidando o DV): fechar o app ou sair para o portal da SEFAZ não perde nada — reabrir restaura a tela de consulta.
- Digitação manual (aceita espaços/pontos, que são removidos) com a mesma validação.
- Histórico das últimas **20** chaves no `localStorage` (com data/hora, “Reabrir consulta” e copiar), sempre protegido por try/catch.
- Tema claro/escuro pelo `prefers-color-scheme`, botões ≥ 48 px, sem rolagem horizontal.
- PWA leve: `manifest.json`, ícones e meta tags para “Adicionar à Tela de Início” no iPhone.

Não envia a chave para nenhum servidor além do portal oficial, e não tenta resolver o captcha.

### Por que o app abre o portal em outra aba e não embute a SEFAZ?

Teste documentado (Docker + Playwright, evidências em `screenshots/`): o portal (`consultaRecaptcha.aspx`) autentica com cookie de sessão `SameSite=Lax`. Dentro de `<iframe>` cross-site o navegador não envia esse cookie → o servidor entra em loop de `302` (`ERR_TOO_MANY_REDIRECTS`) e a área fica em branco. No iPhone o problema é maior: o ITP bloqueia cookies de 3º party mesmo no topo da página. Por isso o padrão é tocar em **“Abrir a consulta oficial”** (mesma aba, volta automaticamente com a tela restaurada). O botão de embed fica disponível como experimento para os poucos navegadores/sites que permitirem. O caminho definitivo de “tudo numa tela só” é consumir a **Consulta Consolidada** (webservice SOAP oficial, sem captcha) via um pequeno proxy — ver [`ideias.md`](ideias.md).

## Estrutura

```
leitor-nfe/
├── index.html          # página única com todo o app
├── vendor/zxing.min.js # ZXing 0.21.3 UMD, versionado junto ao app
├── manifest.json       # PWA (tela de início)
├── icon-192.png
├── icon-512.png
├── apple-touch-icon.png
├── teste-dv.mjs        # testes da validação DV (opcional, node)
├── screenshots/        # evidências visuais do fluxo (Playwright)
├── ideias.md           # melhorias futuras / road map
└── README.md
```

## Como testar no computador

```bash
cd leitor-nfe
python3 -m http.server 8080
```

Abra <http://localhost:8080>. A câmera funciona em `localhost`, mas **não** abrindo o arquivo direto (`file://`) — nem em qualquer site fora de HTTPS.

Testes da validação do dígito verificador (roda com Node.js, não é etapa de build):

```bash
node teste-dv.mjs
```

Para testar a leitura real:

1. Imprima um DANFE e aponte a câmera traseira na horizontal dentro da moldura.
2. Ou mostre o código impresso na tela do site em outro aparelho (celular lendo a tela de outro celular/tela funciona bem se manter firme).
3. Confirme também o caminho manual: digite/cole uma chave válida (44 dígitos) e toque em **Consultar**.

## Como publicar de graça

O site precisa estar em **HTTPS** para a câmera funcionar.

### GitHub Pages (recomendado)

1. Suba esta pasta para um repositório:
   ```bash
   git init && git add -A && git commit -m "Leitor NF-e"
   git branch -M main
   git remote add origin https://github.com/<seu-usuario>/leitor-nfe.git
   git push -u origin main
   ```
2. No GitHub: **Settings → Pages → Deploy from a branch → main / (root) → Save**.
3. Publique em `https://<seu-usuario>.github.io/leitor-nfe/`.

### Netlify

Arraste a pasta para <https://app.netlify.com/drop> (ou conecte o repositório). Pronto.

### Cloudflare Pages

No painel: **Workers & Pages → Create → Pages → Connect to Git** (ou upload direto da pasta).

Em todos os casos, qualquer subcaminho funciona — o app é uma única página relativa ao próprio diretório.

## Adicionar à tela de início no iPhone

1. Abra o site no Safari (em HTTPS).
2. Toque em **Compartilhar** (quadrado com seta pra cima) → **Adicionar à Tela de Início**.
3. O ícone aparece como app; a câmera continua pedindo permissão no primeiro uso (“Permitir”).
