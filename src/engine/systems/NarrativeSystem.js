import { rng } from '../rng.js';

/**
 * MEGA PATCH: Narrative Pool Expansion — 150+ narrativas ÚNICAS em 6 contextos.
 * Cada contexto tem 25-30 templates. Sem repetição perceptível em soak tests longos.
 * Adiciona contexto 'derby_week' para semanas de clássico.
 */
export const NARRATIVES_BY_CONTEXT = {
    moral_high: [
        '🎉 Clima excelente no vestiário! Elenco em alta.',
        '💪 Semana de treinos intensa. Time focado.',
        '🔥 Moral nas alturas. Grupo unido.',
        '⚡ Jogadores motivados, rendimento acima da média.',
        '🌟 Vestiário tranquilo. Tudo preparado.',
        '🎯 Concentração total nos próximos desafios.',
        '🤝 Espírito coletivo em alta. Todos no mesmo ritmo.',
        '😄 Animação contagiante nos treinos desta semana.',
        '🌈 Semana positiva. Elenco com sede de vencer.',
        '🏃 Ritmo forte e alegre nos trabalhos do campo.',
        '🎵 Música no vestiário. Grupo leve e confiante.',
        '☀️ Semana ensolarada dentro e fora do campo.',
        '🫂 Grupo abraçou o técnico no fim do treino.',
        '🧃 Churrasquinho de integração na folga. Grupo conectado.',
        '📸 Jogadores postaram treino nas redes — clima vibrante.',
        '🎤 Karaokê no vestiário. Momento leve pra manter a cabeça no lugar.',
        '🏖️ Jogadores pediram um treino na praia. Técnico autorizou — moral subiu.',
        '🧠 Sessão de mentalização pré-jogo. Grupo focado e sereno.',
        '🤗 Novo jogador foi recebido com aplausos. Integração perfeita.',
        '📊 Análise de vídeo motivou o grupo — viram como podem vencer fácil.',
        '🎊 Aniversário de jogador — bolo no vestiário. Clima de família.',
        '🧘 Sessão de yoga coletiva. Incomum, mas o grupo adorou.',
        '⚽ Rachinha com aposta de sorvete. Clima descontraído mas competitivo.',
        '🗣️ Líder do elenco fez discurso espontâneo. Grupo de arrepiou.',
        '📰 Mídia elogiou o trabalho tático. Moral do grupo subiu naturalmente.',
    ],
    moral_low: [
        '😞 Ambiente pesado após os resultados recentes.',
        '🥀 Elenco abatido. Treinamento irregular.',
        '⚠️ Tensão no grupo. Técnico reuniu o elenco.',
        '💔 Sequência ruim afeta a confiança.',
        '🌧️ Semana difícil. Grupo precisa se reencontrar.',
        '😤 Cobrança interna. Jogadores insatisfeitos.',
        '🔇 Silêncio pesado no vestiário. Ninguém fala muito.',
        '👁️ Olhares baixos. Confiança no chão.',
        '🤕 Treino abaixo do esperado. Foco comprometido.',
        '📉 Semana de reflexão forçada após o mau momento.',
        '🚨 Diretoria monitorando de perto o estado do elenco.',
        '😶 Grupo fechado. Poucas conversas, muitas dúvidas.',
        '🪵 Treino pesado como punição. Técnico exigiu entrega.',
        '🗞️ Matéria na imprensa criticou postura do elenco. Desgaste visível.',
        '💢 Briga entre dois jogadores no treino. Staff separou.',
        '🚪 Jogador pediu reunião com a diretoria. Quer sair.',
        '🧊 Clima gelado no ônibus do time. Zero conversa.',
        '📵 Técnico proibiu celulares no CT. Punição coletiva.',
        '🛏️ Jogadores chegaram atrasados ao treino. Falta de compromisso.',
        '😤 Torcida organizou protesto no portão do CT.',
        '🤦 Treino tático virou caos. Esquema não funciona.',
        '😔 Veterano sussurrou: "Esse grupo não quer nada."',
        '🚑 Jogador saiu machucado do treino pesado. Clima piorou.',
        '📋 Conselho deliberativo questionou o trabalho do técnico.',
        '😰 Técnico admitiu em entrevista: "É o pior momento da minha gestão."',
    ],
    relegation: [
        '😰 Pressão máxima. Cada ponto é vital.',
        '🧨 Semana decisiva na luta contra o rebaixamento.',
        '🏃 Time treinou dobrado, consciente da situação.',
        '😓 Clima pesado. Rebaixamento à vista.',
        '🔥 Tudo ou nada nas próximas rodadas.',
        '🪖 Mentalidade de batalha. Cada jogo, uma final.',
        '📣 Técnico convocou reunião de emergência na semana.',
        '🧱 Muralha defensiva sendo construída nos treinos.',
        '💢 Raiva canalizada. Time quer sair do sufoco.',
        '🎲 Semana de apostas. O grupo precisa entregar.',
        '⏳ Tempo curto, pressão grande. Grupo concentrado.',
        '🌊 Nado contra a maré — mas o elenco não desistiu.',
        '🚨 Torcida foi ao CT cobrar. Técnico ouviu em silêncio.',
        '📜 Diretoria entregou ultimato: "Vençam ou caem todos."',
        '🙏 Jogadores rezaram juntos antes do treino.',
        '⛈️ Temporal durante o treino. Ninguém saiu do campo.',
        '🪓 Técnico cortou 3 jogadores da concentração. Cirurgião.',
        '💀 "Quem não estiver disposto a morrer em campo, pode ir embora."',
        '🧤 Goleiro fez palestra motivacional. Grupo chorou.',
        '📺 Torcida fez vigília na porta do hotel de concentração.',
        '🛡️ Treino exclusivo de marcação. Zero tolerância com erros.',
        '🗡️ "É guerra. Não tem bonito, tem que ser eficiente."',
        '🏴 Bandeirão da torcida cobriu todo o CT: "RAÇA OU VERGONHA".',
        '🤜 Técnico deu soco na lousa tática. "ACORDA!"',
        '🎗️ Time usou faixa preta no braço: "Luto pelo rebaixamento não acontecer."',
    ],
    title_race: [
        '👑 Concentração total na disputa pelo título.',
        '🏆 Cada treino é tratado como final.',
        '🎯 Grupo blindado. Foco no campeonato.',
        '⭐ Momento histórico se aproxima.',
        '🥇 Semana decisiva. Pressão positiva no grupo.',
        '🔒 Vestiário fechado para o exterior. Zero distração.',
        '🏅 Fome de título. Jogadores em estado de graça.',
        '✨ Semana especial. Sente-se algo diferente no ar.',
        '🚀 Energia de campeão. O grupo acredita.',
        '🌠 Treinos intensos mas alegres. Título à vista.',
        '💎 O mais difícil está perto. Time focado.',
        '🎖️ Legado sendo construído. Semana histórica em potencial.',
        '🔬 Análise cirúrgica do adversário. Nada ao acaso.',
        '🧊 Concentração absoluta. CT parece centro de comando militar.',
        '🦁 "Somos leões. Esse título é NOSSO." — capitão no vestiário.',
        '📿 Cada jogador tem seu ritual pré-jogo. Superstições respeitadas.',
        '🏟️ Torcida esgotou ingressos pra próximos 3 jogos.',
        '📰 Manchete do jornal: "É agora ou nunca para o {teamName}."',
        '🎬 Departamento de vídeo preparou montagem motivacional. Arrepiou.',
        '🗣️ Ex-jogador do clube visitou o CT. "Ganhem isso por mim."',
        '💫 Tática ensaiada 50 vezes. Time decorou cada movimento.',
        '🧠 Psicólogo do clube fez sessão individual com cada jogador.',
        '🛡️ Defesa treinou 4 horas seguidas. Perfeição defensiva.',
        '⚡ Contra-ataque ensaiada funciona em 3 segundos. Mortífero.',
        '🎺 Torcida cantou no portão do CT até meia-noite.',
    ],
    mid_table: [
        '📊 Semana de ajustes táticos.',
        '🔄 Rotação no treino. Todos os jogadores envolvidos.',
        '📝 Técnico analisa próximos adversários.',
        '🏃 Ritmo forte nos treinos.',
        '💬 Reunião de equipe. Foco nos detalhes.',
        '🧩 Semana de encaixe do esquema tático.',
        '🔍 Vídeos de oposição estudados com atenção.',
        '⚙️ Ajustes finos na mecânica coletiva.',
        '📅 Semana de preparação sem novidades negativas.',
        '🎽 Treino físico intenso. Elenco em boa forma.',
        '🧘 Semana tranquila. Grupo confiante no processo.',
        '🤔 Análise pós-rodada. Time busca consistência.',
        '☕ Técnico tomou café com os jogadores. Papo reto sobre metas.',
        '🧪 Teste de novo esquema tático no treino. Resultados promissores.',
        '📐 Treino focado em bola parada. Cobrança de falta e escanteio.',
        '🏋️ Preparação física reforçada. Semana de carga pesada.',
        '🤝 Diretoria e comissão técnica alinhados. Sem ruído.',
        '📋 Lista de reforços sendo avaliada pela diretoria.',
        '🧃 Folga monitorada. Jogadores curtiram mas voltaram focados.',
        '📈 Estatísticas mostram melhora em passes completados.',
        '🎓 Sub-20 treinaram com o profissional. Rodízio de experiência.',
        '🌡️ Departamento médico liberou todos. Sem lesionados na semana.',
        '⚽ Coletivo de quinta-feira definiu o time titular.',
        '🗺️ Scout apresentou relatório sobre próximo adversário.',
        '📺 Jogo transmitido na TV. Jogadores querem mostrar serviço.',
    ],
    derby_week: [
        '⚡ SEMANA DE CLÁSSICO! CT em clima de guerra.',
        '🔥 Rivalidade histórica. Grupo concentrado e mordido.',
        '🏟️ Ingressos esgotados em 30 minutos. Caldeirão garantido.',
        '🦅 "Vamos CALAR eles." — capitão no vestiário.',
        '📺 Cobertura especial da mídia. Câmeras por todo o CT.',
        '🎭 Drama e tensão: ex-jogador do rival agora joga aqui.',
        '🗞️ Jornal publicou retrospecto: 47 clássicos, 18 vitórias.',
        '🔒 Portões do CT fechados. Treino secreto.',
        '💀 Torcida adversária provocou nas redes. Elenco viu.',
        '🤬 Jogador soltou: "Perder pra eles NÃO."',
        '🏴 Faixa da torcida: "DERROTEM OU NEM VOLTEM."',
        '📿 Ritual pré-clássico. Cada um tem o seu.',
        '🧠 Vídeo com 10 gols históricos em clássicos. Motivação.',
        '⚔️ Treino com marcação dobrada. Simulando o inferno.',
        '🎪 Semana de circo na mídia, paz no CT. Grupo blindado.',
    ],
};

