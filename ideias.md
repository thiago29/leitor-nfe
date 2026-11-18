# 🧪 Ideias e melhorias — leitor-nfe

Backlog pensado em 2026-11-18, do mais simples ao mais ambicioso. Prioridade sugerida de cima para baixo.

## P1 — valor imediato, esforço baixo

1. **Proxy da Consulta Consolidada (tudo numa tela só, sem captcha)** — o portal usa captcha justamente para impedir automação; o webservice oficial **SOAP** não tem esse problema: `nfeConsultaCE` em `https://nfe.sefazvirtual.rs.gov.br/ws/NfeConsolWSD/NfeConsolWSD.asmx` devolve o XML completo (`ide`, `emit`, `total`, `det`…) com só a chave. Basta um worker minúsculo (Cloudflare Workers/Netlify Function, < 50 linhas) que faz POST `chNFe` → responde JSON. O app renderiza o resumo rico no lugar do embed experimental. *Obs.: testado a partir de bruto o endpoint ficou fora do ar (timeout TCP); validar com outro IP antes de depender dele.*
2. **Consulta por chave na URL** — `?chave=35170914...` já abre direto a tela de consulta. Útil para o histórico do e-mail/nota e para fixar atalhos.
3. **Compartilhar/QR da chave** — botão “Compartilhar” (`navigator.share`) com chave + link, e gerar QR code local para a outra parte escanear e conferir.
4. **Confirmação rápida** — campo “valor esperado” (R$): o app compara com `vNF` devolvido pela Consulta Consolidada e dá ✅/❌ visual. É o caso de uso real da fiscalização.

## P2 — robustez em campo

5. **Modo offline explícito** — indicar quando a consulta precisa de rede; cache das últimas N notas consultadas (XML/JSON no `IndexedDB`) para reler sem sinal.
6. **Preferência por câmera** — lembrar qual lente/usuário (traseira vs frente, lanterna ligada) entre sessões.
7. **Leitura de múltiplas chaves / modo blitz** — fila: ler uma, tocar em “próxima”, salvar em lote para exportar CSV ao fim.
8. **Acessibilidade** — `aria-live` nos toasts, foco gerenciado entre telas, contraste verificado em tema claro.
9. **Testes automatizados CI** — subir o `teste-dv.mjs` no GitHub Actions + screenshot smoke test (Playwright) em cada push.

## P3 — depois

10. **Manifest completo (installable)** — `display: standalone` ok, faltam `screenshots` e temas no manifest para instalação mais bonita no iOS/Android.
11. **Internacionalização** — trivial por enquanto (pt-BR), mas separar strings se for expandir para outras UFs/leis estaduais.
12. **Auditoria de privacidade escrita no app** — rodapé “nenhum dado sai do aparelho exceto a consulta à SEFAZ” + política curta.
