import React, { useMemo } from 'react';
import { ATTRIBUTE_CATEGORIES } from '../../engine/PlayerAttributes';

const ATTRIBUTE_TRANSLATIONS = {
    // Technical
    crossing: 'Cruzamento',
    dribbling: 'Drible',
    finishing: 'Finalização',
    firstTouch: 'Prim. Toque',
    freeKick: 'C. Falta',
    heading: 'Cabeceio',
    longShots: 'Chute Longe',
    longThrows: 'L. Lateral',
    marking: 'Marcação',
    passing: 'Passe',
    penaltyTaking: 'Pênalti',
    tackling: 'Desarme',
    technique: 'Técnica',
    
    // Mental
    aggression: 'Agressividade',
    anticipation: 'Antecipação',
    bravery: 'Bravura',
    composure: 'Compostura',
    concentration: 'Concentração',
    decisions: 'Decisão',
    determination: 'Determinação',
    flair: 'Imprevisib.',
    leadership: 'Liderança',
    offTheBall: 'Sem Bola',
    positioning: 'Posicion.',
    teamwork: 'Trabalho Eq.',
    vision: 'Visão',
    workRate: 'Índice Trab.',
    
    // Physical
    acceleration: 'Aceleração',
    agility: 'Agilidade',
    balance: 'Equilíbrio',
    jumpingReach: 'Impulsão',
    naturalFitness: 'Aptidão Fís.',
    pace: 'Velocidade',
    stamina: 'Resistência',
    strength: 'Força',
    
    // Goalkeeping
    aerialReach: 'Alc. Aéreo',
    commandOfArea: 'Com. Área',
    communication: 'Comunicação',
    eccentricity: 'Excentricid.',
    handling: 'Manejo',
    kicking: 'Reposição',
    oneOnOnes: 'Um Contra Um',
    reflexes: 'Reflexos',
    rushingOut: 'Saída Gol',
    punching: 'Soco',
    throwing: 'Lançamento'
};

function getAttributeColor(value) {
    if (value >= 16) return 'var(--color-success-mid)';
    if (value >= 11) return 'var(--accent)';
    if (value >= 6) return 'var(--color-amber-warning)';
    return 'var(--danger-aaa)'; // better contrast than --danger on dark bg
}

function AttributeRow({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--color-bg-deep)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{label}</span>
            <span style={{ 
                color: getAttributeColor(value), 
                fontWeight: 700, 
                fontSize: '0.8rem',
                minWidth: '24px',
                textAlign: 'right'
            }}>
                {value || '-'}
            </span>
        </div>
    );
}

function CategoryBox({ title, attributes, data }) {
    if (!data) return null;
    return (
        <div style={{ 
            flex: '1', 
            minWidth: '140px', 
            background: 'var(--color-shadow-deep)', 
            padding: '8px', 
            borderRadius: 0,
            border: '1px solid var(--color-soft-border)'
        }}>
            <div style={{ 
                fontSize: '0.65rem', 
                color: 'var(--text-main)', 
                fontWeight: 'bold', 
                marginBottom: '6px',
                textTransform: 'uppercase',
                borderBottom: '2px solid var(--color-panel-tone)',
                paddingBottom: '4px'
            }}>
                {title}
            </div>
            <div>
                {attributes.map(key => (
                    <AttributeRow 
                        key={key} 
                        label={ATTRIBUTE_TRANSLATIONS[key] || key} 
                        value={data[key]} 
                    />
                ))}
            </div>
        </div>
    );
}

export function PlayerAttributesGrid({ player }) {
    // Memoize the ensureAttributes logic just in case it's missing (should already be done by engine)
    const attributes = useMemo(() => {
        if (player.attributes && typeof player.attributes === 'object' && player.attributes.technical) {
            return player.attributes;
        }
        return null; // Fallback to avoid crashes if retro-compatibility failed upstream
    }, [player]);

    if (!attributes) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Dados detalhados indisponíveis para este jogador.
            </div>
        );
    }

    const isGk = player.position === 'GOL' || player.naturalPosition === 'GOL' || (player.position && player.position.startsWith('G'));

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            width: '100%',
            marginTop: '8px'
        }}>
            <CategoryBox 
                title="Técnico" 
                attributes={ATTRIBUTE_CATEGORIES.technical} 
                data={attributes.technical} 
            />
            <CategoryBox 
                title="Mental" 
                attributes={ATTRIBUTE_CATEGORIES.mental} 
                data={attributes.mental} 
            />
            <CategoryBox 
                title="Físico" 
                attributes={ATTRIBUTE_CATEGORIES.physical} 
                data={attributes.physical} 
            />
            {isGk && (
                <CategoryBox 
                    title="Goleiro" 
                    attributes={ATTRIBUTE_CATEGORIES.goalkeeping} 
                    data={attributes.goalkeeping} 
                />
            )}
        </div>
    );
}
