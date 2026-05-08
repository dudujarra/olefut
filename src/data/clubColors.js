/**
 * Club Colors — SPEC-060 Club Identity System
 *
 * Cores oficiais reais 80 clubes brasileiros (Série A/B/C/D).
 * primary/secondary/accent + nickname + initials + sprite coords.
 *
 * Sprite atlas:
 *   /sprites/clubs/spritesheet-serie-{a,b,c,d}.png
 *   Cada spritesheet 5 cols × 4 rows = 20 badges
 *   Cell ~102×96 px na imagem original
 *
 * IP-safe: cores autênticas + iniciais ≠ clonar logo.
 */

// Default sprite atlas grid (Brasil sheets)
export const SPRITE_GRID = { cols: 5, rows: 4 };

// Sprite atlas configs: each sheet has url + cols + rows
export const SPRITE_SHEETS = {
    // Brasil 5x4 = 20 each (80 total)
    a:   { url: '/sprites/clubs/spritesheet-serie-a.png',  cols: 5, rows: 4 },
    b:   { url: '/sprites/clubs/spritesheet-serie-b.png',  cols: 5, rows: 4 },
    c:   { url: '/sprites/clubs/spritesheet-serie-c.png',  cols: 5, rows: 4 },
    d:   { url: '/sprites/clubs/spritesheet-serie-d.png',  cols: 5, rows: 4 },
    // Europe 5x2 = 10 each (50 total)
    eng: { url: '/sprites/clubs/spritesheet-eng.png',      cols: 5, rows: 3 },
    esp: { url: '/sprites/clubs/spritesheet-esp.png',      cols: 5, rows: 3 },
    ita: { url: '/sprites/clubs/spritesheet-ita.png',      cols: 5, rows: 3 },
    ger: { url: '/sprites/clubs/spritesheet-ger.png',      cols: 5, rows: 3 },
    fra: { url: '/sprites/clubs/spritesheet-fra.png',      cols: 5, rows: 3 },
    // South America 5x3 = 15 cells, 10 used (Stitch padded extras)
    arg: { url: '/sprites/clubs/spritesheet-arg.png',      cols: 5, rows: 3 },
    uru: { url: '/sprites/clubs/spritesheet-uru.png',      cols: 5, rows: 3 },
    chi: { url: '/sprites/clubs/spritesheet-chi.png',      cols: 5, rows: 3 },
    col: { url: '/sprites/clubs/spritesheet-col.png',      cols: 5, rows: 3 }
};

/**
 * Sprite coords map: club name → {sheet, col, row}
 * Sheet 5 cols × 4 rows. Order matches Stitch generation prompts.
 */
