/**
 * Traduz a posição do Sofascore para a engine do Elifoot
 * G = Goalkeeper (GOL)
 * D = Defender (DEF)
 * M = Midfielder (MEI)
 * F = Forward (ATA)
 */
export function mapPosition(sofaPos) {
    const pos = sofaPos ? sofaPos.toUpperCase() : 'M';
    if (pos === 'G') return 'GOL';
    if (pos === 'D') return 'DEF';
    if (pos === 'M') return 'MEI';
    if (pos === 'F') return 'ATA';
    return 'MEI'; // Fallback
}

/**
 * Calcula uma data de nascimento aproximada baseada no timestamp
 */
export function calculateAge(dateOfBirthTimestamp) {
    if (!dateOfBirthTimestamp) return 23; // Idade média padrão
    const birthDate = new Date(dateOfBirthTimestamp * 1000);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * Calcula OVR baseado na divisão (Tier) do time
 * Se for titular absoluto, o OVR é um pouco maior.
 * Se for reserva ou jovem, é menor.
 */
export function generateOvr(tier, age) {
    // Bases por Tier (Divisão)
    let baseMin, baseMax;
    switch (tier) {
        case 1: // Série A
            baseMin = 72; baseMax = 83;
            break;
        case 2: // Série B
            baseMin = 65; baseMax = 74;
            break;
        case 3: // Série C
            baseMin = 58; baseMax = 67;
            break;
        case 4: // Série D
            baseMin = 50; baseMax = 60;
            break;
        default:
            baseMin = 70; baseMax = 85;
    }

    // Jogadores no auge (26-31) tendem a ser melhores
    let modifier = 0;
    if (age >= 26 && age <= 31) modifier = 2;
    if (age < 21) modifier = -3;
    
    const ovr = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin + modifier;
    
    // Potencial é sempre um pouco maior, especialmente para jovens
    let potBonus = age < 24 ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 5);
    const pot = Math.min(99, ovr + potBonus);

    return { ovr, pot };
}

/**
 * Mapeia o Payload do Sofascore para a Interface da Engine do Elifoot
 */
export function mapPlayer(sofaPlayer, teamName, tier) {
    const age = calculateAge(sofaPlayer.player.dateOfBirthTimestamp);
    const { ovr, pot } = generateOvr(tier, age);

    return {
        name: sofaPlayer.player.name,
        shortName: sofaPlayer.player.shortName || sofaPlayer.player.name,
        age: age,
        position: mapPosition(sofaPlayer.player.position),
        ovr: ovr,
        pot: pot,
        team: teamName
    };
}
