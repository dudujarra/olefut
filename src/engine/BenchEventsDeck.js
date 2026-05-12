/**
 * Bench Events Deck — 12 cartas
 *
 * PLAYER MODE ONLY — see SPEC-179
 * Decision B (Hide as Player-Only). Only surfaced via ProPlayer.weekEvents.
 * Manager Mode does NOT render these events. Do not promote without spec update.
 */
// Bench Events — 12 cartas (expandido de 6)
export const BenchEventsDeck = [
  {id:"bench_warm_up",text:"O técnico olha para o banco. Seus olhos param em você.",options:[
    {label:"Levantar e aquecer",effect:{boss:2},resultText:"Marcos Oliveira nota sua dedicação."},
    {label:"Ficar sentado e torcer",effect:{fans:1},resultText:"Tio Dinho vê você torcendo."},
    {label:"Reclamar em voz baixa",effect:{boss:-3,teammates:-1},resultText:"Rafael Monteiro ouviu. Clima pesado."}
  ]},
  {id:"bench_teammate_scores",text:"Seu substituto fez um golaço! A torcida grita o nome dele.",options:[
    {label:"Comemorar e aplaudir",effect:{teammates:3,boss:1},resultText:"Espírito de equipe. Rafael aprova."},
    {label:"Ficar indiferente",effect:{teammates:-2,boss:-1},resultText:"A câmera pegou sua cara fechada."},
    {label:"Ir até ele e abraçar",effect:{teammates:5,fans:2,boss:2},resultText:"Imagem linda. Tio Dinho vibra na arquibancada."}
  ]},
  {id:"bench_coach_talk",text:"No intervalo, Marcos Oliveira vem até você: 'Preciso de mais na próxima semana.'",options:[
    {label:"Acenar e concordar",effect:{boss:2},resultText:"Aceitou com humildade."},
    {label:"Perguntar o que melhorar",effect:{boss:3},resultText:"Marcos gostou da proatividade."},
    {label:"Questionar a escalação",effect:{boss:-5,fans:2,stress:5},resultText:"Tensão. Mas Tio Dinho te apoia."}
  ]},
  {id:"bench_fan_chant",text:"Tio Dinho puxa coro: 'Põe o ${playerName}! Põe o ${playerName}!'",options:[
    {label:"Acenar para a torcida",effect:{fans:3,boss:-1},resultText:"Torcida te ama, Marcos não curtiu."},
    {label:"Ignorar e focar no jogo",effect:{boss:2,fans:-1},resultText:"Profissionalismo."},
    {label:"Fazer gesto pedindo calma",effect:{fans:1,boss:1},resultText:"Maturidade. Todos aprovam."}
  ]},
  {id:"bench_media_camera",text:"A câmera da TV foca no seu rosto. Juliana Reis comenta ao vivo.",options:[
    {label:"Sorrir e acenar",effect:{fans:2,sponsors:2},resultText:"Patrícia Lemos liga: 'Ótima imagem!'"},
    {label:"Manter cara séria",effect:{boss:2},resultText:"Imagem de profissional."},
    {label:"Fazer cara de irritado",effect:{fans:-2,boss:-3,sponsors:-2,stress:3},resultText:"Juliana Reis: 'Jogador visivelmente insatisfeito.'"}
  ]},
  {id:"bench_injury_sub",text:"Um titular se machucou! Marcos olha para o banco avaliando quem entra.",options:[
    {label:"Se oferecer imediatamente",effect:{boss:3,energy:-10},resultText:"Entrou! Deu tudo nos minutos finais."},
    {label:"Esperar ser chamado",effect:{boss:1},resultText:"Aguardou com compostura."},
    {label:"Fingir dor muscular",effect:{boss:-5,teammates:-3,stress:8},resultText:"Ninguém acreditou. Vergonha."}
  ]},
  // === 6 NOVAS ===
  {id:"bench_rival_scores",text:"Diego Costa entrou e fez gol! Comemorou olhando pro banco. Pra você.",options:[
    {label:"Aplaudir educadamente",effect:{boss:2,stress:5},resultText:"Doeu, mas você foi profissional."},
    {label:"Ignorar completamente",effect:{stress:3},resultText:"Fingiram que não viram."},
    {label:"Encarar de volta",effect:{fans:3,boss:-2,stress:8},resultText:"Tensão no ar. A torcida sente."}
  ]},
  {id:"bench_halftime_speech",text:"Intervalo. Marcos faz preleção dura: 'Tá todo mundo devendo!'",options:[
    {label:"Concordar em silêncio",effect:{boss:1},resultText:"Cabeça baixa. Obediente."},
    {label:"Pedir pra entrar no 2º tempo",effect:{boss:2,energy:-5},resultText:"Marcos considera. 'Vou pensar.'"},
    {label:"Motivar os companheiros",effect:{teammates:4,boss:2},resultText:"Discurso forte. Rafael Monteiro: 'É isso aí, moleque.'"}
  ]},
  {id:"bench_phone_notification",text:"Seu celular vibra no bolso. Mensagem da Patrícia Lemos: 'Proposta interessante. Liga depois.'",options:[
    {label:"Guardar e focar no jogo",effect:{boss:1},resultText:"Profissional. Resolve depois."},
    {label:"Ler discretamente",effect:{sponsors:1,boss:-1},resultText:"Ninguém viu... ou viu?"},
    {label:"Ignorar",effect:{sponsors:-1},resultText:"Patrícia não gostou de ser ignorada."}
  ]},
  {id:"bench_veteran_advice",text:"Rafael Monteiro senta do seu lado: 'Relaxa, moleque. Sua hora vai chegar.'",options:[
    {label:"Agradecer o conselho",effect:{teammates:3,stress:-5},resultText:"Palavras de veterano. Stress aliviado."},
    {label:"'Fácil falar, você joga todo jogo'",effect:{teammates:-3,stress:3},resultText:"Rafael se afasta. Queimou uma ponte."},
    {label:"Pedir dicas de treino",effect:{teammates:2,boss:1},resultText:"Rafael ensina uns truques. Respeito mútuo."}
  ]},
  {id:"bench_substitution_denied",text:"Marcos ia te colocar mas mudou de ideia. Colocou outro.",options:[
    {label:"Aceitar calado",effect:{boss:1,stress:8},resultText:"Engoliu seco. Stress subiu."},
    {label:"Perguntar o motivo depois",effect:{boss:0,stress:3},resultText:"Marcos: 'Na próxima, quem sabe.'"},
    {label:"Chutar a garrafa de água",effect:{boss:-5,fans:2,stress:10},resultText:"Viral nas redes. Juliana Reis adora."}
  ]},
  {id:"bench_team_losing",text:"Seu time está perdendo de 2x0. A torcida vaia. Clima pesado no banco.",options:[
    {label:"Manter a calma",effect:{stress:3},resultText:"Difícil assistir mas manteve compostura."},
    {label:"Pedir pra entrar com tudo",effect:{boss:2,energy:-15},resultText:"Marcos te coloca. 15 minutos pra salvar."},
    {label:"Mostrar frustração",effect:{fans:1,boss:-2,stress:5},resultText:"A torcida vê que você se importa."}
  ]}
];