export const CLUB_SPRITES = {
    // ── SÉRIE A (sheet a) ──
    "Flamengo":       { sheet: 'a', col: 0, row: 0 },
    "Palmeiras":      { sheet: 'a', col: 1, row: 0 },
    "São Paulo":      { sheet: 'a', col: 2, row: 0 },
    "Corinthians":    { sheet: 'a', col: 3, row: 0 },
    "Atlético-MG":    { sheet: 'a', col: 4, row: 0 },
    "Fluminense":     { sheet: 'a', col: 0, row: 1 },
    "Grêmio":         { sheet: 'a', col: 1, row: 1 },
    "Internacional":  { sheet: 'a', col: 2, row: 1 },
    "Athletico-PR":   { sheet: 'a', col: 3, row: 1 },
    "Botafogo":       { sheet: 'a', col: 4, row: 1 },
    "Vasco da Gama":  { sheet: 'a', col: 0, row: 2 },
    "Cruzeiro":       { sheet: 'a', col: 1, row: 2 },
    "Bahia":          { sheet: 'a', col: 2, row: 2 },
    "Fortaleza":      { sheet: 'a', col: 3, row: 2 },
    "Ceará":          { sheet: 'a', col: 4, row: 2 },
    "Sport Recife":   { sheet: 'a', col: 0, row: 3 },
    "Vitória":        { sheet: 'a', col: 1, row: 3 },
    "Goiás":          { sheet: 'a', col: 2, row: 3 },
    "Coritiba":       { sheet: 'a', col: 3, row: 3 },
    "Santos":         { sheet: 'a', col: 4, row: 3 },

    // ── SÉRIE B (sheet b) ──
    "Ponte Preta":    { sheet: 'b', col: 0, row: 0 },
    "Guarani":        { sheet: 'b', col: 1, row: 0 },
    "Juventude":      { sheet: 'b', col: 2, row: 0 },
    "Criciúma":       { sheet: 'b', col: 3, row: 0 },
    "Vila Nova":      { sheet: 'b', col: 4, row: 0 },
    "Atlético-GO":    { sheet: 'b', col: 0, row: 1 },
    "América-MG":     { sheet: 'b', col: 1, row: 1 },
    "Chapecoense":    { sheet: 'b', col: 2, row: 1 },
    "CRB":            { sheet: 'b', col: 3, row: 1 },
    "Novorizontino":  { sheet: 'b', col: 4, row: 1 },
    "Mirassol":       { sheet: 'b', col: 0, row: 2 },
    "Avaí":           { sheet: 'b', col: 1, row: 2 },
    "Paysandu":       { sheet: 'b', col: 2, row: 2 },
    "Remo":           { sheet: 'b', col: 3, row: 2 },
    "Sampaio Corrêa": { sheet: 'b', col: 4, row: 2 },
    "Náutico":        { sheet: 'b', col: 0, row: 3 },
    "Tombense":       { sheet: 'b', col: 1, row: 3 },
    "Ituano":         { sheet: 'b', col: 2, row: 3 },
    "Botafogo-SP":    { sheet: 'b', col: 3, row: 3 },
    "Operário-PR":    { sheet: 'b', col: 4, row: 3 },

    // ── SÉRIE C (sheet c) ──
    "Figueirense":    { sheet: 'c', col: 0, row: 0 },
    "CSA":            { sheet: 'c', col: 1, row: 0 },
    "ABC":            { sheet: 'c', col: 2, row: 0 },
    "Londrina":       { sheet: 'c', col: 3, row: 0 },
    "Volta Redonda":  { sheet: 'c', col: 4, row: 0 },
    "Amazonas":       { sheet: 'c', col: 0, row: 1 },
    "Brusque":        { sheet: 'c', col: 1, row: 1 },
    "São Bernardo":   { sheet: 'c', col: 2, row: 1 },
    "Aparecidense":   { sheet: 'c', col: 3, row: 1 },
    "Ypiranga":       { sheet: 'c', col: 4, row: 1 },
    "Confiança":      { sheet: 'c', col: 0, row: 2 },
    "Botafogo-PB":    { sheet: 'c', col: 1, row: 2 },
    "Floresta":       { sheet: 'c', col: 2, row: 2 },
    "São José-RS":    { sheet: 'c', col: 3, row: 2 },
    "Altos":          { sheet: 'c', col: 4, row: 2 },
    "Manaus":         { sheet: 'c', col: 0, row: 3 },
    "Ferroviário":    { sheet: 'c', col: 1, row: 3 },
    "Caxias":         { sheet: 'c', col: 2, row: 3 },
    "Athletic Club":  { sheet: 'c', col: 3, row: 3 },
    "Ferroviária":    { sheet: 'c', col: 4, row: 3 },

    // ── SÉRIE D (sheet d) ──
    "Santa Cruz":     { sheet: 'd', col: 0, row: 0 },
    "Paraná Clube":   { sheet: 'd', col: 1, row: 0 },
    "América-RN":     { sheet: 'd', col: 2, row: 0 },
    "Campinense":     { sheet: 'd', col: 3, row: 0 },
    "Treze":          { sheet: 'd', col: 4, row: 0 },
    "Caldense":       { sheet: 'd', col: 0, row: 1 },
    "Sergipe":        { sheet: 'd', col: 1, row: 1 },
    "Brasiliense":    { sheet: 'd', col: 2, row: 1 },
    "Bangu":          { sheet: 'd', col: 3, row: 1 },
    "Moto Club":      { sheet: 'd', col: 4, row: 1 },
    "Nacional-AM":    { sheet: 'd', col: 0, row: 2 },
    "Rio Branco-ES":  { sheet: 'd', col: 1, row: 2 },
    "Anápolis":       { sheet: 'd', col: 2, row: 2 },
    "Nova Iguaçu":    { sheet: 'd', col: 3, row: 2 },
    "Cianorte":       { sheet: 'd', col: 4, row: 2 },
    "Inter de Limeira":{ sheet: 'd', col: 0, row: 3 },
    "Portuguesa-RJ":  { sheet: 'd', col: 1, row: 3 },
    "Retrô":          { sheet: 'd', col: 2, row: 3 },
    "Iguatu":         { sheet: 'd', col: 3, row: 3 },
    "Sousa":          { sheet: 'd', col: 4, row: 3 },

    // ── ENG (5x2) ──
    "Manchester City":   { sheet: 'eng', col: 0, row: 0 },
    "Arsenal":           { sheet: 'eng', col: 1, row: 0 },
    "Liverpool":         { sheet: 'eng', col: 2, row: 0 },
    "Manchester United": { sheet: 'eng', col: 3, row: 0 },
    "Chelsea":           { sheet: 'eng', col: 4, row: 0 },
    "Tottenham":         { sheet: 'eng', col: 0, row: 1 },
    "Newcastle":         { sheet: 'eng', col: 1, row: 1 },
    "Aston Villa":       { sheet: 'eng', col: 2, row: 1 },
    "West Ham":          { sheet: 'eng', col: 3, row: 1 },
    "Brighton":          { sheet: 'eng', col: 4, row: 1 },

    // ── ESP (5x2) ──
    "Real Madrid":         { sheet: 'esp', col: 0, row: 0 },
    "Barcelona":           { sheet: 'esp', col: 1, row: 0 },
    "Atlético de Madrid":  { sheet: 'esp', col: 2, row: 0 },
    "Sevilla":             { sheet: 'esp', col: 3, row: 0 },
    "Real Sociedad":       { sheet: 'esp', col: 4, row: 0 },
    "Real Betis":          { sheet: 'esp', col: 0, row: 1 },
    "Villarreal":          { sheet: 'esp', col: 1, row: 1 },
    "Athletic Bilbao":     { sheet: 'esp', col: 2, row: 1 },
    "Valencia":            { sheet: 'esp', col: 3, row: 1 },
    "Osasuna":             { sheet: 'esp', col: 4, row: 1 },

    // ── ITA (5x2) ──
    "Inter de Milão": { sheet: 'ita', col: 0, row: 0 },
    "Milan":          { sheet: 'ita', col: 1, row: 0 },
    "Juventus":       { sheet: 'ita', col: 2, row: 0 },
    "Napoli":         { sheet: 'ita', col: 3, row: 0 },
    "Roma":           { sheet: 'ita', col: 4, row: 0 },
    "Lazio":          { sheet: 'ita', col: 0, row: 1 },
    "Atalanta":       { sheet: 'ita', col: 1, row: 1 },
    "Fiorentina":     { sheet: 'ita', col: 2, row: 1 },
    "Bologna":        { sheet: 'ita', col: 3, row: 1 },
    "Torino":         { sheet: 'ita', col: 4, row: 1 },

    // ── GER (5x2) ──
    "Bayern de Munique":   { sheet: 'ger', col: 0, row: 0 },
    "Borussia Dortmund":   { sheet: 'ger', col: 1, row: 0 },
    "RB Leipzig":          { sheet: 'ger', col: 2, row: 0 },
    "Bayer Leverkusen":    { sheet: 'ger', col: 3, row: 0 },
    "Eintracht Frankfurt": { sheet: 'ger', col: 4, row: 0 },
    "Wolfsburg":           { sheet: 'ger', col: 0, row: 1 },
    "Borussia M'gladbach": { sheet: 'ger', col: 1, row: 1 },
    "Freiburg":            { sheet: 'ger', col: 2, row: 1 },
    "Hoffenheim":          { sheet: 'ger', col: 3, row: 1 },
    "Stuttgart":           { sheet: 'ger', col: 4, row: 1 },

    // ── FRA (5x2) ──
    "Paris Saint-Germain": { sheet: 'fra', col: 0, row: 0 },
    "Marseille":           { sheet: 'fra', col: 1, row: 0 },
    "Lyon":                { sheet: 'fra', col: 2, row: 0 },
    "Monaco":              { sheet: 'fra', col: 3, row: 0 },
    "Lille":               { sheet: 'fra', col: 4, row: 0 },
    "Nice":                { sheet: 'fra', col: 0, row: 1 },
    "Rennes":              { sheet: 'fra', col: 1, row: 1 },
    "Lens":                { sheet: 'fra', col: 2, row: 1 },
    "Strasbourg":          { sheet: 'fra', col: 3, row: 1 },
    "Montpellier":         { sheet: 'fra', col: 4, row: 1 },

    // ── ARG (5x2) ──
    "Boca Juniors":       { sheet: 'arg', col: 0, row: 0 },
    "River Plate":        { sheet: 'arg', col: 1, row: 0 },
    "Racing":             { sheet: 'arg', col: 2, row: 0 },
    "Independiente":      { sheet: 'arg', col: 3, row: 0 },
    "San Lorenzo":        { sheet: 'arg', col: 4, row: 0 },
    "Vélez Sársfield":    { sheet: 'arg', col: 0, row: 1 },
    "Estudiantes":        { sheet: 'arg', col: 1, row: 1 },
    "Talleres":           { sheet: 'arg', col: 2, row: 1 },
    "Argentinos Juniors": { sheet: 'arg', col: 3, row: 1 },
    "Lanús":              { sheet: 'arg', col: 4, row: 1 },

    // ── URU (5x2) ──
    "Peñarol":         { sheet: 'uru', col: 0, row: 0 },
    "Nacional-URU":    { sheet: 'uru', col: 1, row: 0 },
    "Defensor":        { sheet: 'uru', col: 2, row: 0 },
    "Danubio":         { sheet: 'uru', col: 3, row: 0 },
    "Wanderers":       { sheet: 'uru', col: 4, row: 0 },
    "Liverpool-URU":   { sheet: 'uru', col: 0, row: 1 },
    "Plaza Colonia":   { sheet: 'uru', col: 1, row: 1 },
    "Fénix":           { sheet: 'uru', col: 2, row: 1 },
    "Cerro Largo":     { sheet: 'uru', col: 3, row: 1 },
    "Boston River":    { sheet: 'uru', col: 4, row: 1 },

    // ── CHI (5x2) ──
    "Colo-Colo":            { sheet: 'chi', col: 0, row: 0 },
    "Universidad de Chile": { sheet: 'chi', col: 1, row: 0 },
    "Universidad Católica": { sheet: 'chi', col: 2, row: 0 },
    "Cobreloa":             { sheet: 'chi', col: 3, row: 0 },
    "Huachipato":           { sheet: 'chi', col: 4, row: 0 },
    "O'Higgins":            { sheet: 'chi', col: 0, row: 1 },
    "Unión Española":       { sheet: 'chi', col: 1, row: 1 },
    "Palestino":            { sheet: 'chi', col: 2, row: 1 },
    "Audax Italiano":       { sheet: 'chi', col: 3, row: 1 },
    "Everton-CHI":          { sheet: 'chi', col: 4, row: 1 },

    // ── COL (5x2) ──
    "Atlético Nacional": { sheet: 'col', col: 0, row: 0 },
    "Millonarios":       { sheet: 'col', col: 1, row: 0 },
    "Junior":            { sheet: 'col', col: 2, row: 0 },
    "América de Cali":   { sheet: 'col', col: 3, row: 0 },
    "Deportivo Cali":    { sheet: 'col', col: 4, row: 0 },
    "Santa Fe":          { sheet: 'col', col: 0, row: 1 },
    "Once Caldas":       { sheet: 'col', col: 1, row: 1 },
    "Tolima":            { sheet: 'col', col: 2, row: 1 },
    "Bucaramanga":       { sheet: 'col', col: 3, row: 1 },
    "Medellín":          { sheet: 'col', col: 4, row: 1 }
};

