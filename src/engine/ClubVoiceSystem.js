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
    'Vasco da Gama': {
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
    'Sport Recife': {
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

    // ============================================================
    // SÉRIE B — 20 clubes (AKITA-319 F3.1 expansion)
    // ============================================================
    'Ponte Preta': {
        city: 'Campinas', region: 'SE', stadium: 'Moisés Lucarelli',
        voices: {
            stadium_entry: ['Majestoso recebe a Macaca. Campinas em peso.', 'Ponte Preta no Majestoso.'],
            goal_home: ['PONTE PRETA! Macaca grita o gol!'],
            goal_away: ['Macaca calou rival fora de casa.'],
            rival_match: ['Dérbi Campineiro. Macaca x Bugre.'],
        },
    },
    'Guarani': {
        city: 'Campinas', region: 'SE', stadium: 'Brinco de Ouro',
        voices: {
            stadium_entry: ['Brinco de Ouro verde. Bugre em casa.', 'Guarani campineiro pisa a sagrada.'],
            goal_home: ['GUARANI! Bugre marca!'],
            goal_away: ['Guarani silenciou rival.'],
            rival_match: ['Dérbi Campineiro. Bugre x Macaca.'],
        },
    },
    'Juventude': {
        city: 'Caxias do Sul', region: 'S', stadium: 'Alfredo Jaconi',
        voices: {
            stadium_entry: ['Alfredo Jaconi verde-papai. Juventude da serra.', 'Caxias do Sul abraça seu papo.'],
            goal_home: ['JUVENTUDE! Papo grita o gol!'],
            goal_away: ['Juventude calou casa visitada.'],
            rival_match: ['Clássico Serrano. Juventude na briga.'],
        },
    },
    'Criciúma': {
        city: 'Criciúma', region: 'S', stadium: 'Heriberto Hülse',
        voices: {
            stadium_entry: ['Heriberto Hülse amarelo-preto. Tigre catarinense.', 'Criciúma em casa.'],
            goal_home: ['TIGRE! Criciúma grita o gol!'],
            goal_away: ['Tigre silenciou rival.'],
            rival_match: ['Clássico catarinense. Tigre pra cima.'],
        },
    },
    'Vila Nova': {
        city: 'Goiânia', region: 'CO', stadium: 'OBA',
        voices: {
            stadium_entry: ['OBA tigrado. Vila Nova em campo.', 'Goiânia recebe o Tigre do Cerrado.'],
            goal_home: ['VILA NOVA! Tigre goiano grita!'],
            goal_away: ['Vila Nova calou rival.'],
            rival_match: ['Clássico goiano. Vila Nova na briga.'],
        },
    },
    'Atlético-GO': {
        city: 'Goiânia', region: 'CO', stadium: 'Antônio Accioly',
        voices: {
            stadium_entry: ['Antônio Accioly rubro-negro. Dragão goiano.', 'Atlético-GO em casa.'],
            goal_home: ['DRAGÃO! Atlético-GO marca!'],
            goal_away: ['Atlético-GO silenciou casa visitada.'],
            rival_match: ['Clássico goiano. Dragão pra cima.'],
        },
    },
    'América-MG': {
        city: 'Belo Horizonte', region: 'SE', stadium: 'Independência',
        voices: {
            stadium_entry: ['Independência verde-branco. Coelho em casa.', 'América mineira pisa o gramado.'],
            goal_home: ['AMÉRICA! Coelho marca!'],
            goal_away: ['Coelho calou rival.'],
            rival_match: ['Clássico mineiro. Coelho pra cima.'],
        },
    },
    'Chapecoense': {
        city: 'Chapecó', region: 'S', stadium: 'Arena Condá',
        voices: {
            stadium_entry: ['Arena Condá verde. Chape em casa.', 'Chapecoense. Resiliência verde.'],
            goal_home: ['CHAPE! Verde-do-Oeste marca!'],
            goal_away: ['Chape silenciou rival.'],
            rival_match: ['Chape na briga. Sangue catarinense.'],
        },
    },
    'CRB': {
        city: 'Maceió', region: 'NE', stadium: 'Rei Pelé',
        voices: {
            stadium_entry: ['Rei Pelé. CRB em casa. Galo da Pajuçara.', 'Maceió alvirrubra.'],
            goal_home: ['CRB! Galo da Pajuçara grita o gol!'],
            goal_away: ['CRB calou rival.'],
            rival_match: ['Clássico das Multidões alagoano. CRB x CSA.'],
        },
    },
    'Novorizontino': {
        city: 'Novo Horizonte', region: 'SE', stadium: 'Jorge Ismael de Biasi',
        voices: {
            stadium_entry: ['Novorizontino em campo. Tigre do Vale.', 'Jorge Ismael de Biasi recebe o time.'],
            goal_home: ['NOVORIZONTINO! Tigre do Vale marca!'],
            goal_away: ['Novorizontino silenciou casa visitada.'],
            rival_match: ['Tigre do Vale. Briga interior paulista.'],
        },
    },
    'Mirassol': {
        city: 'Mirassol', region: 'SE', stadium: 'Maião',
        voices: {
            stadium_entry: ['Maião amarelo. Leão de Mirassol em casa.', 'Mirassol interiorano pisa o gramado.'],
            goal_home: ['MIRASSOL! Leão amarelo grita!'],
            goal_away: ['Mirassol calou rival.'],
            rival_match: ['Mirassol pra cima. Interior paulista.'],
        },
    },
    'Avaí': {
        city: 'Florianópolis', region: 'S', stadium: 'Ressacada',
        voices: {
            stadium_entry: ['Ressacada azul-branco. Leão da Ilha.', 'Florianópolis recebe seu Avaí.'],
            goal_home: ['AVAÍ! Leão da Ilha grita o gol!'],
            goal_away: ['Avaí silenciou rival.'],
            rival_match: ['Clássico catarinense. Avaí x Figueirense.'],
        },
    },
    // Paysandu + Remo já definidos na seção Norte acima (Série A).
    'Sampaio Corrêa': {
        city: 'São Luís', region: 'NE', stadium: 'Castelão (MA)',
        voices: {
            stadium_entry: ['Castelão maranhense. Tricolor de Aço de São Luís.', 'Sampaio Corrêa em casa.'],
            goal_home: ['SAMPAIO! Tricolor de Aço marca!'],
            goal_away: ['Sampaio calou rival.'],
            rival_match: ['Clássico maranhense. Sampaio x Moto.'],
        },
    },
    'Náutico': {
        city: 'Recife', region: 'NE', stadium: 'Aflitos',
        voices: {
            stadium_entry: ['Aflitos alvirrubro. Timbu pernambucano em casa.', 'Náutico no manto sagrado.'],
            goal_home: ['NÁUTICOOO! Timbu marca!'],
            goal_away: ['Náutico silenciou rival.'],
            rival_match: ['Clássico dos Clássicos. Náutico x Sport x Santa Cruz.'],
        },
    },
    'Tombense': {
        city: 'Tombos', region: 'SE', stadium: 'Almeidão',
        voices: {
            stadium_entry: ['Almeidão recebe o Tombense. Interior mineiro.', 'Tombos vibra com seu time.'],
            goal_home: ['TOMBENSE! Interior mineiro marca!'],
            goal_away: ['Tombense calou rival.'],
            rival_match: ['Tombense. Briga mineira de interior.'],
        },
    },
    'Ituano': {
        city: 'Itu', region: 'SE', stadium: 'Novelli Júnior',
        voices: {
            stadium_entry: ['Novelli Júnior preto-vermelho. Galo de Itu.', 'Ituano em casa.'],
            goal_home: ['ITUANO! Galo de Itu marca!'],
            goal_away: ['Ituano silenciou casa visitada.'],
            rival_match: ['Clássico interior. Ituano pra cima.'],
        },
    },
    'Botafogo-SP': {
        city: 'Ribeirão Preto', region: 'SE', stadium: 'Santa Cruz',
        voices: {
            stadium_entry: ['Santa Cruz ribeirão-pretano. Pantera ribeirão-pretana.', 'Botafogo-SP em casa.'],
            goal_home: ['BOTAFOGO-SP! Pantera marca!'],
            goal_away: ['Botafogo-SP calou rival.'],
            rival_match: ['Clássico paulista interior. Pantera pra cima.'],
        },
    },
    'Operário-PR': {
        city: 'Ponta Grossa', region: 'S', stadium: 'Germano Krüger',
        voices: {
            stadium_entry: ['Germano Krüger preto-branco. Fantasma paranaense.', 'Operário-PR em casa.'],
            goal_home: ['OPERÁRIO! Fantasma marca!'],
            goal_away: ['Operário-PR silenciou rival.'],
            rival_match: ['Clássico paranaense interior. Operário pra cima.'],
        },
    },

    // ============================================================
    // SÉRIE C — 24 clubes (regional flavor compact)
    // ============================================================
    'Figueirense': {
        city: 'Florianópolis', region: 'S', stadium: 'Orlando Scarpelli',
        voices: {
            stadium_entry: ['Orlando Scarpelli preto-branco. Figueira em casa.'],
            goal_home: ['FIGUEIRA! Furacão do Estreito marca!'],
            goal_away: ['Figueira silenciou rival.'],
            rival_match: ['Clássico catarinense. Figueira x Avaí.'],
        },
    },
    'CSA': {
        city: 'Maceió', region: 'NE', stadium: 'Rei Pelé',
        voices: {
            stadium_entry: ['Rei Pelé azul-branco. Azulão maceioense.'],
            goal_home: ['CSAAA! Azulão marca!'],
            goal_away: ['CSA calou rival.'],
            rival_match: ['Clássico das Multidões alagoano. CSA x CRB.'],
        },
    },
    'ABC': {
        city: 'Natal', region: 'NE', stadium: 'Frasqueirão',
        voices: {
            stadium_entry: ['Frasqueirão alvinegro. ABC potiguar em casa.'],
            goal_home: ['ABC! Mais Querido do Nordeste marca!'],
            goal_away: ['ABC silenciou rival.'],
            rival_match: ['Clássico potiguar. ABC x América-RN.'],
        },
    },
    'Londrina': {
        city: 'Londrina', region: 'S', stadium: 'Estádio do Café',
        voices: {
            stadium_entry: ['Estádio do Café azul-branco. Tubarão paranaense.'],
            goal_home: ['LONDRINA! Tubarão marca!'],
            goal_away: ['Londrina calou rival.'],
            rival_match: ['Clássico paranaense norte. Londrina pra cima.'],
        },
    },
    'Volta Redonda': {
        city: 'Volta Redonda', region: 'SE', stadium: 'Raulino de Oliveira',
        voices: {
            stadium_entry: ['Raulino de Oliveira preto-branco-amarelo. Voltaço em casa.'],
            goal_home: ['VOLTA REDONDA! Voltaço marca!'],
            goal_away: ['Voltaço silenciou rival.'],
            rival_match: ['Voltaço fluminense interior. Briga regional.'],
        },
    },
    'Amazonas': {
        city: 'Manaus', region: 'N', stadium: 'Arena Amazônia',
        voices: {
            stadium_entry: ['Arena Amazônia. Amazonas em casa. Calor de 40 graus.'],
            goal_home: ['AMAZONAS! Onça marca! Selva ruge!'],
            goal_away: ['Amazonas silenciou rival.'],
            rival_match: ['Clássico amazônico.'],
        },
    },
    'Brusque': {
        city: 'Brusque', region: 'S', stadium: 'Augusto Bauer',
        voices: {
            stadium_entry: ['Augusto Bauer quadricolor. Brusque em casa.'],
            goal_home: ['BRUSQUE! Quadricolor catarinense marca!'],
            goal_away: ['Brusque calou rival.'],
            rival_match: ['Clássico catarinense interior. Brusque pra cima.'],
        },
    },
    'São Bernardo': {
        city: 'São Bernardo do Campo', region: 'SE', stadium: '1º de Maio',
        voices: {
            stadium_entry: ['1º de Maio amarelo-preto. Tigre do ABC.'],
            goal_home: ['SÃO BERNARDO! Tigre do ABC marca!'],
            goal_away: ['São Bernardo silenciou rival.'],
            rival_match: ['Clássico do ABC. Briga paulista.'],
        },
    },
    'Aparecidense': {
        city: 'Aparecida de Goiânia', region: 'CO', stadium: 'Aníbal Batista de Toledo',
        voices: {
            stadium_entry: ['Aníbal Batista verde-amarelo. Camaleão goiano.'],
            goal_home: ['APARECIDENSE! Camaleão marca!'],
            goal_away: ['Aparecidense calou rival.'],
            rival_match: ['Briga goiana interior.'],
        },
    },
    'Ypiranga': {
        city: 'Erechim', region: 'S', stadium: 'Colosso da Lagoa',
        voices: {
            stadium_entry: ['Colosso da Lagoa azul-amarelo. Ypiranga gaúcho.'],
            goal_home: ['YPIRANGA! Canarinho gaúcho marca!'],
            goal_away: ['Ypiranga silenciou rival.'],
            rival_match: ['Clássico gaúcho interior.'],
        },
    },
    'Confiança': {
        city: 'Aracaju', region: 'NE', stadium: 'Batistão',
        voices: {
            stadium_entry: ['Batistão azul-vermelho. Dragão sergipano.'],
            goal_home: ['CONFIANÇA! Dragão sergipano marca!'],
            goal_away: ['Confiança calou rival.'],
            rival_match: ['Clássico sergipano. Confiança pra cima.'],
        },
    },
    'Botafogo-PB': {
        city: 'João Pessoa', region: 'NE', stadium: 'Almeidão',
        voices: {
            stadium_entry: ['Almeidão preto-branco. Belo paraibano.'],
            goal_home: ['BOTAFOGO-PB! Belo marca!'],
            goal_away: ['Botafogo-PB silenciou rival.'],
            rival_match: ['Clássico paraibano. Belo x Treze.'],
        },
    },
    'Floresta': {
        city: 'Fortaleza', region: 'NE', stadium: 'Domingão',
        voices: {
            stadium_entry: ['Domingão verde-amarelo. Floresta cearense.'],
            goal_home: ['FLORESTA! Verde marca!'],
            goal_away: ['Floresta calou rival.'],
            rival_match: ['Clássico cearense interior.'],
        },
    },
    'São José-RS': {
        city: 'Porto Alegre', region: 'S', stadium: 'Passo D\'Areia',
        voices: {
            stadium_entry: ['Passo D\'Areia azul. São José gaúcho.'],
            goal_home: ['SÃO JOSÉ! Zequinha marca!'],
            goal_away: ['São José silenciou rival.'],
            rival_match: ['Clássico gaúcho. Briga regional.'],
        },
    },
    'Altos': {
        city: 'Altos', region: 'NE', stadium: 'Helvídio Nunes',
        voices: {
            stadium_entry: ['Helvídio Nunes amarelo-azul. Altos piauiense.'],
            goal_home: ['ALTOS! Jacaré piauiense marca!'],
            goal_away: ['Altos calou rival.'],
            rival_match: ['Briga piauiense.'],
        },
    },
    'Manaus': {
        city: 'Manaus', region: 'N', stadium: 'Carlos Zamith',
        voices: {
            stadium_entry: ['Carlos Zamith verde. Manaus FC. Amazônia em peso.'],
            goal_home: ['MANAUS! Verde marca! Onça pintada ruge!'],
            goal_away: ['Manaus silenciou rival.'],
            rival_match: ['Clássico amazônico. Manaus pra cima.'],
        },
    },
    'Ferroviário': {
        city: 'Fortaleza', region: 'NE', stadium: 'Elzir Cabral',
        voices: {
            stadium_entry: ['Elzir Cabral tricolor. Tubarão da Barra.'],
            goal_home: ['FERROVIÁRIO! Tubarão cearense marca!'],
            goal_away: ['Ferroviário calou rival.'],
            rival_match: ['Clássico cearense interior.'],
        },
    },
    'Caxias': {
        city: 'Caxias do Sul', region: 'S', stadium: 'Centenário',
        voices: {
            stadium_entry: ['Centenário grená. Caxias da serra.'],
            goal_home: ['CAXIAS! Grená marca!'],
            goal_away: ['Caxias silenciou rival.'],
            rival_match: ['Clássico serrano gaúcho.'],
        },
    },
    'Athletic Club': {
        city: 'São João del-Rei', region: 'SE', stadium: 'Joaquim Portugal',
        voices: {
            stadium_entry: ['Joaquim Portugal verde. Athletic mineiro.'],
            goal_home: ['ATHLETIC! Esquadrão marca!'],
            goal_away: ['Athletic calou rival.'],
            rival_match: ['Briga mineira interior.'],
        },
    },
    'Ferroviária': {
        city: 'Araraquara', region: 'SE', stadium: 'Fonte Luminosa',
        voices: {
            stadium_entry: ['Fonte Luminosa grená. Ferroviária araraquarense.'],
            goal_home: ['FERROVIÁRIA! Locomotiva marca!'],
            goal_away: ['Ferroviária silenciou rival.'],
            rival_match: ['Clássico interior paulista.'],
        },
    },
    'Pouso Alegre': {
        city: 'Pouso Alegre', region: 'SE', stadium: 'Manduzão',
        voices: {
            stadium_entry: ['Manduzão verde. Pouso Alegre sul-mineiro.'],
            goal_home: ['POUSO ALEGRE! Verde sul-mineiro marca!'],
            goal_away: ['Pouso Alegre calou rival.'],
            rival_match: ['Briga sul-mineira.'],
        },
    },
    'Villa Nova-MG': {
        city: 'Nova Lima', region: 'SE', stadium: 'Castor Cifuentes',
        voices: {
            stadium_entry: ['Castor Cifuentes preto-vermelho. Leão do Bonfim.'],
            goal_home: ['VILLA NOVA! Leão do Bonfim marca!'],
            goal_away: ['Villa Nova silenciou rival.'],
            rival_match: ['Tradição mineira centenária.'],
        },
    },
    'Brasil de Pelotas': {
        city: 'Pelotas', region: 'S', stadium: 'Bento Freitas',
        voices: {
            stadium_entry: ['Bento Freitas amarelo-preto. Xavante pelotense.'],
            goal_home: ['BRASIL! Xavante marca!'],
            goal_away: ['Brasil de Pelotas calou rival.'],
            rival_match: ['Clássico pelotense. Brasil x Pelotas.'],
        },
    },
    'Esportivo': {
        city: 'Bento Gonçalves', region: 'S', stadium: 'Montanha dos Vinhedos',
        voices: {
            stadium_entry: ['Montanha dos Vinhedos verde. Esportivo da serra.'],
            goal_home: ['ESPORTIVO! Verde gaúcho marca!'],
            goal_away: ['Esportivo silenciou rival.'],
            rival_match: ['Briga serrana gaúcha.'],
        },
    },

    // ============================================================
    // SÉRIE D — 24 clubes (regional flavor compact)
    // ============================================================
    'Santa Cruz': {
        city: 'Recife', region: 'NE', stadium: 'Arruda',
        voices: {
            stadium_entry: ['Arruda tricolor. Cobra Coral em casa.'],
            goal_home: ['SANTA! Tricolor do Arruda marca!'],
            goal_away: ['Santa Cruz calou rival.'],
            rival_match: ['Clássico das Multidões. Santa x Sport x Náutico.'],
        },
    },
    'Paraná Clube': {
        city: 'Curitiba', region: 'S', stadium: 'Vila Capanema',
        voices: {
            stadium_entry: ['Vila Capanema azul-vermelho-branco. Tricolor paranaense.'],
            goal_home: ['PARANÁ! Tricolor marca!'],
            goal_away: ['Paraná Clube silenciou rival.'],
            rival_match: ['Briga paranaense.'],
        },
    },
    'América-RN': {
        city: 'Natal', region: 'NE', stadium: 'Arena das Dunas',
        voices: {
            stadium_entry: ['Arena das Dunas vermelha. América potiguar.'],
            goal_home: ['AMÉRICA-RN! Vermelhinho potiguar marca!'],
            goal_away: ['América-RN calou rival.'],
            rival_match: ['Clássico potiguar. América x ABC.'],
        },
    },
    'Campinense': {
        city: 'Campina Grande', region: 'NE', stadium: 'Amigão',
        voices: {
            stadium_entry: ['Amigão preto-vermelho-branco. Raposa paraibana.'],
            goal_home: ['CAMPINENSE! Raposa marca!'],
            goal_away: ['Campinense silenciou rival.'],
            rival_match: ['Clássico paraibano. Campinense x Treze.'],
        },
    },
    'Treze': {
        city: 'Campina Grande', region: 'NE', stadium: 'Presidente Vargas',
        voices: {
            stadium_entry: ['Presidente Vargas alvinegro. Galo da Borborema.'],
            goal_home: ['TREZE! Galo da Borborema marca!'],
            goal_away: ['Treze calou rival.'],
            rival_match: ['Clássico paraibano. Treze x Campinense.'],
        },
    },
    'Caldense': {
        city: 'Poços de Caldas', region: 'SE', stadium: 'Ronaldão',
        voices: {
            stadium_entry: ['Ronaldão preto-verde. Caldense sul-mineira.'],
            goal_home: ['CALDENSE! Veterana sul-mineira marca!'],
            goal_away: ['Caldense silenciou rival.'],
            rival_match: ['Briga sul-mineira.'],
        },
    },
    'Sergipe': {
        city: 'Aracaju', region: 'NE', stadium: 'Batistão',
        voices: {
            stadium_entry: ['Batistão azul. Gigante sergipano.'],
            goal_home: ['SERGIPE! Gigante marca!'],
            goal_away: ['Sergipe calou rival.'],
            rival_match: ['Clássico sergipano.'],
        },
    },
    'Brasiliense': {
        city: 'Taguatinga', region: 'CO', stadium: 'Boca do Jacaré',
        voices: {
            stadium_entry: ['Boca do Jacaré amarelo. Jacaré candango.'],
            goal_home: ['BRASILIENSE! Jacaré marca!'],
            goal_away: ['Brasiliense silenciou rival.'],
            rival_match: ['Clássico candango.'],
        },
    },
    'Bangu': {
        city: 'Rio de Janeiro', region: 'SE', stadium: 'Moça Bonita',
        voices: {
            stadium_entry: ['Moça Bonita branco-vermelho. Castor de Bangu.'],
            goal_home: ['BANGU! Castor carioca marca!'],
            goal_away: ['Bangu calou rival.'],
            rival_match: ['Briga carioca subúrbio.'],
        },
    },
    'Moto Club': {
        city: 'São Luís', region: 'NE', stadium: 'Castelão (MA)',
        voices: {
            stadium_entry: ['Castelão maranhense. Moto Club. Papão maranhense.'],
            goal_home: ['MOTO! Papão maranhense marca!'],
            goal_away: ['Moto silenciou rival.'],
            rival_match: ['Clássico maranhense. Moto x Sampaio.'],
        },
    },
    'Nacional-AM': {
        city: 'Manaus', region: 'N', stadium: 'Carlos Zamith',
        voices: {
            stadium_entry: ['Carlos Zamith preto-branco. Naça amazonense.'],
            goal_home: ['NACIONAL! Naça marca! Selva ruge!'],
            goal_away: ['Nacional-AM calou rival.'],
            rival_match: ['Clássico amazônico.'],
        },
    },
    'Rio Branco-ES': {
        city: 'Cariacica', region: 'SE', stadium: 'Kleber Andrade',
        voices: {
            stadium_entry: ['Kleber Andrade capixaba. Rio Branco do Espírito Santo.'],
            goal_home: ['RIO BRANCO! Capixaba marca!'],
            goal_away: ['Rio Branco-ES silenciou rival.'],
            rival_match: ['Clássico capixaba.'],
        },
    },
    'Anápolis': {
        city: 'Anápolis', region: 'CO', stadium: 'Jonas Duarte',
        voices: {
            stadium_entry: ['Jonas Duarte verde-branco. Galo do Daia.'],
            goal_home: ['ANÁPOLIS! Galo do Daia marca!'],
            goal_away: ['Anápolis calou rival.'],
            rival_match: ['Clássico goiano interior.'],
        },
    },
    'Nova Iguaçu': {
        city: 'Nova Iguaçu', region: 'SE', stadium: 'Laranjão',
        voices: {
            stadium_entry: ['Laranjão laranja. Carrasco da Baixada.'],
            goal_home: ['NOVA IGUAÇU! Carrasco marca!'],
            goal_away: ['Nova Iguaçu silenciou rival.'],
            rival_match: ['Clássico Baixada Fluminense.'],
        },
    },
    'Cianorte': {
        city: 'Cianorte', region: 'S', stadium: 'Albino Turbay',
        voices: {
            stadium_entry: ['Albino Turbay azul. Leão do Vale do Ivaí.'],
            goal_home: ['CIANORTE! Leão paranaense marca!'],
            goal_away: ['Cianorte calou rival.'],
            rival_match: ['Briga paranaense interior.'],
        },
    },
    'Inter de Limeira': {
        city: 'Limeira', region: 'SE', stadium: 'Limeirão',
        voices: {
            stadium_entry: ['Limeirão preto-branco-vermelho. Leão de Limeira.'],
            goal_home: ['LIMEIRA! Leão paulista marca!'],
            goal_away: ['Inter de Limeira silenciou rival.'],
            rival_match: ['Clássico interior paulista.'],
        },
    },
    'Portuguesa-RJ': {
        city: 'Rio de Janeiro', region: 'SE', stadium: 'Luso-Brasileiro',
        voices: {
            stadium_entry: ['Luso-Brasileiro verde-vermelho. Lusa carioca.'],
            goal_home: ['PORTUGUESA-RJ! Lusa carioca marca!'],
            goal_away: ['Portuguesa-RJ calou rival.'],
            rival_match: ['Briga carioca histórica.'],
        },
    },
    'Retrô': {
        city: 'Camaragibe', region: 'NE', stadium: 'Arena Pernambuco',
        voices: {
            stadium_entry: ['Arena Pernambuco vermelha. Phoenix pernambucano.'],
            goal_home: ['RETRÔ! Phoenix marca!'],
            goal_away: ['Retrô silenciou rival.'],
            rival_match: ['Briga pernambucana.'],
        },
    },
    'Iguatu': {
        city: 'Iguatu', region: 'NE', stadium: 'Morenão',
        voices: {
            stadium_entry: ['Morenão azul. Azulão do Centro-Sul cearense.'],
            goal_home: ['IGUATU! Azulão cearense marca!'],
            goal_away: ['Iguatu calou rival.'],
            rival_match: ['Briga cearense interior.'],
        },
    },
    'Sousa': {
        city: 'Sousa', region: 'NE', stadium: 'Marizão',
        voices: {
            stadium_entry: ['Marizão branco-amarelo. Dinossauro do Sertão.'],
            goal_home: ['SOUSA! Dinossauro do Sertão marca!'],
            goal_away: ['Sousa silenciou rival.'],
            rival_match: ['Briga paraibana sertão.'],
        },
    },
    'Uberlândia': {
        city: 'Uberlândia', region: 'SE', stadium: 'Parque do Sabiá',
        voices: {
            stadium_entry: ['Parque do Sabiá verde-amarelo. Verdão do Triângulo.'],
            goal_home: ['UBERLÂNDIA! Verdão do Triângulo marca!'],
            goal_away: ['Uberlândia calou rival.'],
            rival_match: ['Clássico triangulino. Verdão pra cima.'],
        },
    },
    'Democrata-GV': {
        city: 'Governador Valadares', region: 'SE', stadium: 'Mamudão',
        voices: {
            stadium_entry: ['Mamudão verde-branco. Pantera valadarense.'],
            goal_home: ['DEMOCRATA! Pantera marca!'],
            goal_away: ['Democrata-GV silenciou rival.'],
            rival_match: ['Briga mineira leste.'],
        },
    },
    'Pelotas': {
        city: 'Pelotas', region: 'S', stadium: 'Boca do Lobo',
        voices: {
            stadium_entry: ['Boca do Lobo preto-amarelo. Lobo pelotense.'],
            goal_home: ['PELOTAS! Lobo marca!'],
            goal_away: ['Pelotas calou rival.'],
            rival_match: ['Clássico pelotense. Pelotas x Brasil.'],
        },
    },
    'Veranópolis': {
        city: 'Veranópolis', region: 'S', stadium: 'Antônio Davi Farina',
        voices: {
            stadium_entry: ['Antônio Davi Farina verde-amarelo. Verão da serra.'],
            goal_home: ['VERANÓPOLIS! Verão marca!'],
            goal_away: ['Veranópolis silenciou rival.'],
            rival_match: ['Briga serrana gaúcha.'],
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
