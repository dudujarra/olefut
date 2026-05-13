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

    // ============================================================
    // INGLATERRA — 10 clubes (AKITA-321 F3.1 internacional)
    // ============================================================
    'Manchester City': {
        city: 'Manchester', region: 'ENG', stadium: 'Etihad',
        voices: {
            stadium_entry: ['Etihad celeste. Sky Blues em casa.'],
            goal_home: ['CITYYY! Etihad em festa azul!'],
            goal_away: ['City silenciou rival.'],
            rival_match: ['Derby de Manchester. City x United.'],
        },
    },
    'Arsenal': {
        city: 'Londres', region: 'ENG', stadium: 'Emirates',
        voices: {
            stadium_entry: ['Emirates vermelho. Gunners em casa.'],
            goal_home: ['ARSENAL! Norte de Londres ruge!'],
            goal_away: ['Arsenal calou rival.'],
            rival_match: ['Derby do Norte de Londres. Arsenal x Tottenham.'],
        },
    },
    'Liverpool': {
        city: 'Liverpool', region: 'ENG', stadium: 'Anfield',
        voices: {
            stadium_entry: ['Anfield vermelho. You\'ll Never Walk Alone ecoa.'],
            goal_home: ['LIVERPOOL! The Kop explode!'],
            goal_away: ['Reds silenciaram rival.'],
            rival_match: ['North West Derby. Liverpool x United.'],
        },
    },
    'Manchester United': {
        city: 'Manchester', region: 'ENG', stadium: 'Old Trafford',
        voices: {
            stadium_entry: ['Old Trafford vermelho. Theatre of Dreams.'],
            goal_home: ['UNITED! Devils marcam!'],
            goal_away: ['United calou rival.'],
            rival_match: ['Derby de Manchester. Vermelho x Azul.'],
        },
    },
    'Chelsea': {
        city: 'Londres', region: 'ENG', stadium: 'Stamford Bridge',
        voices: {
            stadium_entry: ['Stamford Bridge azul. Blues em casa.'],
            goal_home: ['CHELSEA! Pensioners marcam!'],
            goal_away: ['Chelsea silenciou rival.'],
            rival_match: ['Derby de Londres Oeste.'],
        },
    },
    'Tottenham': {
        city: 'Londres', region: 'ENG', stadium: 'Tottenham Hotspur Stadium',
        voices: {
            stadium_entry: ['New White Hart Lane branco-navy. Spurs em casa.'],
            goal_home: ['SPURS! Lilywhites marcam!'],
            goal_away: ['Tottenham calou rival.'],
            rival_match: ['North London Derby. Spurs x Arsenal.'],
        },
    },
    'Newcastle': {
        city: 'Newcastle', region: 'ENG', stadium: 'St James\' Park',
        voices: {
            stadium_entry: ['St James\' Park preto-branco. Magpies em casa.'],
            goal_home: ['NEWCASTLE! Toon Army ruge!'],
            goal_away: ['Magpies silenciaram rival.'],
            rival_match: ['Tyne-Wear Derby.'],
        },
    },
    'Aston Villa': {
        city: 'Birmingham', region: 'ENG', stadium: 'Villa Park',
        voices: {
            stadium_entry: ['Villa Park vinho-azul. Villans em casa.'],
            goal_home: ['VILLA! Birmingham vibra!'],
            goal_away: ['Villa calou rival.'],
            rival_match: ['Second City Derby.'],
        },
    },
    'West Ham': {
        city: 'Londres', region: 'ENG', stadium: 'London Stadium',
        voices: {
            stadium_entry: ['London Stadium claret-azul. Hammers em casa.'],
            goal_home: ['WEST HAM! I\'m Forever Blowing Bubbles!'],
            goal_away: ['Hammers silenciaram rival.'],
            rival_match: ['Derby de Londres Leste.'],
        },
    },
    'Brighton': {
        city: 'Brighton', region: 'ENG', stadium: 'Amex',
        voices: {
            stadium_entry: ['Amex Stadium azul-branco. Seagulls em casa.'],
            goal_home: ['SEAGULLS! Brighton marca!'],
            goal_away: ['Brighton calou rival.'],
            rival_match: ['M23 Derby. Brighton x Crystal Palace.'],
        },
    },

    // ============================================================
    // ESPANHA — 10 clubes
    // ============================================================
    'Real Madrid': {
        city: 'Madrid', region: 'ESP', stadium: 'Santiago Bernabéu',
        voices: {
            stadium_entry: ['Bernabéu branco. Hala Madrid ecoa.'],
            goal_home: ['MADRIIID! Merengues marcam!'],
            goal_away: ['Real silenciou rival.'],
            rival_match: ['El Clásico. Real x Barça. História.'],
        },
    },
    'Barcelona': {
        city: 'Barcelona', region: 'ESP', stadium: 'Spotify Camp Nou',
        voices: {
            stadium_entry: ['Camp Nou blaugrana. Més que un club.'],
            goal_home: ['BARÇA! Catalunya vibra!'],
            goal_away: ['Blaugrana silenciaram rival.'],
            rival_match: ['El Clásico. Barça x Real. Eternidade.'],
        },
    },
    'Atlético de Madrid': {
        city: 'Madrid', region: 'ESP', stadium: 'Metropolitano',
        voices: {
            stadium_entry: ['Metropolitano rojiblanco. Colchoneros em casa.'],
            goal_home: ['ATLETI! Vamos Atleti!'],
            goal_away: ['Atlético calou rival.'],
            rival_match: ['Derby Madrileño. Atleti x Real.'],
        },
    },
    'Sevilla': {
        city: 'Sevilha', region: 'ESP', stadium: 'Sánchez-Pizjuán',
        voices: {
            stadium_entry: ['Sánchez-Pizjuán rojiblanco. Andaluzes em casa.'],
            goal_home: ['SEVILLA! Andaluzia vibra!'],
            goal_away: ['Sevilla silenciou rival.'],
            rival_match: ['Derby Sevillano. Sevilla x Betis.'],
        },
    },
    'Real Sociedad': {
        city: 'San Sebastián', region: 'ESP', stadium: 'Anoeta',
        voices: {
            stadium_entry: ['Anoeta txuri-urdin. Basque pride.'],
            goal_home: ['LA REAL! Donostia vibra!'],
            goal_away: ['Real Sociedad calou rival.'],
            rival_match: ['Derby Basco. Real x Athletic.'],
        },
    },
    'Real Betis': {
        city: 'Sevilha', region: 'ESP', stadium: 'Benito Villamarín',
        voices: {
            stadium_entry: ['Benito Villamarín verde-branco. Manque pierda.'],
            goal_home: ['BETIS! Verdiblancos marcam!'],
            goal_away: ['Bético silenciou rival.'],
            rival_match: ['Derby Sevillano. Betis x Sevilla.'],
        },
    },
    'Villarreal': {
        city: 'Villarreal', region: 'ESP', stadium: 'La Cerámica',
        voices: {
            stadium_entry: ['La Cerámica amarelo. Yellow Submarine.'],
            goal_home: ['VILLARREAL! Submarino Amarelo marca!'],
            goal_away: ['Villarreal calou rival.'],
            rival_match: ['Derby Valenciano.'],
        },
    },
    'Athletic Bilbao': {
        city: 'Bilbao', region: 'ESP', stadium: 'San Mamés',
        voices: {
            stadium_entry: ['San Mamés rojiblanco. Solo bascos.'],
            goal_home: ['ATHLETIC! Leones marcam!'],
            goal_away: ['Athletic silenciou rival.'],
            rival_match: ['Derby Basco. Athletic x Real Sociedad.'],
        },
    },
    'Valencia': {
        city: 'Valência', region: 'ESP', stadium: 'Mestalla',
        voices: {
            stadium_entry: ['Mestalla branco-laranja. Che!'],
            goal_home: ['VALENCIA! Murciélagos marcam!'],
            goal_away: ['Valencia calou rival.'],
            rival_match: ['Derby Valenciano.'],
        },
    },
    'Osasuna': {
        city: 'Pamplona', region: 'ESP', stadium: 'El Sadar',
        voices: {
            stadium_entry: ['El Sadar rojillo. Navarrese pride.'],
            goal_home: ['OSASUNA! Pamplona vibra!'],
            goal_away: ['Osasuna silenciou rival.'],
            rival_match: ['Briga navarra.'],
        },
    },

    // ============================================================
    // ITÁLIA — 10 clubes
    // ============================================================
    'Inter de Milão': {
        city: 'Milão', region: 'ITA', stadium: 'San Siro',
        voices: {
            stadium_entry: ['San Siro nerazzurro. Forza Inter.'],
            goal_home: ['INTER! Pazza Inter Amala!'],
            goal_away: ['Inter calou rival.'],
            rival_match: ['Derby della Madonnina. Inter x Milan.'],
        },
    },
    'Milan': {
        city: 'Milão', region: 'ITA', stadium: 'San Siro',
        voices: {
            stadium_entry: ['San Siro rossonero. Forza Milan.'],
            goal_home: ['MILAN! Rossoneri marcam!'],
            goal_away: ['Milan silenciou rival.'],
            rival_match: ['Derby della Madonnina.'],
        },
    },
    'Juventus': {
        city: 'Turim', region: 'ITA', stadium: 'Allianz Stadium',
        voices: {
            stadium_entry: ['Allianz Stadium bianconero. La Vecchia Signora.'],
            goal_home: ['JUVE! Bianconeri marcam!'],
            goal_away: ['Juventus calou rival.'],
            rival_match: ['Derby d\'Italia. Juve x Inter.'],
        },
    },
    'Napoli': {
        city: 'Nápoles', region: 'ITA', stadium: 'Diego Maradona',
        voices: {
            stadium_entry: ['Diego Maradona azzurro. Napoli em casa.'],
            goal_home: ['NAPOOOLI! Maradona vive!'],
            goal_away: ['Napoli silenciou rival.'],
            rival_match: ['Derby del Sole.'],
        },
    },
    'Roma': {
        city: 'Roma', region: 'ITA', stadium: 'Olimpico',
        voices: {
            stadium_entry: ['Olimpico giallorosso. Forza Roma.'],
            goal_home: ['ROMA! Giallorossi marcam!'],
            goal_away: ['Roma calou rival.'],
            rival_match: ['Derby della Capitale.'],
        },
    },
    'Lazio': {
        city: 'Roma', region: 'ITA', stadium: 'Olimpico',
        voices: {
            stadium_entry: ['Olimpico biancoceleste. Aquile em casa.'],
            goal_home: ['LAZIO! Águias marcam!'],
            goal_away: ['Lazio silenciou rival.'],
            rival_match: ['Derby della Capitale.'],
        },
    },
    'Atalanta': {
        city: 'Bérgamo', region: 'ITA', stadium: 'Gewiss Stadium',
        voices: {
            stadium_entry: ['Gewiss nerazzurro. Dea de Bergamo.'],
            goal_home: ['ATALANTA! Dea marca!'],
            goal_away: ['Atalanta calou rival.'],
            rival_match: ['Derby lombardo.'],
        },
    },
    'Fiorentina': {
        city: 'Florença', region: 'ITA', stadium: 'Artemio Franchi',
        voices: {
            stadium_entry: ['Artemio Franchi viola. Forza Viola.'],
            goal_home: ['FIORENTINA! Viola marcam!'],
            goal_away: ['Viola silenciaram rival.'],
            rival_match: ['Derby toscano.'],
        },
    },
    'Bologna': {
        city: 'Bolonha', region: 'ITA', stadium: 'Renato Dall\'Ara',
        voices: {
            stadium_entry: ['Renato Dall\'Ara rossoblu. Felsina em casa.'],
            goal_home: ['BOLOGNA! Rossoblu marcam!'],
            goal_away: ['Bologna calou rival.'],
            rival_match: ['Briga emiliana.'],
        },
    },
    'Torino': {
        city: 'Turim', region: 'ITA', stadium: 'Olimpico Grande Torino',
        voices: {
            stadium_entry: ['Grande Torino granata. Toro em casa.'],
            goal_home: ['TORO! Granata marcam!'],
            goal_away: ['Torino silenciou rival.'],
            rival_match: ['Derby della Mole. Toro x Juve.'],
        },
    },

    // ============================================================
    // ALEMANHA — 10 clubes
    // ============================================================
    'Bayern de Munique': {
        city: 'Munique', region: 'GER', stadium: 'Allianz Arena',
        voices: {
            stadium_entry: ['Allianz Arena vermelha. Mia san mia.'],
            goal_home: ['BAYERN! Rekordmeister marca!'],
            goal_away: ['Bayern calou rival.'],
            rival_match: ['Der Klassiker. Bayern x Dortmund.'],
        },
    },
    'Borussia Dortmund': {
        city: 'Dortmund', region: 'GER', stadium: 'Signal Iduna Park',
        voices: {
            stadium_entry: ['Yellow Wall ruge. Echte Liebe.'],
            goal_home: ['BVB! Muralha Amarela explode!'],
            goal_away: ['Dortmund silenciou rival.'],
            rival_match: ['Revierderby. BVB x Schalke.'],
        },
    },
    'RB Leipzig': {
        city: 'Leipzig', region: 'GER', stadium: 'Red Bull Arena',
        voices: {
            stadium_entry: ['Red Bull Arena vermelha. Die Roten Bullen.'],
            goal_home: ['LEIPZIG! Touros marcam!'],
            goal_away: ['Leipzig calou rival.'],
            rival_match: ['Briga saxônica.'],
        },
    },
    'Bayer Leverkusen': {
        city: 'Leverkusen', region: 'GER', stadium: 'BayArena',
        voices: {
            stadium_entry: ['BayArena vermelha-preta. Werkself.'],
            goal_home: ['LEVERKUSEN! Bayer marca!'],
            goal_away: ['Leverkusen silenciou rival.'],
            rival_match: ['Briga renana.'],
        },
    },
    'Eintracht Frankfurt': {
        city: 'Frankfurt', region: 'GER', stadium: 'Deutsche Bank Park',
        voices: {
            stadium_entry: ['Deutsche Bank Park preto-vermelho. Adler em casa.'],
            goal_home: ['EINTRACHT! Águias de Frankfurt marcam!'],
            goal_away: ['Eintracht calou rival.'],
            rival_match: ['Briga hessiana.'],
        },
    },
    'Wolfsburg': {
        city: 'Wolfsburg', region: 'GER', stadium: 'Volkswagen Arena',
        voices: {
            stadium_entry: ['Volkswagen Arena verde. Lobos em casa.'],
            goal_home: ['WOLFSBURG! Wölfe marcam!'],
            goal_away: ['Wolfsburg silenciou rival.'],
            rival_match: ['Briga da Baixa Saxônia.'],
        },
    },
    'Borussia M\'gladbach': {
        city: 'Mönchengladbach', region: 'GER', stadium: 'Borussia-Park',
        voices: {
            stadium_entry: ['Borussia-Park branco-verde-preto. Fohlenelf.'],
            goal_home: ['BORUSSIA! Potros marcam!'],
            goal_away: ['Gladbach calou rival.'],
            rival_match: ['Briga renana.'],
        },
    },
    'Freiburg': {
        city: 'Freiburg', region: 'GER', stadium: 'Europa-Park Stadion',
        voices: {
            stadium_entry: ['Europa-Park Stadion vermelho-branco. Breisgau-Brasilianer.'],
            goal_home: ['FREIBURG! SC marca!'],
            goal_away: ['Freiburg silenciou rival.'],
            rival_match: ['Briga do sul.'],
        },
    },
    'Hoffenheim': {
        city: 'Sinsheim', region: 'GER', stadium: 'PreZero Arena',
        voices: {
            stadium_entry: ['PreZero Arena azul. TSG em casa.'],
            goal_home: ['HOFFENHEIM! TSG marca!'],
            goal_away: ['Hoffenheim calou rival.'],
            rival_match: ['Briga de Baden-Württemberg.'],
        },
    },
    'Stuttgart': {
        city: 'Stuttgart', region: 'GER', stadium: 'MHPArena',
        voices: {
            stadium_entry: ['MHPArena vermelha-branca. Schwaben em casa.'],
            goal_home: ['STUTTGART! Schwaben marcam!'],
            goal_away: ['Stuttgart silenciou rival.'],
            rival_match: ['Derby do Sul.'],
        },
    },

    // ============================================================
    // FRANÇA — 10 clubes
    // ============================================================
    'Paris Saint-Germain': {
        city: 'Paris', region: 'FRA', stadium: 'Parc des Princes',
        voices: {
            stadium_entry: ['Parc des Princes azul-vermelho. Ici c\'est Paris.'],
            goal_home: ['PSG! Allez Paris!'],
            goal_away: ['PSG calou rival.'],
            rival_match: ['Le Classique. PSG x Marseille.'],
        },
    },
    'Marseille': {
        city: 'Marselha', region: 'FRA', stadium: 'Stade Vélodrome',
        voices: {
            stadium_entry: ['Vélodrome azul-branco. Droit au but.'],
            goal_home: ['OM! Marseille vibra!'],
            goal_away: ['OM silenciou rival.'],
            rival_match: ['Le Classique. OM x PSG.'],
        },
    },
    'Lyon': {
        city: 'Lyon', region: 'FRA', stadium: 'Groupama Stadium',
        voices: {
            stadium_entry: ['Groupama Stadium branco-vermelho-azul. Allez les Gones.'],
            goal_home: ['OL! Lyon marca!'],
            goal_away: ['Lyon calou rival.'],
            rival_match: ['Derby Rhône-Alpes.'],
        },
    },
    'Monaco': {
        city: 'Mônaco', region: 'FRA', stadium: 'Stade Louis II',
        voices: {
            stadium_entry: ['Louis II vermelho-branco. Daghe Munegu.'],
            goal_home: ['MONACO! Rouge et Blanc marca!'],
            goal_away: ['Monaco silenciou rival.'],
            rival_match: ['Derby da Côte d\'Azur.'],
        },
    },
    'Lille': {
        city: 'Lille', region: 'FRA', stadium: 'Stade Pierre-Mauroy',
        voices: {
            stadium_entry: ['Pierre-Mauroy vermelho-branco. Allez Lille.'],
            goal_home: ['LILLE! LOSC marca!'],
            goal_away: ['Lille calou rival.'],
            rival_match: ['Derby do Norte.'],
        },
    },
    'Nice': {
        city: 'Nice', region: 'FRA', stadium: 'Allianz Riviera',
        voices: {
            stadium_entry: ['Allianz Riviera vermelho-preto. Aiglons em casa.'],
            goal_home: ['NICE! Aiglons marcam!'],
            goal_away: ['Nice silenciou rival.'],
            rival_match: ['Derby da Côte d\'Azur.'],
        },
    },
    'Rennes': {
        city: 'Rennes', region: 'FRA', stadium: 'Roazhon Park',
        voices: {
            stadium_entry: ['Roazhon Park vermelho-preto. Stade Rennais.'],
            goal_home: ['RENNES! Rouge et Noir marca!'],
            goal_away: ['Rennes calou rival.'],
            rival_match: ['Derby Bretão.'],
        },
    },
    'Lens': {
        city: 'Lens', region: 'FRA', stadium: 'Stade Bollaert-Delelis',
        voices: {
            stadium_entry: ['Bollaert-Delelis amarelo-vermelho. Sang et Or.'],
            goal_home: ['LENS! Sangue e Ouro marca!'],
            goal_away: ['Lens silenciou rival.'],
            rival_match: ['Derby do Norte. Lens x Lille.'],
        },
    },
    'Strasbourg': {
        city: 'Estrasburgo', region: 'FRA', stadium: 'Stade de la Meinau',
        voices: {
            stadium_entry: ['Meinau azul-branco. Racing em casa.'],
            goal_home: ['STRASBOURG! Racing marca!'],
            goal_away: ['Strasbourg calou rival.'],
            rival_match: ['Derby alsaciano.'],
        },
    },
    'Montpellier': {
        city: 'Montpellier', region: 'FRA', stadium: 'Stade de la Mosson',
        voices: {
            stadium_entry: ['Mosson laranja-azul. MHSC em casa.'],
            goal_home: ['MONTPELLIER! La Paillade marca!'],
            goal_away: ['Montpellier silenciou rival.'],
            rival_match: ['Derby do Sul.'],
        },
    },

    // ============================================================
    // ARGENTINA — 10 clubes
    // ============================================================
    'Boca Juniors': {
        city: 'Buenos Aires', region: 'ARG', stadium: 'La Bombonera',
        voices: {
            stadium_entry: ['La Bombonera azul-amarela. La Doce ruge.'],
            goal_home: ['BOOOCA! Xeneizes marcam!'],
            goal_away: ['Boca calou rival.'],
            rival_match: ['Superclásico. Boca x River. Vida o muerte.'],
        },
    },
    'River Plate': {
        city: 'Buenos Aires', region: 'ARG', stadium: 'Monumental',
        voices: {
            stadium_entry: ['Monumental branco-vermelho. Millonarios em casa.'],
            goal_home: ['RIVEEER! Millonarios marcam!'],
            goal_away: ['River silenciou rival.'],
            rival_match: ['Superclásico. River x Boca.'],
        },
    },
    'Racing': {
        city: 'Avellaneda', region: 'ARG', stadium: 'Cilindro',
        voices: {
            stadium_entry: ['Cilindro celeste-branco. Academia em casa.'],
            goal_home: ['RACING! Academia marca!'],
            goal_away: ['Racing calou rival.'],
            rival_match: ['Clásico de Avellaneda. Racing x Independiente.'],
        },
    },
    'Independiente': {
        city: 'Avellaneda', region: 'ARG', stadium: 'Libertadores de América',
        voices: {
            stadium_entry: ['Libertadores de América vermelho. Diablos Rojos.'],
            goal_home: ['INDEPENDIENTE! Rey de Copas marca!'],
            goal_away: ['Independiente silenciou rival.'],
            rival_match: ['Clásico de Avellaneda.'],
        },
    },
    'San Lorenzo': {
        city: 'Buenos Aires', region: 'ARG', stadium: 'Pedro Bidegain',
        voices: {
            stadium_entry: ['Pedro Bidegain azulgrana. Ciclón em casa.'],
            goal_home: ['SAN LORENZO! Cuervo marca!'],
            goal_away: ['San Lorenzo calou rival.'],
            rival_match: ['Clásico Porteño.'],
        },
    },
    'Vélez Sársfield': {
        city: 'Buenos Aires', region: 'ARG', stadium: 'José Amalfitani',
        voices: {
            stadium_entry: ['Amalfitani branco-azul. Fortín em casa.'],
            goal_home: ['VÉLEZ! Fortín marca!'],
            goal_away: ['Vélez silenciou rival.'],
            rival_match: ['Briga porteña.'],
        },
    },
    'Estudiantes': {
        city: 'La Plata', region: 'ARG', stadium: 'Jorge Luis Hirschi',
        voices: {
            stadium_entry: ['Jorge Luis Hirschi vermelho-branco. Pincha em casa.'],
            goal_home: ['ESTUDIANTES! Pincharratas marca!'],
            goal_away: ['Estudiantes calou rival.'],
            rival_match: ['Clásico Platense. Estudiantes x Gimnasia.'],
        },
    },
    'Talleres': {
        city: 'Córdoba', region: 'ARG', stadium: 'Mario Alberto Kempes',
        voices: {
            stadium_entry: ['Kempes azul-branco. Matador em casa.'],
            goal_home: ['TALLERES! Matador marca!'],
            goal_away: ['Talleres silenciou rival.'],
            rival_match: ['Clásico Cordobés.'],
        },
    },
    'Argentinos Juniors': {
        city: 'Buenos Aires', region: 'ARG', stadium: 'Diego Armando Maradona',
        voices: {
            stadium_entry: ['Diego Maradona vermelho-branco. Bichitos em casa.'],
            goal_home: ['ARGENTINOS! Bichos colorados marcam!'],
            goal_away: ['Argentinos calou rival.'],
            rival_match: ['Briga porteña.'],
        },
    },
    'Lanús': {
        city: 'Lanús', region: 'ARG', stadium: 'La Fortaleza',
        voices: {
            stadium_entry: ['La Fortaleza granate-branca. Granate em casa.'],
            goal_home: ['LANÚS! Granate marca!'],
            goal_away: ['Lanús silenciou rival.'],
            rival_match: ['Clásico del Sur. Lanús x Banfield.'],
        },
    },

    // ============================================================
    // URUGUAI — 10 clubes
    // ============================================================
    'Peñarol': {
        city: 'Montevidéu', region: 'URU', stadium: 'Campeón del Siglo',
        voices: {
            stadium_entry: ['Campeón del Siglo aurinegro. Manyas em casa.'],
            goal_home: ['PEÑAROOOL! Carbonero marca!'],
            goal_away: ['Peñarol calou rival.'],
            rival_match: ['Clásico del Río de la Plata. Peñarol x Nacional.'],
        },
    },
    'Nacional-URU': {
        city: 'Montevidéu', region: 'URU', stadium: 'Gran Parque Central',
        voices: {
            stadium_entry: ['Gran Parque Central tricolor. Bolso em casa.'],
            goal_home: ['NACIONAL! Bolso marca!'],
            goal_away: ['Nacional silenciou rival.'],
            rival_match: ['Clásico uruguayo. Nacional x Peñarol.'],
        },
    },
    'Defensor': {
        city: 'Montevidéu', region: 'URU', stadium: 'Luis Franzini',
        voices: {
            stadium_entry: ['Luis Franzini violeta. Defensor em casa.'],
            goal_home: ['DEFENSOR! Violeta marca!'],
            goal_away: ['Defensor calou rival.'],
            rival_match: ['Briga montevideana.'],
        },
    },
    'Danubio': {
        city: 'Montevidéu', region: 'URU', stadium: 'Jardines del Hipódromo',
        voices: {
            stadium_entry: ['Jardines del Hipódromo franjeado. Franja em casa.'],
            goal_home: ['DANUBIO! Franja marca!'],
            goal_away: ['Danubio silenciou rival.'],
            rival_match: ['Briga charrúa.'],
        },
    },
    'Wanderers': {
        city: 'Montevidéu', region: 'URU', stadium: 'Parque Viera',
        voices: {
            stadium_entry: ['Parque Viera negro-blanco. Bohemios em casa.'],
            goal_home: ['WANDERERS! Bohemio marca!'],
            goal_away: ['Wanderers calou rival.'],
            rival_match: ['Briga uruguaia.'],
        },
    },
    'Liverpool-URU': {
        city: 'Montevidéu', region: 'URU', stadium: 'Belvedere',
        voices: {
            stadium_entry: ['Belvedere negro-azul. Negriazules em casa.'],
            goal_home: ['LIVERPOOL! Negriazul marca!'],
            goal_away: ['Liverpool calou rival.'],
            rival_match: ['Briga uruguaia.'],
        },
    },
    'Plaza Colonia': {
        city: 'Colonia', region: 'URU', stadium: 'Alberto Suppici',
        voices: {
            stadium_entry: ['Alberto Suppici verde-branco. Plaza em casa.'],
            goal_home: ['PLAZA! Patriotas marcam!'],
            goal_away: ['Plaza Colonia silenciou rival.'],
            rival_match: ['Briga uruguaia interior.'],
        },
    },
    'Fénix': {
        city: 'Montevidéu', region: 'URU', stadium: 'Capurro',
        voices: {
            stadium_entry: ['Capurro violeta-branco. Fénix em casa.'],
            goal_home: ['FÉNIX! Albivioleta marca!'],
            goal_away: ['Fénix calou rival.'],
            rival_match: ['Briga charrúa.'],
        },
    },
    'Cerro Largo': {
        city: 'Melo', region: 'URU', stadium: 'Arquitecto Antonio Eleuterio Ubilla',
        voices: {
            stadium_entry: ['Ubilla verde-vermelho. Arachán em casa.'],
            goal_home: ['CERRO LARGO! Arachán marca!'],
            goal_away: ['Cerro Largo silenciou rival.'],
            rival_match: ['Briga uruguaia leste.'],
        },
    },
    'Boston River': {
        city: 'Montevidéu', region: 'URU', stadium: 'Charrúa',
        voices: {
            stadium_entry: ['Charrúa branco-azul. Sastre em casa.'],
            goal_home: ['BOSTON RIVER! Sastre marca!'],
            goal_away: ['Boston River calou rival.'],
            rival_match: ['Briga uruguaia.'],
        },
    },

    // ============================================================
    // CHILE — 10 clubes
    // ============================================================
    'Colo-Colo': {
        city: 'Santiago', region: 'CHI', stadium: 'Monumental David Arellano',
        voices: {
            stadium_entry: ['Monumental branco-preto. Cacique em casa.'],
            goal_home: ['COLOOOO COLO! Albo marca!'],
            goal_away: ['Colo-Colo calou rival.'],
            rival_match: ['Superclásico chileno. Colo-Colo x U de Chile.'],
        },
    },
    'Universidad de Chile': {
        city: 'Santiago', region: 'CHI', stadium: 'Nacional',
        voices: {
            stadium_entry: ['Nacional azul. La U em casa.'],
            goal_home: ['LA U! Bulla marca!'],
            goal_away: ['U de Chile silenciou rival.'],
            rival_match: ['Superclásico chileno.'],
        },
    },
    'Universidad Católica': {
        city: 'Santiago', region: 'CHI', stadium: 'San Carlos de Apoquindo',
        voices: {
            stadium_entry: ['San Carlos de Apoquindo branco-azul. Cruzados em casa.'],
            goal_home: ['CATOLICA! Cruzados marcam!'],
            goal_away: ['Católica calou rival.'],
            rival_match: ['Clásico Universitario.'],
        },
    },
    'Cobreloa': {
        city: 'Calama', region: 'CHI', stadium: 'Zorros del Desierto',
        voices: {
            stadium_entry: ['Zorros del Desierto laranja-vermelho. Loínos em casa.'],
            goal_home: ['COBRELOA! Loínos marcam!'],
            goal_away: ['Cobreloa silenciou rival.'],
            rival_match: ['Briga do norte chileno.'],
        },
    },
    'Huachipato': {
        city: 'Talcahuano', region: 'CHI', stadium: 'CAP',
        voices: {
            stadium_entry: ['CAP preto-amarelo. Acereros em casa.'],
            goal_home: ['HUACHIPATO! Acereros marcam!'],
            goal_away: ['Huachipato calou rival.'],
            rival_match: ['Briga sul chilena.'],
        },
    },
    'O\'Higgins': {
        city: 'Rancagua', region: 'CHI', stadium: 'El Teniente',
        voices: {
            stadium_entry: ['El Teniente celeste. Capo em casa.'],
            goal_home: ['O\'HIGGINS! Celeste marca!'],
            goal_away: ['O\'Higgins silenciou rival.'],
            rival_match: ['Briga chilena.'],
        },
    },
    'Unión Española': {
        city: 'Santiago', region: 'CHI', stadium: 'Santa Laura',
        voices: {
            stadium_entry: ['Santa Laura vermelho. Hispanos em casa.'],
            goal_home: ['UNIÓN! Hispanos marcam!'],
            goal_away: ['Unión Española calou rival.'],
            rival_match: ['Briga santiaguina.'],
        },
    },
    'Palestino': {
        city: 'Santiago', region: 'CHI', stadium: 'Municipal de La Cisterna',
        voices: {
            stadium_entry: ['La Cisterna verde-vermelho-branco. Árabes em casa.'],
            goal_home: ['PALESTINO! Tetracolor marca!'],
            goal_away: ['Palestino silenciou rival.'],
            rival_match: ['Briga santiaguina.'],
        },
    },
    'Audax Italiano': {
        city: 'Santiago', region: 'CHI', stadium: 'Bicentenario de La Florida',
        voices: {
            stadium_entry: ['La Florida verde-branco. Itálicos em casa.'],
            goal_home: ['AUDAX! Itálicos marcam!'],
            goal_away: ['Audax calou rival.'],
            rival_match: ['Briga chilena.'],
        },
    },
    'Everton-CHI': {
        city: 'Viña del Mar', region: 'CHI', stadium: 'Sausalito',
        voices: {
            stadium_entry: ['Sausalito azul-amarelo. Ruleteros em casa.'],
            goal_home: ['EVERTON! Ruleteros marcam!'],
            goal_away: ['Everton silenciou rival.'],
            rival_match: ['Clásico Porteño. Everton x Wanderers.'],
        },
    },

    // ============================================================
    // COLÔMBIA — 10 clubes
    // ============================================================
    'Atlético Nacional': {
        city: 'Medellín', region: 'COL', stadium: 'Atanasio Girardot',
        voices: {
            stadium_entry: ['Atanasio Girardot verde-branco. Verdolaga em casa.'],
            goal_home: ['NACIONAL! Verdolaga marca!'],
            goal_away: ['Nacional calou rival.'],
            rival_match: ['Clásico Paisa. Nacional x Medellín.'],
        },
    },
    'Millonarios': {
        city: 'Bogotá', region: 'COL', stadium: 'El Campín',
        voices: {
            stadium_entry: ['El Campín azul. Embajadores em casa.'],
            goal_home: ['MILLOS! Embajadores marcam!'],
            goal_away: ['Millonarios silenciou rival.'],
            rival_match: ['Clásico Capitalino. Millos x Santa Fe.'],
        },
    },
    'Junior': {
        city: 'Barranquilla', region: 'COL', stadium: 'Metropolitano',
        voices: {
            stadium_entry: ['Metropolitano vermelho-branco. Tiburones em casa.'],
            goal_home: ['JUNIOR! Tiburones marcam!'],
            goal_away: ['Junior calou rival.'],
            rival_match: ['Clásico costeño.'],
        },
    },
    'América de Cali': {
        city: 'Cali', region: 'COL', stadium: 'Pascual Guerrero',
        voices: {
            stadium_entry: ['Pascual Guerrero vermelho. Diablos Rojos em casa.'],
            goal_home: ['AMÉRICA! Escarlatas marcam!'],
            goal_away: ['América silenciou rival.'],
            rival_match: ['Clásico Vallecaucano. América x Deportivo.'],
        },
    },
    'Deportivo Cali': {
        city: 'Cali', region: 'COL', stadium: 'Deportivo Cali',
        voices: {
            stadium_entry: ['Deportivo Cali verde-branco. Azucareros em casa.'],
            goal_home: ['DEPORTIVO! Verdiblanco marca!'],
            goal_away: ['Deportivo Cali calou rival.'],
            rival_match: ['Clásico Vallecaucano.'],
        },
    },
    'Santa Fe': {
        city: 'Bogotá', region: 'COL', stadium: 'El Campín',
        voices: {
            stadium_entry: ['El Campín vermelho-branco. Cardenales em casa.'],
            goal_home: ['SANTA FE! Cardenales marcam!'],
            goal_away: ['Santa Fe silenciou rival.'],
            rival_match: ['Clásico Capitalino.'],
        },
    },
    'Once Caldas': {
        city: 'Manizales', region: 'COL', stadium: 'Palogrande',
        voices: {
            stadium_entry: ['Palogrande branco. Blanco-blanco em casa.'],
            goal_home: ['ONCE! Blanco marca!'],
            goal_away: ['Once Caldas calou rival.'],
            rival_match: ['Briga colombiana cafetera.'],
        },
    },
    'Tolima': {
        city: 'Ibagué', region: 'COL', stadium: 'Manuel Murillo Toro',
        voices: {
            stadium_entry: ['Manuel Murillo Toro vermelho-amarelo. Vinotinto em casa.'],
            goal_home: ['TOLIMA! Vinotinto marca!'],
            goal_away: ['Tolima silenciou rival.'],
            rival_match: ['Briga colombiana centro.'],
        },
    },
    'Bucaramanga': {
        city: 'Bucaramanga', region: 'COL', stadium: 'Alfonso López',
        voices: {
            stadium_entry: ['Alfonso López amarelo-verde. Leopardos em casa.'],
            goal_home: ['BUCARAMANGA! Leopardos marcam!'],
            goal_away: ['Bucaramanga calou rival.'],
            rival_match: ['Briga santanderiana.'],
        },
    },
    'Medellín': {
        city: 'Medellín', region: 'COL', stadium: 'Atanasio Girardot',
        voices: {
            stadium_entry: ['Atanasio Girardot vermelho-azul. Poderoso em casa.'],
            goal_home: ['MEDELLÍN! Poderoso marca!'],
            goal_away: ['Medellín silenciou rival.'],
            rival_match: ['Clásico Paisa. Medellín x Nacional.'],
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
