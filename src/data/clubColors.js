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

// Sprite atlas grid: cols × rows = 20 badges per sheet
export const SPRITE_GRID = { cols: 5, rows: 4 };

// Sprite atlas paths
export const SPRITE_SHEETS = {
    a: '/sprites/clubs/spritesheet-serie-a.png',
    b: '/sprites/clubs/spritesheet-serie-b.png',
    c: '/sprites/clubs/spritesheet-serie-c.png',
    d: '/sprites/clubs/spritesheet-serie-d.png'
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
    "Sousa":          { sheet: 'd', col: 4, row: 3 }
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
    "Sousa":          { primary: "#DA020E", secondary: "#000000", accent: "#FFFFFF", nickname: "Dinossauro",    initials: "SOU" }
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
