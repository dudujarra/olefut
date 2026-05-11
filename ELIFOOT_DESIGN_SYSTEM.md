# Design System: Elifoot "Luxury Arcade" Engine

## 1. Visão Geral & Atmosfera
**"Luxury Arcade & 16-Bit Premium"**

A atmosfera do Elifoot é densa e tática, lembrando um cockpit de simulação de alto padrão, mas com o charme nostálgico e a precisão do 16-bit luxuoso. Não é "retrô bagunçado" nem "dashboard corporativo genérico". É um simulador esportivo de elite.

**Parâmetros Base (Configuração Ativa):**
* **Density:** 8/10 (Cockpit Dense) - Máxima densidade de dados sem comprometer a leitura. Sem espaços perdidos, linhas finas de separação.
* **Variance:** 7/10 (Offset) - Grid assimétrico, layout Bento. Esqueça 3 colunas perfeitas e iguais.
* **Motion:** 6/10 (Cinematic Physics) - Animações perpétuas, pulse suave, feedback tátil instantâneo.

## 2. Paleta de Cores e Papéis (Color Calibration)
O visual deve passar a ideia de precisão matemática e gramado sagrado.

* **Fundo Base:** `#0F1115` (Deep Carbon) - Escuro puro, profundo, mas não preto `#000000`.
* **Surface/Painéis:** `rgba(24, 26, 32, 0.7)` com `backdrop-filter: blur(12px)`.
* **Borda de Refração (Glass):** `rgba(255, 255, 255, 0.08)` (Usada para o Double-Bezel e isolamento espacial).
* **Emerald (Sucesso/Principal):** `#10B981` / Glow: `rgba(16, 185, 129, 0.3)` - Cor principal da marca e do campo.
* **Gold (Atenção/Secundário):** `#F59E0B` - Usado com parcimônia para avisos críticos ou destaques financeiros.
* **Crimson (Perigo/Derrota):** `#EF4444` - Lesões, cartões e derrotas.
* **Steel/Muted:** `#94A3B8` - Textos secundários, labels.
* **Branco Puro:** `#FFFFFF` - Texto de títulos e valores numéricos importantes.

> **Regra de Cores [CRITICAL]:** SEM neon azul ou roxo genérico (Banned: The Lila Ban). SEM gradientes supersaturados. Textos de leitura nunca podem usar cores vibrantes; reserve a cor apenas para dados de destaque ou ícones de status.

## 3. Tipografia (Typography Architecture)
A tipografia define 90% da identidade visual.

* **Display/Headlines (Opcional para Hero/Marca):** `Press Start 2P` - Usado EXCLUSIVAMENTE para títulos de tela, placar do jogo, e elementos que precisam gritar "Elifoot".
* **Headings de Seção:** `Satoshi` ou `Cabinet Grotesk` - Bold, tracking tight (`letter-spacing: -0.04em`).
* **Corpo e Interface:** `Outfit` ou `Geist` - Clean, ultra legível, com peso variável para hierarquia.
* **Números / Dados [MANDATORY]:** `JetBrains Mono` ou `Geist Mono`. TODOS os dados financeiros, pontuações, placares, barras de progresso devem utilizar Monospace. Números tabulares previnem que a UI "dance" durante as atualizações rápidas do motor de jogo.

> **Anti-Pattern Tipográfico:** Fonte `Inter` está BANIDA. Fontes com Serifa estão BANIDAS. 

## 4. Estilos de Componentes (Double-Bezel & Bento)
Em densidade alta (Cockpit Dense), evitamos "cards com padding enorme e sombras difusas".

