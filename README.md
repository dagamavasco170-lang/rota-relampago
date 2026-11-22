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