/**
 * Get sprite coords for a club. Returns null if no sprite.
 * @param {string} name
 * @returns {{sheet: string, col: number, row: number} | null}
 */
export function getClubSprite(name) {
    return CLUB_SPRITES[name] || null;
}


export const DEFAULT_COLORS = {
    primary: '#2D5A3D',
    secondary: '#FFFFFF',
    accent: '#F4F1DE',
    nickname: '',
    initials: 'CLB'
};

export const CLUB_COLORS = {
    // ── SÉRIE A ──
    "Flamengo":       { primary: "#E32636", secondary: "#000000", accent: "#C0C0C0", nickname: "Mengão",        initials: "FLA" },
    "Palmeiras":      { primary: "#006437", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Verdão",        initials: "PAL" },
    "São Paulo":      { primary: "#FE0000", secondary: "#000000", accent: "#FFFFFF", nickname: "Tricolor",      initials: "SAO" },
    "Corinthians":    { primary: "#000000", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Timão",         initials: "COR" },
    "Atlético-MG":    { primary: "#000000", secondary: "#FFFFFF", accent: "#C0C0C0", nickname: "Galo",          initials: "ATL" },
    "Fluminense":     { primary: "#870A21", secondary: "#006437", accent: "#FFFFFF", nickname: "Flu",           initials: "FLU" },
    "Grêmio":         { primary: "#007BC4", secondary: "#000000", accent: "#FFFFFF", nickname: "Imortal",       initials: "GRE" },
    "Internacional":  { primary: "#E5050E", secondary: "#FFFFFF", accent: "#000000", nickname: "Colorado",      initials: "INT" },
    "Athletico-PR":   { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Furacão",       initials: "CAP" },
    "Botafogo":       { primary: "#000000", secondary: "#FFFFFF", accent: "#C0C0C0", nickname: "Glorioso",      initials: "BOT" },
    "Vasco da Gama":  { primary: "#000000", secondary: "#FFFFFF", accent: "#E32636", nickname: "Gigante",       initials: "VAS" },
    "Cruzeiro":       { primary: "#003F87", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Raposa",        initials: "CRU" },
    "Bahia":          { primary: "#002E63", secondary: "#FFFFFF", accent: "#E32636", nickname: "Esquadrão",     initials: "BAH" },
    "Fortaleza":      { primary: "#002E63", secondary: "#E32636", accent: "#FFFFFF", nickname: "Leão",          initials: "FOR" },
    "Ceará":          { primary: "#000000", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Vovô",          initials: "CEA" },
    "Sport Recife":   { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Leão da Ilha",  initials: "SPT" },
    "Vitória":        { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Rubronegro",    initials: "VIT" },
    "Goiás":          { primary: "#006437", secondary: "#FFFFFF", accent: "#000000", nickname: "Esmeraldino",   initials: "GOI" },
    "Coritiba":       { primary: "#006437", secondary: "#FFFFFF", accent: "#000000", nickname: "Coxa",          initials: "CFC" },
    "Santos":         { primary: "#FFFFFF", secondary: "#000000", accent: "#FFD700", nickname: "Peixe",         initials: "SAN" },

    // ── SÉRIE B ──
    "Ponte Preta":    { primary: "#000000", secondary: "#FFFFFF", accent: "#C0C0C0", nickname: "Macaca",        initials: "PON" },
    "Guarani":        { primary: "#006437", secondary: "#FFFFFF", accent: "#000000", nickname: "Bugre",         initials: "GUA" },
    "Juventude":      { primary: "#006437", secondary: "#FFFFFF", accent: "#000000", nickname: "Papo",          initials: "JUV" },
    "Criciúma":       { primary: "#FFD700", secondary: "#000000", accent: "#FFFFFF", nickname: "Tigre",         initials: "CRI" },
    "Vila Nova":      { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Tigre Goiano",  initials: "VIL" },
    "Atlético-GO":    { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Dragão",        initials: "ACG" },
    "América-MG":     { primary: "#006437", secondary: "#FFFFFF", accent: "#DA020E", nickname: "Coelho",        initials: "AMG" },
    "Chapecoense":    { primary: "#006437", secondary: "#FFFFFF", accent: "#000000", nickname: "Chape",         initials: "CHA" },
    "CRB":            { primary: "#DA020E", secondary: "#FFFFFF", accent: "#000000", nickname: "Galo da Pajuçara", initials: "CRB" },
    "Novorizontino":  { primary: "#FFD700", secondary: "#000000", accent: "#FFFFFF", nickname: "Tigre",         initials: "NOV" },
    "Mirassol":       { primary: "#FFD700", secondary: "#006437", accent: "#FFFFFF", nickname: "Leão",          initials: "MIR" },
    "Avaí":           { primary: "#003F87", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Leão da Ilha",  initials: "AVA" },
    "Paysandu":       { primary: "#003F87", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Papão",         initials: "PAY" },
    "Remo":           { primary: "#003F87", secondary: "#FFFFFF", accent: "#000000", nickname: "Leão Azul",     initials: "REM" },
    "Sampaio Corrêa": { primary: "#FFD700", secondary: "#006437", accent: "#FFFFFF", nickname: "Tricolor",      initials: "SAM" },
    "Náutico":        { primary: "#DA020E", secondary: "#FFFFFF", accent: "#000000", nickname: "Timbu",         initials: "NAU" },
    "Tombense":       { primary: "#FFFFFF", secondary: "#000000", accent: "#FFD700", nickname: "Carniceiro",    initials: "TOM" },
    "Ituano":         { primary: "#000000", secondary: "#DA020E", accent: "#FFFFFF", nickname: "Galo de Itu",   initials: "ITU" },
    "Botafogo-SP":    { primary: "#DA020E", secondary: "#FFFFFF", accent: "#000000", nickname: "Pantera",       initials: "BSP" },
    "Operário-PR":    { primary: "#000000", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Fantasma",      initials: "OPE" },

    // ── SÉRIE C ──
    "Figueirense":    { primary: "#000000", secondary: "#FFFFFF", accent: "#C0C0C0", nickname: "Figueira",      initials: "FIG" },
    "CSA":            { primary: "#003F87", secondary: "#FFFFFF", accent: "#DA020E", nickname: "Azulão",        initials: "CSA" },
    "ABC":            { primary: "#000000", secondary: "#FFFFFF", accent: "#C0C0C0", nickname: "Mais Querido",  initials: "ABC" },
    "Londrina":       { primary: "#003F87", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Tubarão",       initials: "LON" },
    "Volta Redonda":  { primary: "#000000", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Voltaço",       initials: "VRE" },
    "Amazonas":       { primary: "#006437", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Onça",          initials: "AMA" },
    "Brusque":        { primary: "#FFD700", secondary: "#003F87", accent: "#FFFFFF", nickname: "Quadricolor",   initials: "BRU" },
    "São Bernardo":   { primary: "#FFD700", secondary: "#000000", accent: "#FFFFFF", nickname: "Tigre",         initials: "SBE" },
    "Aparecidense":   { primary: "#006437", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Camaleão",      initials: "APA" },
    "Ypiranga":       { primary: "#DA020E", secondary: "#FFFFFF", accent: "#000000", nickname: "Canarinho",     initials: "YPI" },
    "Confiança":      { primary: "#003F87", secondary: "#FFFFFF", accent: "#DA020E", nickname: "Dragão",        initials: "CON" },
    "Botafogo-PB":    { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Belo",          initials: "BPB" },
    "Floresta":       { primary: "#006437", secondary: "#FFFFFF", accent: "#000000", nickname: "Lobo da Vila",  initials: "FLO" },
    "São José-RS":    { primary: "#000000", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Zequinha",      initials: "SJO" },
    "Altos":          { primary: "#FFD700", secondary: "#006437", accent: "#FFFFFF", nickname: "Jacaré",        initials: "ALT" },
    "Manaus":         { primary: "#003F87", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Esmeraldino",   initials: "MAN" },
    "Ferroviário":    { primary: "#000000", secondary: "#DA020E", accent: "#FFFFFF", nickname: "Tubarão",       initials: "FER" },
    "Caxias":         { primary: "#FFD700", secondary: "#003F87", accent: "#FFFFFF", nickname: "Grená",         initials: "CAX" },
    "Athletic Club":  { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Esquadrão",     initials: "ATH" },
    "Ferroviária":    { primary: "#FFD700", secondary: "#DA020E", accent: "#FFFFFF", nickname: "Locomotiva",    initials: "FRR" },

    // ── SÉRIE D ──
    "Santa Cruz":     { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Cobra Coral",   initials: "STC" },
    "Paraná Clube":   { primary: "#003F87", secondary: "#DA020E", accent: "#FFFFFF", nickname: "Tricolor",      initials: "PAR" },
    "América-RN":     { primary: "#DA020E", secondary: "#FFFFFF", accent: "#000000", nickname: "Mecão",         initials: "ARN" },
    "Campinense":     { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Raposa",        initials: "CAM" },
    "Treze":          { primary: "#FFD700", secondary: "#000000", accent: "#FFFFFF", nickname: "Galo",          initials: "TRZ" },
    "Caldense":       { primary: "#000000", secondary: "#FFFFFF", accent: "#DA020E", nickname: "Veterana",      initials: "CAL" },
    "Sergipe":        { primary: "#DA020E", secondary: "#FFFFFF", accent: "#000000", nickname: "Gigante",       initials: "SER" },
    "Brasiliense":    { primary: "#FFD700", secondary: "#003F87", accent: "#FFFFFF", nickname: "Jacaré",        initials: "BSB" },
    "Bangu":          { primary: "#DA020E", secondary: "#FFFFFF", accent: "#000000", nickname: "Castor",        initials: "BAN" },
    "Moto Club":      { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Papão da Ilha", initials: "MOT" },
    "Nacional-AM":    { primary: "#003F87", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Leão",          initials: "NAM" },
    "Rio Branco-ES":  { primary: "#FFFFFF", secondary: "#000000", accent: "#DA020E", nickname: "Capa-Preta",    initials: "RBE" },
    "Anápolis":       { primary: "#003F87", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Galo do Centro",initials: "ANA" },
    "Nova Iguaçu":    { primary: "#FF8C00", secondary: "#003F87", accent: "#FFFFFF", nickname: "Laranja",       initials: "NIG" },
    "Cianorte":       { primary: "#FFD700", secondary: "#006437", accent: "#FFFFFF", nickname: "Leão",          initials: "CIA" },
    "Inter de Limeira":{ primary: "#000000", secondary: "#FFFFFF", accent: "#003F87", nickname: "Leão",         initials: "ILI" },
    "Portuguesa-RJ":  { primary: "#006437", secondary: "#DA020E", accent: "#FFFFFF", nickname: "Lusa Carioca",  initials: "PRJ" },
    "Retrô":          { primary: "#000000", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Fênix",         initials: "RET" },
    "Iguatu":         { primary: "#DA020E", secondary: "#FFFFFF", accent: "#000000", nickname: "Azulão",        initials: "IGU" },
    "Sousa":          { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Dinossauro",    initials: "SOU" },

    // ── ENG Premier League ──
    "Manchester City":   { primary: "#6CABDD", secondary: "#FFFFFF", accent: "#1C2C5B", nickname: "Citizens",      initials: "MCI" },
    "Arsenal":           { primary: "#EF0107", secondary: "#FFFFFF", accent: "#063672", nickname: "Gunners",       initials: "ARS" },
    "Liverpool":         { primary: "#C8102E", secondary: "#FFFFFF", accent: "#00B2A9", nickname: "Reds",          initials: "LIV" },
    "Manchester United": { primary: "#DA020E", secondary: "#FBE122", accent: "#000000", nickname: "Red Devils",    initials: "MUN" },
    "Chelsea":           { primary: "#034694", secondary: "#FFFFFF", accent: "#DBA111", nickname: "Blues",         initials: "CHE" },
    "Tottenham":         { primary: "#FFFFFF", secondary: "#132257", accent: "#C0C0C0", nickname: "Spurs",         initials: "TOT" },
    "Newcastle":         { primary: "#000000", secondary: "#FFFFFF", accent: "#41B6E6", nickname: "Magpies",       initials: "NEW" },
    "Aston Villa":       { primary: "#7A003C", secondary: "#95BFE5", accent: "#FFE100", nickname: "Villans",       initials: "AVL" },
    "West Ham":          { primary: "#7A263A", secondary: "#1BB1E7", accent: "#FFD700", nickname: "Hammers",       initials: "WHU" },
    "Brighton":          { primary: "#0057B8", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Seagulls",      initials: "BHA" },

    // ── ESP La Liga ──
    "Real Madrid":         { primary: "#FFFFFF", secondary: "#FEBE10", accent: "#00529F", nickname: "Merengues",   initials: "RMA" },
    "Barcelona":           { primary: "#A50044", secondary: "#004D98", accent: "#FFED02", nickname: "Blaugrana",   initials: "BAR" },
    "Atlético de Madrid":  { primary: "#CB3524", secondary: "#FFFFFF", accent: "#272E61", nickname: "Colchoneros", initials: "ATM" },
    "Sevilla":             { primary: "#FFFFFF", secondary: "#D71920", accent: "#000000", nickname: "Nervionenses",initials: "SEV" },
    "Real Sociedad":       { primary: "#1F4998", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Txuri-Urdin", initials: "RSO" },
    "Real Betis":          { primary: "#00954C", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Verdiblancos",initials: "BET" },
    "Villarreal":          { primary: "#FFE667", secondary: "#005CB9", accent: "#000000", nickname: "Submarino",   initials: "VIL" },
    "Athletic Bilbao":     { primary: "#EE2523", secondary: "#FFFFFF", accent: "#000000", nickname: "Leones",      initials: "ATH" },
    "Valencia":            { primary: "#FF7F00", secondary: "#000000", accent: "#FFFFFF", nickname: "Che",         initials: "VAL" },
    "Osasuna":             { primary: "#D91A21", secondary: "#0A346F", accent: "#FFFFFF", nickname: "Rojillos",    initials: "OSA" },

    // ── ITA Serie A ──
    "Inter de Milão":      { primary: "#0068A8", secondary: "#000000", accent: "#FFD700", nickname: "Nerazzurri",  initials: "INT" },
    "Milan":               { primary: "#FB090B", secondary: "#000000", accent: "#FFFFFF", nickname: "Rossoneri",   initials: "MIL" },
    "Juventus":            { primary: "#000000", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Bianconeri",  initials: "JUV" },
    "Napoli":              { primary: "#1FB4E6", secondary: "#FFFFFF", accent: "#003C8F", nickname: "Partenopei",  initials: "NAP" },
    "Roma":                { primary: "#8E1F2F", secondary: "#F0BC42", accent: "#FFFFFF", nickname: "Giallorossi", initials: "ROM" },
    "Lazio":               { primary: "#87CEEB", secondary: "#FFFFFF", accent: "#A0892F", nickname: "Biancocelesti",initials: "LAZ" },
    "Atalanta":            { primary: "#1C71B9", secondary: "#000000", accent: "#FFFFFF", nickname: "Dea",         initials: "ATA" },
    "Fiorentina":          { primary: "#6C3082", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Viola",       initials: "FIO" },
    "Bologna":             { primary: "#C8102E", secondary: "#1C2D5C", accent: "#FFFFFF", nickname: "Rossoblù",    initials: "BOL" },
    "Torino":              { primary: "#8B0000", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Granata",     initials: "TOR" },

    // ── GER Bundesliga ──
    "Bayern de Munique":   { primary: "#DC052D", secondary: "#FFFFFF", accent: "#0066B2", nickname: "FCB",         initials: "BAY" },
    "Borussia Dortmund":   { primary: "#FDE100", secondary: "#000000", accent: "#FFFFFF", nickname: "BVB",         initials: "BVB" },
    "RB Leipzig":          { primary: "#DD1B33", secondary: "#FFFFFF", accent: "#000C40", nickname: "Roten Bullen",initials: "RBL" },
    "Bayer Leverkusen":    { primary: "#E32221", secondary: "#000000", accent: "#FFFFFF", nickname: "Werkself",    initials: "B04" },
    "Eintracht Frankfurt": { primary: "#E1000F", secondary: "#000000", accent: "#FFFFFF", nickname: "Adler",       initials: "SGE" },
    "Wolfsburg":           { primary: "#65B32E", secondary: "#FFFFFF", accent: "#000000", nickname: "Wölfe",       initials: "WOB" },
    "Borussia M'gladbach": { primary: "#FFFFFF", secondary: "#000000", accent: "#00984A", nickname: "Fohlen",      initials: "BMG" },
    "Freiburg":            { primary: "#E32219", secondary: "#FFFFFF", accent: "#000000", nickname: "Breisgauer",  initials: "SCF" },
    "Hoffenheim":          { primary: "#1961AC", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Kraichgauer", initials: "TSG" },
    "Stuttgart":           { primary: "#E32219", secondary: "#FFFFFF", accent: "#000000", nickname: "Schwaben",    initials: "VFB" },

    // ── FRA Ligue 1 ──
    "Paris Saint-Germain": { primary: "#004170", secondary: "#DA020E", accent: "#FFFFFF", nickname: "Les Parisiens",initials: "PSG" },
    "Marseille":           { primary: "#009DDC", secondary: "#FFFFFF", accent: "#FFD700", nickname: "OM",          initials: "OMA" },
    "Lyon":                { primary: "#FFFFFF", secondary: "#DA020E", accent: "#003DA5", nickname: "Les Gones",   initials: "LYO" },
    "Monaco":              { primary: "#C8102E", secondary: "#FFFFFF", accent: "#000000", nickname: "Rouge & Blanc",initials: "MON" },
    "Lille":               { primary: "#DA0000", secondary: "#003DA5", accent: "#FFFFFF", nickname: "Dogues",      initials: "LIL" },
    "Nice":                { primary: "#C8102E", secondary: "#000000", accent: "#FFFFFF", nickname: "Aiglons",     initials: "NCE" },
    "Rennes":              { primary: "#DA0000", secondary: "#000000", accent: "#FFFFFF", nickname: "Rouge & Noir",initials: "REN" },
    "Lens":                { primary: "#FFD700", secondary: "#DA0000", accent: "#000000", nickname: "Sang & Or",   initials: "LEN" },
    "Strasbourg":          { primary: "#1056A3", secondary: "#FFFFFF", accent: "#000000", nickname: "Racing",      initials: "STR" },
    "Montpellier":         { primary: "#0066B2", secondary: "#F58220", accent: "#FFFFFF", nickname: "La Paillade", initials: "MHS" },

    // ── ARG Liga Profesional ──
    "Boca Juniors":        { primary: "#002F69", secondary: "#FFD700", accent: "#FFFFFF", nickname: "Xeneizes",    initials: "BOC" },
    "River Plate":         { primary: "#FFFFFF", secondary: "#DA020E", accent: "#000000", nickname: "Millonarios", initials: "RIV" },
    "Racing":              { primary: "#6CACE4", secondary: "#FFFFFF", accent: "#000000", nickname: "Academia",    initials: "RAC" },
    "Independiente":       { primary: "#C8102E", secondary: "#FFFFFF", accent: "#000000", nickname: "Diablo Rojo", initials: "IND" },
    "San Lorenzo":         { primary: "#002F69", secondary: "#C8102E", accent: "#FFFFFF", nickname: "Cuervo",      initials: "SLO" },
    "Vélez Sársfield":     { primary: "#FFFFFF", secondary: "#003DA5", accent: "#000000", nickname: "Fortín",      initials: "VEL" },
    "Estudiantes":         { primary: "#C8102E", secondary: "#FFFFFF", accent: "#000000", nickname: "Pincharratas",initials: "EST" },
    "Talleres":            { primary: "#00549F", secondary: "#FFFFFF", accent: "#000000", nickname: "Matador",     initials: "TAL" },
    "Argentinos Juniors":  { primary: "#C8102E", secondary: "#FFFFFF", accent: "#000000", nickname: "Bicho",       initials: "AGJ" },
    "Lanús":               { primary: "#762737", secondary: "#FFFFFF", accent: "#000000", nickname: "Granate",     initials: "LAN" },

    // ── URU Primera ──
    "Peñarol":             { primary: "#FFCD00", secondary: "#000000", accent: "#FFFFFF", nickname: "Aurinegro",   initials: "PEN" },
    "Nacional-URU":        { primary: "#FFFFFF", secondary: "#003DA5", accent: "#DA020E", nickname: "Bolso",       initials: "NAC" },
    "Defensor":            { primary: "#BB252B", secondary: "#003DA5", accent: "#FFFFFF", nickname: "Violeta",     initials: "DEF" },
    "Danubio":             { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Franja",      initials: "DAN" },
    "Wanderers":           { primary: "#000000", secondary: "#FFFFFF", accent: "#C0C0C0", nickname: "Bohemios",    initials: "WAN" },
    "Liverpool-URU":       { primary: "#000000", secondary: "#003DA5", accent: "#FFCD00", nickname: "Negriazul",   initials: "LVU" },
    "Plaza Colonia":       { primary: "#FFCD00", secondary: "#000000", accent: "#FFFFFF", nickname: "Patablanca",  initials: "PLA" },
    "Fénix":               { primary: "#4B0082", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Albivioleta", initials: "FEX" },
    "Cerro Largo":         { primary: "#008000", secondary: "#000000", accent: "#FFFFFF", nickname: "Arachán",     initials: "CER" },
    "Boston River":        { primary: "#C8102E", secondary: "#FFFFFF", accent: "#000000", nickname: "Sastre",      initials: "BOR" },

    // ── CHI ──
    "Colo-Colo":           { primary: "#FFFFFF", secondary: "#000000", accent: "#FFD700", nickname: "Cacique",     initials: "COL" },
    "Universidad de Chile":{ primary: "#003DA5", secondary: "#DA020E", accent: "#FFFFFF", nickname: "Azules",       initials: "UCH" },
    "Universidad Católica":{ primary: "#002F69", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Cruzados",    initials: "UCA" },
    "Cobreloa":            { primary: "#FF6600", secondary: "#FFFFFF", accent: "#000000", nickname: "Loínos",      initials: "CBL" },
    "Huachipato":          { primary: "#000000", secondary: "#0098D7", accent: "#FFFFFF", nickname: "Acereros",    initials: "HUA" },
    "O'Higgins":           { primary: "#87CEEB", secondary: "#000000", accent: "#FFFFFF", nickname: "Celeste",     initials: "OHI" },
    "Unión Española":      { primary: "#C8102E", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Furia Roja",  initials: "UNE" },
    "Palestino":           { primary: "#BB252B", secondary: "#008000", accent: "#FFFFFF", nickname: "Árabes",      initials: "PAL" },
    "Audax Italiano":      { primary: "#006400", secondary: "#FFFFFF", accent: "#DA020E", nickname: "Tanos",       initials: "AUD" },
    "Everton-CHI":         { primary: "#003DA5", secondary: "#FFD700", accent: "#FFFFFF", nickname: "Ruleteros",   initials: "EVR" },

    // ── COL Categoría Primera A ──
    "Atlético Nacional":   { primary: "#006837", secondary: "#FFFFFF", accent: "#000000", nickname: "Verdolaga",   initials: "NAC" },
    "Millonarios":         { primary: "#003DA5", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Embajadores", initials: "MIL" },
    "Junior":              { primary: "#C8102E", secondary: "#FFFFFF", accent: "#003DA5", nickname: "Tiburones",   initials: "JUN" },
    "América de Cali":     { primary: "#C8102E", secondary: "#FFFFFF", accent: "#000000", nickname: "Diablos Rojos",initials: "AME" },
    "Deportivo Cali":      { primary: "#006837", secondary: "#FFFFFF", accent: "#000000", nickname: "Azucareros",  initials: "DCL" },
    "Santa Fe":            { primary: "#C8102E", secondary: "#FFFFFF", accent: "#000000", nickname: "Cardenales",  initials: "STF" },
    "Once Caldas":         { primary: "#FFFFFF", secondary: "#000000", accent: "#C8102E", nickname: "Albo",        initials: "ONC" },
    "Tolima":              { primary: "#C8102E", secondary: "#FFD700", accent: "#FFFFFF", nickname: "Pijao",       initials: "TOL" },
    "Bucaramanga":         { primary: "#FFD700", secondary: "#003DA5", accent: "#FFFFFF", nickname: "Leopardos",   initials: "BUC" },
    "Medellín":            { primary: "#003DA5", secondary: "#C8102E", accent: "#FFFFFF", nickname: "Poderoso",    initials: "MED" }
};

/**
 * Get colors for a club. Returns DEFAULT_COLORS if not mapped.
 * @param {string} name — Club name (matches BrazilDB keys exactly)
 * @returns {{primary: string, secondary: string, accent: string, nickname: string, initials: string}}
 */
export function getClubColors(name) {
    return CLUB_COLORS[name] || { ...DEFAULT_COLORS, initials: deriveInitials(name) };
}

/**
 * Derive 3-char uppercase initials from club name.
 * Strip accents + non-letters. Examples:
 *   "São Paulo" → "SAO"
 *   "Atlético-MG" → "ATM"
 *   "CSA" → "CSA"
 */
export function deriveInitials(name) {
    if (!name) return 'CLB';
    const ascii = name.normalize('NFD').replace(/[̀-ͯ]/g, '');
    const clean = ascii.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return clean.slice(0, 3) || 'CLB';
}

/**
 * Total clubs mapped (for testing).
 */
export const CLUB_COUNT = Object.keys(CLUB_COLORS).length;
