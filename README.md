# Rota Relampago ⚡

Um jogo arcade original de corrida infinita, feito com TypeScript, Canvas 2D e Vite. Desvie dos obstáculos, mude de pista, pule barreiras, deslize sob portais e colete moedas para bater seu recorde.

## Rodar localmente

Requisitos: Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite no navegador.

## Comandos

| Ação | Teclado | Celular |
| --- | --- | --- |
| Mudar para a esquerda | ← ou A | Deslizar para a esquerda / botão ← |
| Mudar para a direita | → ou D | Deslizar para a direita / botão → |
| Pular | ↑, W ou espaço | Deslizar para cima / botão ↑ |
| Deslizar | ↓ ou S | Deslizar para baixo / botão ↓ |
| Pausar ou continuar | P ou Esc | Botão Ⅱ |

## Recursos da primeira versão

- Três pistas com perspectiva desenhada em Canvas 2D.
- Obstáculos que exigem desvio, salto ou deslize.
- Moedas e escudo temporário.
- Velocidade e pontuação que aumentam durante a corrida.
- Recorde salvo localmente no navegador.
- Efeitos sonoros sintetizados pela Web Audio API.
- Layout adaptável a computadores e celulares.

## Tecnologias

- TypeScript para lógica e regras do jogo.
- Canvas 2D para renderização.
- HTML e CSS para interface responsiva.
- Web Audio API para efeitos sonoros.
- LocalStorage para o recorde.
- Vite para desenvolvimento e build.

## Build de produção

```bash
npm run typecheck
npm run build
npm run preview
```

## Publicar

O projeto pode ser publicado como site estático em serviços como GitHub Pages, Netlify ou Vercel. O comando de build gera os arquivos finais na pasta `dist/`.

## Créditos

Projeto independente. Personagens, marca, sons e identidade visual são originais; a proposta usa apenas a ideia geral de corrida arcade infinita como inspiração.
## Aplicativo Android (APK)

O projeto usa Capacitor 8 para empacotar o jogo em um aplicativo Android nativo com WebView.

### Baixar o APK pelo GitHub

1. Abra a aba **Actions** deste repositório.
2. Entre na execução mais recente de **Compilar APK Android**.
3. Na seção **Artifacts**, baixe `rota-relampago-android-apk`.
4. Extraia o ZIP e instale `app-debug.apk no aparelho Android.

A compilação é iniciada automaticamente a cada atualização enviada para `main). Também pode ser iniciada manualmente em **Actions → Compilar APK Android → Run workflow**.

**Observação:** esta é uma compilação de teste (APK debug), adequada para instalar e testar diretamente. Uma versão de publicação na Google Play exige assinatura de lançamento e geração de AAB, que serão configuradas separadamente.

Requisitos do Android: Capacitor 8 suporta Android 7 (API 24) ou superior, desde que o Android System WebView esteja atualizado.
