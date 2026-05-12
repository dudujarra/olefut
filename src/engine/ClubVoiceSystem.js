/**
 * ClubVoiceSystem — SPEC-F3.1
 *
 * Catálogo de vozes textuais contextuais por clube BR.
 * Top 20 clubes BR (Série A representativa).
 *
 * Pure module. Determinístico via seed.
 */

export const ClubVoices = {
    // === RIO DE JANEIRO ===
    'Flamengo': {
        city: 'Rio de Janeiro', region: 'SE', stadium: 'Maracanã',
        voices: {
            stadium_entry: [
                'Maracanã rubro-negro em festa. Mengão na casa do povo.',
                'Cantos da Nação ecoam pelo Maraca.',
                'Manto sagrado da Gávea hasteado. Mengo!',
            ],
            goal_home: [
                'GOOOL do Mengão! Maracanã em festa!',
                'Nação vibra! Bola na rede sagrada!',
                'Rubro-negro do Brasil inteiro abraçados nesse gol!',
            ],
            goal_away: [
                'Mengão calou estádio adversário!',
                'Gol fora de casa, manto rubro-negro maior!',
            ],
            rival_match: [
                'Clássico carioca. Maracanã treme até o último segundo.',
                'Mengão na cara do rival. Vai ser história.',
            ],
        },
    },
    'Fluminense': {
        city: 'Rio de Janeiro', region: 'SE', stadium: 'Maracanã',
        voices: {
            stadium_entry: ['Tricolor das Laranjeiras. Maracanã verde-grená.', 'Pó-de-arroz canta no Maraca.'],
            goal_home: ['GOOOL do Flu! Cariocas em festa tricolor!', 'Bola na rede e o pó-de-arroz no ar!'],
            goal_away: ['Flu silencia adversário fora de casa.'],
            rival_match: ['Fla-Flu. Maior clássico do Brasil. Sangue na bola.'],
        },
    },
    'Vasco': {
        city: 'Rio de Janeiro', region: 'SE', stadium: 'São Januário',
        voices: {
            stadium_entry: ['São Januário, casa da Cruz de Malta. Vasco em campo.', 'Colina histórica recebe seu manto preto-e-branco.'],
            goal_home: ['Vasco da Gama! Gol da Cruz de Malta!', 'Colina explode! Vascão!'],
            goal_away: ['Cruz de Malta no peito, gol em terras distantes.'],
            rival_match: ['Clássico dos Gigantes. Vasco x rival. Tradição.'],
        },
    },
    'Botafogo': {
        city: 'Rio de Janeiro', region: 'SE', stadium: 'Nilton Santos',
        voices: {
            stadium_entry: ['Nilton Santos pulsa preto-e-branco. Glorioso em campo.', 'Engenhão recebe o alvinegro.'],
            goal_home: ['BOTAFOOOGO! Estrela solitária reina!', 'Manto sagrado do Glorioso. Gol!'],
            goal_away: ['Botafogo silencia visitante em casa.'],
            rival_match: ['Clássico Vovô. Glorioso x adversário. Honra em campo.'],
        },
    },
    // === SÃO PAULO ===
    'Corinthians': {
        city: 'São Paulo', region: 'SE', stadium: 'Neo Química Arena',
        voices: {
            stadium_entry: ['Arena Corinthians. Fiel em peso. Bando de Loucos.', 'Itaquerão recebe seu Timão.'],
            goal_home: ['CORIIIIINTHIA! Timão na lona!', 'Fiel grita o gol! Vai, Corinthians!'],
            goal_away: ['Timão calou estádio rival.'],
            rival_match: ['Derby paulista. Corinthians contra a história.'],
        },
    },
    'Palmeiras': {
        city: 'São Paulo', region: 'SE', stadium: 'Allianz Parque',
        voices: {
            stadium_entry: ['Allianz Parque verde. Porco em casa.', 'Avanti, Palmeiras! Mancha Verde canta.'],
            goal_home: ['PALMEIRAAAAS! Gol do Verdão!', 'Porco no chiqueiro! Vamos pra cima!'],
            goal_away: ['Verdão silenciou adversário em casa alheia.'],
            rival_match: ['Clássico paulista. Palmeiras na briga.'],
        },
    },
    'São Paulo': {
        city: 'São Paulo', region: 'SE', stadium: 'Morumbi',
        voices: {
            stadium_entry: ['Morumbi tricolor. São Paulo na casa-grande.', 'Cuca em peso. Tricampeão mundial em campo.'],
            goal_home: ['SÃO PAULOOO! Tricolor explode no Morumbi!', 'Soberano! Gol do Tricolor!'],
            goal_away: ['SPFC calou rival.'],
            rival_match: ['Choque-Rei. São Paulo contra rival. História escrita.'],
        },
    },
    'Santos': {
        city: 'Santos', region: 'SE', stadium: 'Vila Belmiro',
        voices: {
            stadium_entry: ['Vila Belmiro. Templo do Peixe. Santos no manto.', 'Vila aplaude o Glorioso.'],
            goal_home: ['SANTOOOS! Vila pulsa o gol do Peixe!', 'Manto Sagrado da Vila. Gol!'],
            goal_away: ['Santos silenciou adversário em casa alheia.'],
            rival_match: ['Clássico santista. Peixe na briga.'],
        },
    },
    // === MINAS GERAIS ===
    'Cruzeiro': {
        city: 'Belo Horizonte', region: 'SE', stadium: 'Mineirão',
        voices: {
            stadium_entry: ['Mineirão azul-celeste. Raposa em campo.', 'Cabuloso saúda a torcida estrelada.'],
            goal_home: ['CRUUUZEIRO! Raposa cai pra cima!', 'Gigante saiu! Cruzeiro, Cruzeiro!'],
            goal_away: ['Cruzeiro silenciou estádio alheio.'],
            rival_match: ['Clássico mineiro. Cruzeiro pra cima.'],
        },
    },
    'Atlético-MG': {
        city: 'Belo Horizonte', region: 'SE', stadium: 'Arena MRV',
        voices: {
            stadium_entry: ['Arena MRV preto-e-branco. Galo de campo.', 'Mineirão alvinegro. Massa em peso.'],
            goal_home: ['GAAAALOOO! Mineirão na lona!', 'Massa Alvinegra explode! Gol do Galo!'],
            goal_away: ['Atlético silenciou casa rival.'],
            rival_match: ['Clássico mineiro. Galo vs Raposa. Sangue no campo.'],
        },
    },
    // === SUL ===
    'Grêmio': {
        city: 'Porto Alegre', region: 'S', stadium: 'Arena do Grêmio',
        voices: {
            stadium_entry: ['Arena tricolor. Imortal em casa.', 'Porto Alegre azul-preto-branca canta.'],
            goal_home: ['GREEEEEMIO! Tricolor gaúcho na lona!', 'Vamos, Imortal! Gol!'],
            goal_away: ['Grêmio silenciou rival.'],
            rival_match: ['Gre-Nal. Maior clássico do Sul. Sangue gaúcho.'],
        },
    },
    'Internacional': {
        city: 'Porto Alegre', region: 'S', stadium: 'Beira-Rio',
        voices: {
            stadium_entry: ['Beira-Rio colorado. Inter pisa a sagrada.', 'Gigante da gigante. Colorado vibra.'],
            goal_home: ['INTERRRR! Beira-Rio em festa colorada!', 'Manto sagrado do Inter. Gol!'],
            goal_away: ['Inter calou estádio adversário.'],
            rival_match: ['Gre-Nal! Sangue gaúcho na bola. Inter pra cima.'],
        },
    },
    'Athletico-PR': {
        city: 'Curitiba', region: 'S', stadium: 'Arena da Baixada',
        voices: {
            stadium_entry: ['Arena da Baixada. Furacão em campo.', 'Atlético paranaense recebe seu povo.'],
            goal_home: ['FURACÃOOO! Atlético-PR na lona!', 'Vamos, Furacão! Gol decisivo!'],
            goal_away: ['Atlético-PR silenciou casa visitada.'],
            rival_match: ['Atletiba. Clássico paranaense.'],
        },
    },
    // === NORDESTE ===
    'Bahia': {
        city: 'Salvador', region: 'NE', stadium: 'Itaipava Arena Fonte Nova',
        voices: {
            stadium_entry: ['Fonte Nova azul-vermelho-branca. Tricolor de aço.', 'Salvador canta o Bahêa.'],
            goal_home: ['BAHIAAA! Tricolor de aço em festa!', 'Esquadrão de Aço! Gol no Bahia!'],
            goal_away: ['Bahia silenciou adversário em casa.'],
            rival_match: ['Ba-Vi. Clássico baiano. Sangue na bola.'],
        },
    },
    'Sport': {
        city: 'Recife', region: 'NE', stadium: 'Ilha do Retiro',
        voices: {
            stadium_entry: ['Ilha do Retiro. Leão da Ilha em campo.', 'Sport Club Recife. Rubro-negro pernambucano.'],
            goal_home: ['SPOOORT! Leão da Ilha grita o gol!', 'Rubro-negro do Recife em festa!'],
            goal_away: ['Sport silenciou rival.'],
            rival_match: ['Clássico das Multidões. Sport x Santa Cruz. Pernambuco em peso.'],
        },
    },
    'Fortaleza': {
        city: 'Fortaleza', region: 'NE', stadium: 'Arena Castelão',
        voices: {
            stadium_entry: ['Castelão tricolor. Fortaleza em casa.', 'Leão do Pici recebe a torcida.'],
            goal_home: ['FORTALEEEZA! Tricolor cearense em festa!', 'Leão do Pici grita!'],
            goal_away: ['Fortaleza silenciou casa visitada.'],
            rival_match: ['Clássico-Rei. Fortaleza x Ceará. Cearense puro.'],
        },
    },
    'Ceará': {
        city: 'Fortaleza', region: 'NE', stadium: 'Castelão',
        voices: {
            stadium_entry: ['Castelão alvinegro. Vovô em campo.', 'Ceará Sporting Club. Manto preto-e-branco.'],
            goal_home: ['CEARÁ! Vozão grita o gol!', 'Alvinegro cearense em festa!'],
            goal_away: ['Ceará silenciou rival.'],
            rival_match: ['Clássico-Rei. Ceará x Fortaleza. Drama cearense.'],
        },
    },
    // === CENTRO-OESTE ===
    'Goiás': {
        city: 'Goiânia', region: 'CO', stadium: 'Hailé Pinheiro',
        voices: {
            stadium_entry: ['Hailé Pinheiro esmeraldino. Goiás em casa.', 'Verdão goiano em campo.'],
            goal_home: ['GOIÁAAS! Esmeraldino em festa!', 'Verdão goiano! Gol decisivo!'],
            goal_away: ['Goiás silenciou rival.'],
            rival_match: ['Clássico goiano. Goiás na briga.'],
        },
    },
    // === NORTE ===
    'Paysandu': {
        city: 'Belém', region: 'N', stadium: 'Curuzu',
        voices: {
            stadium_entry: ['Curuzu bicolor. Papão em casa.', 'Belém vibra com o Lusitano.'],
            goal_home: ['PAYSAAANDU! Papão grita o gol!', 'Bicolor paraense em festa!'],
            goal_away: ['Paysandu silenciou rival.'],
            rival_match: ['Re-Pa. Clássico paraense. Sangue do Norte.'],
        },
    },
    'Remo': {
        city: 'Belém', region: 'N', stadium: 'Mangueirão',
        voices: {
            stadium_entry: ['Mangueirão azulino. Leão do Norte em casa.', 'Remo. Tradição amazônica.'],
            goal_home: ['REEEMO! Leão do Norte ruge!', 'Azulino paraense em festa!'],
            goal_away: ['Remo silenciou casa visitada.'],
            rival_match: ['Re-Pa. Clássico amazônico. Norte em peso.'],
        },
    },
};

/**
 * Retorna voz contextual de um clube. Fallback genérico se clube não mapeado.
 *
 * @param {string} clubName
 * @param {string} contextType — 'stadium_entry'|'goal_home'|'goal_away'|'rival_match'
 * @param {number} seed
 * @returns {string} flavor string
 */
export function getClubVoice(clubName, contextType, seed = 0) {
    if (!clubName) return '';
    const club = ClubVoices[clubName];
    if (!club || !club.voices || !club.voices[contextType]) return '';
    const list = club.voices[contextType];
    if (!Array.isArray(list) || list.length === 0) return '';
    const idx = Math.abs(seed) % list.length;
    return list[idx];
}

/**
 * Retorna metadata do clube (city, region, stadium).
 */
export function getClubMeta(clubName) {
    if (!clubName) return null;
    const club = ClubVoices[clubName];
    if (!club) return null;
    return { city: club.city, region: club.region, stadium: club.stadium };
}

/**
 * Lista clubes mapeados.
 */
export function getMappedClubs() {
    return Object.keys(ClubVoices);
}