* **Arquitetura Double-Bezel:** Todo card/container deve ter uma borda externa fina (`border-white/10`) e um pequeno espaço de refração interno.
* **Bordas (Radii):** Use `rounded-sm` ou cantos vivos e "cortados" que remetem a hardwares retro, combinados com pequenas estilizações (pixel-art sutil).
* **Botões:** Feedback tátil é obrigatório! Nenhum hover flutuante e genérico. Ao clicar (`:active`), o botão DEVE descer `translate-y-[1px]` ou `scale-[0.98]` simulando um botão físico de fliperama.
* **Barras de Relacionamento/Status:** 4 a 6 pixels de altura. Bordas quadradas ou minimamente arredondadas. Fundo escuro com a cor de preenchimento sólida e saturada. Sem gradiente nas barras.

## 5. Princípios de Layout
* **Bento Grid Assimétrico:** A interface principal do Dashboard deve ser dividida em blocos de tamanhos desiguais (ex: Placar central largo, Finanças num bloco compacto à direita, Eventos rolando na esquerda).
* **NADA DE 3 COLUNAS SIMÉTRICAS:** Proibido o clássico `grid-cols-3` de "Features" no dashboard.
* **Respeito ao Espaço (Sem Overlap):** Elementos NUNCA devem sobrepor outros textos. Os grids são contêineres rígidos.
* **Mobile-First Real:** Abaixo de 768px, o grid vira colapso vertical completo (single-column). Sem scroll horizontal para painéis (exceto tabelas de dados). `min-h-[100dvh]` obrigatório, nunca `h-screen`.

## 6. Animação e Motion (Perpetual Micro-Interactions)
A interface deve parecer "viva" mesmo quando parada.

* **Score Flash:** Quando um gol acontece, o placar não apenas muda. Ele pisca (`scale(1.15)` e `text-shadow` na cor principal) por exatos 600ms antes de voltar ao normal.
* **Pulse Constants:** Bolinhas de status de "Jogando" ou "Formação" de titulares respiram suavemente para dar vida à HUD.
* **Physics:** Quando possível (em React/Framer), transições devem ter "Spring Physics" (`stiffness: 100, damping: 20`). Sem easing linear genérico.
* **Hardware Acceleration:** Animamos *apenas* `transform` e `opacity`. Nenhuma animação no `top`, `left`, `width` ou `height` que custe re-renders caros no DOM. A UI atualizará centenas de vezes por segundo em "soak testing".

## 7. Anti-Padrões & Banimentos Rigorosos (AI Tells)
Essas são as assinaturas clichês de UI genérica que DEVERÃO SER DESTRUÍDAS em toda refatoração:

* **[BANIDO] Sombras Suaves Gigantes:** Nada de `box-shadow: 0 10px 30px rgba(0,0,0,0.1)`. Quer profundidade? Use sobreposição de camadas e bordas contrastantes de 1px.
* **[BANIDO] Emojis ⚽️ 🏆 💰:** Emojis são proibidos no código e na interface. Use ícones Phosphor/Radix com `strokeWidth` padronizado.
* **[BANIDO] Placeholder Texts ("Acme", "John Doe"):** Todo mock de dados visual deve parecer com os times originais do Elifoot (São Paulo, Corinthians, Santos) ou nomes gerados procedurais com verossimilhança total.
* **[BANIDO] Botão de "Learn More" / Textos Genéricos ("Elevate your gameplay"):** Toda copy do Elifoot é direta, estatística e técnica (ex: "PROCESSAR SEMANA", "VENDER JOGADOR").
* **[BANIDO] Barras de Scroll Padrão do Navegador:** Todo overflow do Bento deve ter scrollbars minificadas customizadas com CSS ou hidden com rolagem limpa, mantendo a estética imersiva.

---
**CONCLUSÃO OPERACIONAL:**
Qualquer agente que tocar na UI do Elifoot a partir de agora **DEVE LER** este relatório. Cada refatoração de página ou componente (`ClubView.jsx`, `TransferMarket.jsx`, `Tactics.jsx`) deve ser reescrita para remover inline styles antigos, incorporar o Double-Bezel, aplicar o Bento Grid, e utilizar este vocabulário visual e tipográfico estrito.