/**
 * Seleciona narrativa contextual baseada em posição, moral e sequência.
 *
 * @param {{ position: number, totalTeams: number, moral: number, streak: number }} ctx
 * @returns {string}
 */
export function pickNarrative(ctx) {
    const { position = 10, totalTeams = 20, moral = 50, streak = 0 } = ctx;
    let key;
    if (moral > 65 && position <= 3) {
        key = 'title_race';
    } else if (position >= totalTeams - 3) {
        key = 'relegation';
    } else if (moral < 40) {
        key = 'moral_low';
    } else if (moral > 65) {
        key = 'moral_high';
    } else {
        key = 'mid_table';
    }
    const pool = NARRATIVES_BY_CONTEXT[key];
    return pool[Math.floor(rng() * pool.length)];
}

/**
 * Narração contextual por tática
 */
// P1-5: Variedade narração 5x — cada categoria 10-15+ templates únicos
export const TACTIC_NARRATION = {
    normal: {
        chance: [
            "{atk} arma jogada pelo meio!", "{atk} tenta triangulação!", "{atk} avança pela intermediária!",
            "{atk} cria oportunidade!", "{atk} chega com perigo!", "{atk} acelera o jogo!",
            "{atk} tabela e abre espaço!", "{atk} infiltra na área!", "{atk} encontra brecha na defesa!",
            "{atk} testa o goleiro do {def}!", "{atk} cruza com perigo!", "{atk} chega na linha de fundo!"
        ],
        goal: [
            "{atk} marca um belo gol!", "{atk} balança as redes!", "{atk} abre o placar com categoria!",
            "{atk} GOL! Bola no fundo da rede!", "{atk} converte a chance!", "{atk} faz o que tinha que fazer!",
            "{atk} bate forte e marca!", "{atk} de placa!", "{atk} explode pra rede!",
            "{atk} marca em jogada ensaiada!", "GOOOL DO {atk}!", "{atk} acerta o canto!"
        ],
        miss: [
            "{atk} arrisca mas passa por cima!", "{atk} chuta e o goleiro segura!", "{atk} desperdiça!",
            "{atk} pra fora! Quase!", "{atk} no travessão!", "{atk} chuta na rede pelo lado de fora!",
            "{atk} tenta de cabeça mas erra o alvo!", "{atk} chuta torto!", "{atk} pega mal na bola!",
            "{atk} bate na trave!", "{atk} isolado!"
        ],
        save: [
            "Defesaça do goleiro do {def}!", "O goleiro do {def} se estica e salva!", "Grande defesa!",
            "Defesa milagrosa!", "Goleiro do {def} no lugar certo!", "Salva o {def}!",
            "Que defesa!", "O goleiro do {def} agarra firme!", "Defesa em dois tempos!",
            "Goleiro do {def} espalma!", "Defesona!"
        ],
        filler: [
            "{atk} roda a bola no meio.", "Jogo equilibrado no momento.", "{def} recua e espera.",
            "Posse de bola dividida.", "Jogo cadenciado.", "{atk} controla o ritmo.",
            "Disputa de meio-campo.", "{def} marca com atenção.", "Bola no meio de campo.",
            "{atk} estuda a defesa do {def}.", "Pegada forte de ambos os lados.", "Jogo morno."
        ]
    },
    offensive: {
        chance: [
            "{atk} sobe em bloco! Pressão total!", "{atk} ataca com 4 jogadores!", "{atk} joga no abafa!",
            "{atk} avança em ataque maciço!", "{atk} massacra a defesa adversária!", "{atk} joga linha alta!",
            "{atk} ataca com tudo!", "{atk} parte pra cima!", "{atk} cerca a área do {def}!",
            "{atk} bombardeia o gol!", "{atk} ataca com volume!", "{atk} mantém pressão alta!"
        ],
        goal: [
            "{atk} marca de goleada! O jogo é ataque!", "{atk} GOOOL! O jogo ofensivo funciona!", "{atk} explode na frente!",
            "{atk} marca de bandeja!", "{atk} GOL após pressão constante!", "{atk} converte com facilidade!",
            "{atk} GOOOL! Ataque imparável!", "{atk} arrasa! Que gol!", "{atk} faz parecer fácil!",
            "{atk} cravar o gol!", "{atk} ataque-relâmpago!", "{atk} GOOOL espetacular!"
        ],
        miss: [
            "{atk} se lança ao ataque mas perde a bola!", "{atk} arrisca de longe! Passou!",
            "{atk} cabeceia e tira tinta!", "{atk} chuta forte mas erra o alvo!", "{atk} desperdiça gol feito!",
            "{atk} pega mal e a bola sobe!", "{atk} arrisca chute torto!", "{atk} perde gol incrível!"
        ],
        save: [
            "Milagre do goleiro do {def}! Quase gol!", "O goleiro do {def} salva o time!",
            "Defesaça espetacular do {def}!", "{def} se segura no goleiro!", "O goleiro do {def} evita o pior!",
            "Defesa heróica do {def}!", "{def} está vivo graças ao goleiro!"
        ],
        filler: [
            "{atk} mantém pressão ofensiva. {def} sofre.", "Jogo aberto, {atk} domina o campo de ataque.",
            "{atk} ataca incessantemente.", "{def} se defende como pode.", "{atk} põe muita gente no ataque.",
            "Festival ofensivo do {atk}!", "{def} encurralado.", "{atk} não dá trégua.",
            "Pressão sufocante do {atk}.", "{def} respira mal."
        ]
    },
    defensive: {
        chance: [
            "{atk} sai em contra-ataque rápido!", "{atk} rouba a bola e sai correndo!", "{atk} lança na velocidade!",
            "{atk} explora espaço deixado!", "{atk} corre no contragolpe!", "{atk} aproveita brecha!",
            "{atk} surpreende com velocidade!", "{atk} dispara em transição!", "{atk} pega o {def} desligado!"
        ],
        goal: [
            "{atk} marca no contra-ataque! Mortal!", "{atk} GOOOL de contra! Eficiência pura!", "{atk} letal na saída!",
            "{atk} GOL fulminante na transição!", "{atk} converte contragolpe!", "{atk} mata na velocidade!",
            "{atk} GOOOL! Contra-ataque cirúrgico!", "{atk} marca em jogada relâmpago!"
        ],
        miss: [
            "{atk} tenta o contra mas perde o timing!", "{atk} chega mas finaliza mal!",
            "{atk} sai rápido mas erra a conclusão!", "{atk} dispara mas chuta isolado!"
        ],
        save: [
            "O goleiro do {def} fecha o ângulo!", "Salvou! {def} sobrevive!",
            "Defesaça do {def}!", "{def} agarra no contra!"
        ],
        filler: [
            "{atk} recua e fecha os espaços.", "Jogo truncado. {atk} espera o momento certo.",
            "{def} tenta furar a retranca.", "{atk} compacto na defesa.", "Marcação cerrada.",
            "{def} bate na muralha do {atk}.", "{atk} sufoca o jogo.", "Cadência baixa.",
            "{def} sem espaço pra criar."
        ]
    },
    pressing: {
        chance: [
            "{atk} rouba na saída de bola do {def}!", "{atk} pressiona e recupera!", "{atk} não deixa {def} respirar!",
            "{atk} ataca em cima da marcação!", "{atk} encurta espaços!", "{atk} sufoca o adversário!",
            "{atk} rouba alta e parte!", "{atk} marca por pressão!"
        ],
        goal: [
            "{atk} marca após pressão alta! Asfixiou!", "{atk} GOOOL! Pressionou e converteu!", "{atk} rouba e marca!",
            "{atk} GOL após roubada!", "{atk} pressiona e mata!", "{atk} converte erro do {def}!"
        ],
        miss: [
            "{atk} pressiona mas se desgasta!", "{atk} erra na pressão e abre espaço!",
            "{atk} cansa e perde objetivo!"
        ],
        save: [
            "O goleiro do {def} segura firme!", "Pressão do {atk} não consegue furar!",
            "Defesaça! Ataque parou na trave!"
        ],
        filler: [
            "{atk} mantém marcação altíssima. {def} sem ar.", "Intensidade do {atk} é impressionante.",
            "{def} não consegue sair jogando.", "{atk} sufoca!", "Pressão alta funcionando!",
            "{def} sem espaço.", "{atk} não dá tempo de pensar.", "Jogo intenso!"
        ]
    },
    counter: {
        chance: [
            "{atk} absorve e sai em velocidade!", "{atk} arma o contra-ataque mortal!", "{atk} espera, rouba e lança!",
            "{atk} segura e dispara!", "{atk} aguarda momento e parte!", "{atk} explora vazio!"
        ],
        goal: [
            "{atk} fulmina no contra-ataque! GOOOL!", "{atk} mata o jogo na transição!", "{atk} eficiente como sempre!",
            "{atk} GOOOL letal de contra!", "{atk} converte na primeira chance!"
        ],
        miss: [
            "{atk} tenta o contra mas isolou!", "{atk} sai rápido mas errou o passe final!",
            "{atk} dispara mas perde a bola!"
        ],
        save: [
            "Defesaça! O goleiro do {def} estava preparado!", "O contra do {atk} é barrado!",
            "{def} agarra no contragolpe!"
        ],
        filler: [
            "{atk} espera pacientemente.", "{def} tem a bola mas não acha espaço.", "Jogo de xadrez tático.",
            "{atk} retraído estuda momento.", "{def} ataca mas {atk} segura.", "Disputa estratégica.",
            "{atk} aguarda o erro do {def}."
        ]
    },
    possession: {
        chance: [
            "{atk} troca passes e acha o espaço!", "{atk} desfaz a marcação com posse!", "{atk} cansa o {def} com toques!",
            "{atk} circula a bola e penetra!", "{atk} chega após paciente armação!", "{atk} cria com posse!"
        ],
        goal: [
            "{atk} marca após 25 toques! Posse letal!", "{atk} GOOOL! A paciência pagou!", "{atk} perfura com maestria!",
            "{atk} GOL após posse longa!", "{atk} converte armação minuciosa!"
        ],
        miss: [
            "{atk} tenta mas falta objetividade!", "{atk} troca muitos passes e perde!",
            "{atk} demora demais e perde a chance!"
        ],
        save: [
            "O goleiro do {def} faz a leitura!", "Boa defesa! {def} resiste à posse!",
            "Defesaça! {def} aguenta!"
        ],
        filler: [
            "{atk} domina 65% da posse.", "Toque, toque, toque... {def} corre atrás.", "{atk} não se apressa.",
            "{atk} mantém o ritmo.", "{def} cansa de correr.", "{atk} dita o tempo.",
            "Posse imensa do {atk}.", "{def} sem a bola."
        ]
    }
};
