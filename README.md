# Rota Relâmpago ⚡

Rota Relâmpago é um jogo arcade original de corrida e ação. A experiência está evoluindo para uma aventura 3D de câmera em terceira pessoa, com cinco ambientes, obstáculos, saltos, deslizes, disparada, energia, colecionáveis e progressão por fases.

## Tecnologias e responsabilidade de cada parte

| Tecnologia | Uso no projeto |
| --- | --- |
| TypeScript | Regras do jogo, estados, fases, colisões, controles, salvamento e integração entre sistemas |
| Three.js / WebGL | Renderização 3D, câmera, personagem procedural, pista, iluminação, prédios e obstáculos |
| HTML5 | Estrutura dos menus, HUD, tela de pausa e resultados |
| CSS3 | Layout responsivo, interface, animações dos menus e controles móveis |
| Web Audio API | Efeitos sonoros sintetizados e camada musical original |
| Vite | Desenvolvimento local, empacotamento web e otimização do build |
| Capacitor 8 | Aplicativo Android com WebView e integração com o sistema |
| GitHub Actions | Verificação TypeScript, build web e geração automática do APK |

## Organização do código

- src/main.ts: inicialização, interface, menus e ligação dos eventos.
- src/game/Runner3D.ts: ciclo principal, câmera, velocidade, pontuação e estado da partida.
- src/game/World.ts: pista 3D, prédios, iluminação, ambiente e movimentação do cenário.
- src/game/Player.ts: modelo geométrico do personagem, animação, salto, deslize e troca de pista.
- src/game/ObstacleManager.ts: geração de tráfego, barreiras, arcos, caixas, moedas, baterias e colisões.
- src/game/LevelManager.ts: cinco mundos, duração das fases, paletas e progressão.
- src/game/InputController.ts: teclado, gestos de toque e botões do celular.
- src/game/AudioManager.ts: sons do jogo e camada musical gerada por síntese.
- src/game/SaveManager.ts: recorde, moedas acumuladas e mundo desbloqueado.
- src/game/types.ts: contratos compartilhados entre os sistemas.
- src/game.ts: motor clássico 2D mantido como fallback para aparelhos sem WebGL.

## Mundos

1. Centro urbano
2. Rodovia solar
3. Distrito industrial
4. Estrada litorânea
5. Metrópole neon

Cada mundo usa uma identidade de cores e aumenta gradualmente o desafio. O cenário 3D é construído com geometrias e materiais originais no código, reduzindo dependência de arquivos externos e mantendo o APK leve.

## Comandos

| Ação | Teclado | Celular |
| --- | --- | --- |
| Mudar para a esquerda | ← ou A | Deslizar para a esquerda / botão ← |
| Mudar para a direita | → ou D | Deslizar para a direita / botão → |
| Pular | ↑, W ou espaço | Deslizar para cima / botão ↑ |
| Deslizar | ↓ ou S | Deslizar para baixo / botão ↓ |
| Disparada | Shift ou X | Botão ⚡ |
| Pausar | P ou Esc | Botão Ⅱ |

## Desenvolvimento

Requisitos: Node.js 22 ou superior.

Instale as dependências com npm install e inicie com npm run dev.

## Verificação e build

Execute npm run typecheck, npm run build e npm run preview.

## Android

O Capacitor empacota o build web para Android. O workflow Compilar APK Android gera um APK debug em cada atualização da branch main e publica o arquivo app-debug.apk em uma GitHub Release de pré-lançamento.

- Releases: https://github.com/dagamavasco170-lang/rota-relampago/releases
- Ações de compilação: https://github.com/dagamavasco170-lang/rota-relampago/actions

O APK debug é indicado para testes e instalação manual. Publicação na Google Play exige configuração separada de assinatura e geração do Android App Bundle (AAB).

## Identidade original

O projeto usa a ideia geral de corrida arcade em terceira pessoa como inspiração. Personagem, cenário, código, efeitos, sons e identidade visual são próprios; não utiliza marca, personagem, músicas ou fases extraídas de outros jogos.