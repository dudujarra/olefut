/**
 * OffPitch Events Deck — 20 cartas
 *
 * PLAYER MODE ONLY — see SPEC-179
 * Decision B (Hide as Player-Only). Only surfaced via ProPlayer.weekEvents.
 * Manager Mode does NOT render these events. Do not promote without spec update.
 *
 * NPCs nomeados aqui (Marcos Oliveira, Patrícia Lemos, Tio Dinho, Rafael Monteiro
 * etc.) são Decision A (Promote parcial) — reaproveitar nos diálogos manager
 * (TransferOffer / PressConference) em SPEC futura.
 */
// OffPitch Events — 20 cartas com triggers contextuais e NPCs nomeados
export const OffPitchEventsDeck = [
  // === SEMPRE DISPONÍVEIS ===
  {id:"fan_encounter",trigger:()=>true,text:"Tio Dinho te encontra na saída do treino com um grupo de torcedores.",options:[
    {label:"Tirar foto e conversar",effect:{fans:3,sponsors:1},resultText:"Tio Dinho: 'Esse é gente boa!'"},
    {label:"Recusar (com pressa)",effect:{fans:-2},resultText:"Vídeo no Twitter: 'ignorou os fãs'."},
    {label:"Convidar pro treino",effect:{fans:5,boss:-2,teammates:1},resultText:"Gesto incrível! Marcos não curtiu a distração."}
  ]},
  {id:"charity_event",trigger:()=>true,text:"Convite para evento beneficente. Patrícia Lemos insiste: 'Boa exposição.'",options:[
    {label:"Participar",effect:{fans:4,sponsors:3,energy:-10},resultText:"Imagem excelente! Cansou."},
    {label:"Doar dinheiro mas não ir",effect:{fans:1,money:-500},resultText:"Contribuiu financeiramente."},
    {label:"Ignorar",effect:{fans:-1,sponsors:-2},resultText:"Patrícia: 'Oportunidade perdida.'"}
  ]},
  {id:"gym_extra",trigger:()=>true,text:"Dia de folga. Você pode ir à academia ou descansar.",options:[
    {label:"Academia pesada",effect:{energy:-15,powerXP:30},resultText:"Treino extra. Corpo dolorido."},
    {label:"Descansar em casa",effect:{energy:15,stress:-5},resultText:"Recarregou as baterias."},
    {label:"Sair com amigos",effect:{stress:-10,energy:-5,fans:2},resultText:"Relaxou. Fotos no Instagram."}
  ]},
  {id:"social_media",trigger:()=>true,text:"Juliana Reis publicou matéria sobre você. Os comentários estão divididos.",options:[
    {label:"Ignorar as redes",effect:{stress:-2},resultText:"Saúde mental preservada."},
    {label:"Responder os haters",effect:{fans:-3,sponsors:-2,stress:8},resultText:"Briga online. Manchete amanhã."},
    {label:"Postar vídeo treinando",effect:{fans:3,boss:1,sponsors:2},resultText:"Imagem profissional. Patrícia aprova."}
  ]},
  // === TRIGGERS DE RENOME ===
  {id:"press_conference",trigger:(p)=>p.starRating>=2,text:"Coletiva de imprensa. Juliana Reis pergunta: 'Você merece mais minutos?'",options:[
    {label:"Responder diplomaticamente",effect:{boss:2,fans:1,sponsors:1},resultText:"Resposta equilibrada."},
    {label:"Criticar o técnico",effect:{boss:-8,fans:5,sponsors:3,stress:5},resultText:"Bomba! Marcos Oliveira furioso.",flags:{set:"media_feud"}},
    {label:"Elogiar o grupo",effect:{boss:3,teammates:3,fans:-1},resultText:"Resposta de líder. Vestiário fortalecido."}
  ]},
  {id:"sponsor_offer",trigger:(p)=>p.starRating>=2&&p.relationships.sponsors>40,text:"Patrícia Lemos liga: 'Contrato de R$ 5.000. Mas precisa faltar um treino.'",options:[
    {label:"Aceitar o contrato",effect:{sponsors:5,boss:-5,money:5000,actionSlots:-1},resultText:"Dinheiro no bolso. Marcos não gostou."},
    {label:"Recusar educadamente",effect:{boss:3,sponsors:-3},resultText:"Marcos soube e aprovou."},
    {label:"Negociar pra outro dia",effect:{sponsors:2,money:3000},resultText:"Meio-termo. Patrícia aceita."}
  ]},
  {id:"contract_renewal",trigger:(p)=>p.renown>=10,text:"O clube oferece renovação. Aumento de 50%. Patrícia analisa.",options:[
    {label:"Aceitar imediatamente",effect:{boss:5,wage_multiplier:1.5},resultText:"Renovação assinada!"},
    {label:"Pedir o dobro",effect:{boss:-3,wage_multiplier:2.0,stress:5},resultText:"Ousado. Aceitaram rangendo."},
    {label:"Recusar (quer sair)",effect:{boss:-8,fans:-5,teammates:-3,stress:10},resultText:"Clima pesado.",flags:{set:"wants_out"}}
  ]},
  {id:"big_club_interest",trigger:(p)=>p.starRating>=3,text:"Patrícia te liga animada: 'Um clube europeu te quer! Salário 5x.'",options:[
    {label:"Demonstrar interesse",effect:{boss:-3,fans:-2,sponsors:5,stress:5},resultText:"Rumores na imprensa. Juliana Reis confirma.",flags:{set:"transfer_talk"}},
    {label:"Focar no time atual",effect:{boss:5,fans:5,teammates:3},resultText:"Ficou por amor. Tio Dinho chora."},
    {label:"Deixar Patrícia negociar",effect:{sponsors:3,stress:8},resultText:"Negociação nos bastidores."}
  ]},
  // === TRIGGERS DE RELACIONAMENTO ===
  {id:"teammate_conflict",trigger:(p)=>p.relationships.teammates<50,text:"Rafael Monteiro te confronta: 'Tá muito individualista em campo!'",options:[
    {label:"Pedir desculpas",effect:{teammates:5,fans:-1},resultText:"Humildade. Vestiário se acalmou."},
    {label:"'Eu carrego esse time!'",effect:{teammates:-5,fans:3,boss:-3,stress:5},resultText:"Briga no vestiário.",flags:{set:"locker_room_tension"}},
    {label:"Conversar em particular",effect:{teammates:3,boss:1},resultText:"Resolveu como adulto."}
  ]},
  {id:"boss_praise",trigger:(p)=>p.relationships.boss>70,text:"Marcos Oliveira te chama: 'Estou muito satisfeito com sua evolução.'",options:[
    {label:"Agradecer e pedir mais responsabilidade",effect:{boss:3,stress:-5},resultText:"Marcos: 'Vou te dar a braçadeira em breve.'"},
    {label:"Perguntar sobre o esquema tático",effect:{boss:2,visionXP:20},resultText:"Conversa tática. Aprendeu muito."},
    {label:"Pedir aumento",effect:{boss:-2,wage_multiplier:1.3},resultText:"Marcos: 'Vou falar com a diretoria.'"}
  ]},
  {id:"boss_warning",trigger:(p)=>p.relationships.boss<35,text:"Marcos Oliveira te chama no escritório: 'Última chance. Ou muda ou sai.'",options:[
    {label:"Aceitar e se dedicar",effect:{boss:5,stress:8},resultText:"Pressão enorme. Mas ganhou mais uma chance."},
    {label:"Argumentar calmamente",effect:{boss:2,stress:3},resultText:"Marcos: 'Tá bom. Mas estou de olho.'"},
    {label:"Confrontar",effect:{boss:-10,fans:3,stress:15},resultText:"Marcos: 'Você tá fora até segunda ordem.'",flags:{set:"suspended"}}
  ]},
  // === TRIGGERS DE STRESS ===
  {id:"injury_scare",trigger:(p)=>p.energy<40,text:"Fisgada na coxa durante o aquecimento. Nada grave, mas preocupa.",options:[
    {label:"Ir ao fisioterapeuta (1 slot)",effect:{energy:20,actionSlots:-1},resultText:"Fisio recuperou parcialmente."},
    {label:"Ignorar e jogar",effect:{energy:-10,boss:-2,stress:5},resultText:"Forçou. Pode piorar."},
    {label:"Avisar Marcos honestamente",effect:{boss:3,energy:10},resultText:"Marcos aliviou seu treino."}
  ]},
  {id:"burnout_risk",trigger:(p)=>p.stress>50,text:"Você não consegue dormir. Pensamentos acelerados sobre o jogo.",options:[
    {label:"Ligar pro psicólogo",effect:{stress:-15,money:-1500},resultText:"Sessão ajudou. Mente mais leve."},
    {label:"Tomar remédio pra dormir",effect:{stress:-10,energy:-5},resultText:"Dormiu, mas acordou grogue."},
    {label:"Treinar até cansar",effect:{stress:-5,energy:-20},resultText:"Exaustão física ajudou a dormir."}
  ]},
  // === TRIGGERS DE FLAGS (CHAIN EVENTS) ===
  {id:"media_feud_escalation",trigger:(p)=>p.hasFlag('media_feud'),text:"Juliana Reis publica: '${playerName} em guerra com a comissão técnica!'",options:[
    {label:"Pedir desculpas públicas",effect:{boss:5,fans:-3,sponsors:-2},resultText:"Recuou. Manchete: 'Pediu perdão.'",flags:{clear:"media_feud"}},
    {label:"Dobrar a aposta",effect:{boss:-5,fans:5,sponsors:2,stress:10},resultText:"Virou novela. Patrícia: 'Isso vende!'"},
    {label:"Silêncio total",effect:{stress:5},resultText:"Sem comentários. Juliana continua investigando."}
  ]},
  {id:"locker_tension_blowup",trigger:(p)=>p.hasFlag('locker_room_tension'),text:"Vestiário tenso. Rafael Monteiro e outros veteranos te encaram antes do treino.",options:[
    {label:"Pedir desculpas ao grupo",effect:{teammates:8,fans:-1},resultText:"Vestiário unido de novo.",flags:{clear:"locker_room_tension"}},
    {label:"Ignorar e treinar sozinho",effect:{teammates:-5,boss:-2,stress:8},resultText:"Isolamento total."},
    {label:"Convocar reunião",effect:{teammates:5,boss:3},resultText:"Liderança. Resolveu na raça.",flags:{clear:"locker_room_tension"}}
  ]},
  {id:"transfer_saga",trigger:(p)=>p.hasFlag('transfer_talk'),text:"Juliana Reis: 'Fontes confirmam proposta milionária por ${playerName}!'",options:[
    {label:"Confirmar que quer sair",effect:{boss:-10,fans:-8,teammates:-5,sponsors:5},resultText:"Adeus doloroso. Transferência em andamento.",flags:{set:"leaving"}},
    {label:"Desmentir e ficar",effect:{boss:5,fans:8,teammates:5,stress:-5},resultText:"'Meu coração é daqui.' Tio Dinho chora.",flags:{clear:"transfer_talk"}},
    {label:"Deixar em aberto",effect:{stress:10},resultText:"Novela continua. Semana que vem tem mais."}
  ]},
  {id:"suspended_return",trigger:(p)=>p.hasFlag('suspended'),text:"Marcos Oliveira te chama: 'A suspensão acabou. Volta pro treino.'",options:[
    {label:"Voltar humilde",effect:{boss:5,teammates:3,stress:-5},resultText:"Recomeço. Rafael: 'Bem-vindo de volta.'",flags:{clear:"suspended"}},
    {label:"Exigir ser titular",effect:{boss:-3,stress:5},resultText:"Marcos: 'Vai ter que merecer.'",flags:{clear:"suspended"}},
    {label:"Pedir transferência",effect:{boss:-8,fans:-5},resultText:"Queimou pontes.",flags:{set:"wants_out",clear:"suspended"}}
  ]},
  // === RIVAL EVENTS ===
  {id:"rival_interview",trigger:(p)=>p.hasFlag('rival_active')||true,text:"Diego Costa deu entrevista: 'Eu sou melhor que ele. Simples assim.'",options:[
    {label:"Responder em campo",effect:{stress:5},resultText:"Motivação extra pro próximo jogo."},
    {label:"Rebater na imprensa",effect:{fans:3,boss:-2,stress:8},resultText:"Juliana Reis: 'Rivalidade esquenta!'",flags:{set:"rivalry_heated"}},
    {label:"Ignorar",effect:{boss:2},resultText:"Marcos: 'Deixa ele falar. Você mostra no campo.'"}
  ]},
  {id:"night_out_invite",trigger:(p)=>p.stress>30,text:"Companheiros te convidam pra sair à noite. 'Vamo relaxar!'",options:[
    {label:"Ir e curtir",effect:{teammates:4,stress:-15,energy:-10,boss:-2},resultText:"Noite boa. Chegou cansado no treino."},
    {label:"Recusar e descansar",effect:{boss:2,teammates:-1,stress:-3},resultText:"Profissional. Mas os caras ficaram chateados."},
    {label:"Ir mas sair cedo",effect:{teammates:2,stress:-8,energy:-5},resultText:"Equilíbrio. Apareceu mas não exagerou."}
  ]}
];
