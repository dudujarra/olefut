import { useState, useEffect, useRef } from 'react';
import { FORMATION_PRESETS, getPreset, FORMATION_KEYS } from '../engine/FormationLayout';
import { EfTooltip, EfButton } from './ui';
import { ArrowsClockwise, FloppyDisk } from '@phosphor-icons/react';

const FIELD_W = 600;
const FIELD_H = 400;
const JERSEY_R = 22;

/**
 * FormationBoard — Drag/drop visual editor for tactical positioning
 * ELIFOOT classic style: campo verde + 11 camisas com nome/posição/número
 *
 * Props:
 *  - team: { id, name, squad[], formation, formationLayout? }
 *  - onSave: (newLayout) => void
 *  - onChange: (newLayout) => void  // optional live update
 *  - editable: bool (default true)
 *
 * Coords normalizadas [0,1]; canvas escala 600×400.
 */
export function FormationBoard({ team, onSave, onChange, editable = true }) {
    const [formation, setFormation] = useState(team?.formation || '4-3-3');
    const [layout, setLayout] = useState(() => buildInitialLayout(team, team?.formation || '4-3-3'));
    const [draggedSlot, setDraggedSlot] = useState(null);
    const fieldRef = useRef(null);

    const colors = {
        bg: '#0D1117',
        panelBg: '#161B22',
        panelElevated: '#1A1F24',
        border: '#2D3748',
        text: '#FDFBF7',
        textMuted: '#8E9E94',
        accent: '#39FF14',
        secondary: '#40BAF7',
        warning: '#FFD700',
        danger: '#FF3333',
        field: '#1E3A2F', // Darker, more premium green
        fieldLines: '#111417',
        jerseyBlue: '#1E40AF',
        jerseyGold: '#B8860B' // Premium gold for GK
    };

    // BUG-081 (SPEC-158): aceitável — onChange callback efeito-puro precisa rodar após render.
    // Setlayout é derivado mas onChange propaga pro pai (não cabe useMemo).
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    useEffect(() => {
        // When formation changes, reset to preset layout (preserve player assignments by role)
        const preset = getPreset(formation);
        const newLayout = {};
        const titulares = (team?.squad || []).filter(p => p.isTitular).slice(0, 11);
        preset.forEach((slot, i) => {
            const player = titulares[i] || null;
            newLayout[slot.slot] = {
                playerId: player?.id || null,
                x: slot.x,
                y: slot.y,
                role: slot.role
            };
        });
        setLayout(newLayout);
        if (onChange) onChange(newLayout);
    }, [formation, team]);
    /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

    function handlePointerDown(e, slotIdx) {
        if (!editable) return;
        e.preventDefault();
        setDraggedSlot(slotIdx);
    }

    function handlePointerMove(e) {
        if (draggedSlot === null || !fieldRef.current) return;
        const rect = fieldRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const cx = Math.max(0.05, Math.min(0.95, x));
        const cy = Math.max(0.05, Math.min(0.95, y));
        setLayout(prev => {
            const next = { ...prev, [draggedSlot]: { ...prev[draggedSlot], x: cx, y: cy } };
            if (onChange) onChange(next);
            return next;
        });
    }

    function handlePointerUp() {
        setDraggedSlot(null);
    }

    function resetToPreset() {
        const preset = getPreset(formation);
        const newLayout = {};
        const titulares = (team?.squad || []).filter(p => p.isTitular).slice(0, 11);
        preset.forEach((slot, i) => {
            const player = titulares[i] || null;
            newLayout[slot.slot] = {
                playerId: player?.id || null,
                x: slot.x,
                y: slot.y,
                role: slot.role
            };
        });
        setLayout(newLayout);
        if (onChange) onChange(newLayout);
    }

    function handleSave() {
        if (onSave) onSave({ formation, layout });
    }

    if (!team) return <div style={{ color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>Time não encontrado.</div>;

    const playerById = {};
    (team.squad || []).forEach(p => { playerById[p.id] = p; });

    return (
        <div className="formation-board" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Formation selector */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: colors.panelBg, padding: '12px', border: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: '0.85rem', color: colors.textMuted, fontFamily: 'var(--font-mono)', marginRight: '8px' }}>ESQUEMA:</span>
                {FORMATION_KEYS.map(k => (
                    <EfTooltip key={k} content={`Mudar para ${k} — reorganiza posições padrão`}>
                        <EfButton
                            variant={formation === k ? 'primary' : 'secondary'} size="sm"
                            onClick={() => setFormation(k)}
                        >
                            {k}
                        </EfButton>
                    </EfTooltip>
                ))}
                
                <div style={{ flex: 1 }} />
                
                <EfTooltip content="Voltar para posições padrão da formação atual">
                    <EfButton variant="secondary" size="sm" onClick={resetToPreset} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowsClockwise size={16} /> RESET
                    </EfButton>
                </EfTooltip>
                
                {onSave && (
                    <EfButton variant="primary" size="sm" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FloppyDisk size={16} weight="fill" /> SALVAR
                    </EfButton>
                )}
            </div>

            {/* Field SVG */}
            <div
                ref={fieldRef}
                style={{
                    width: '100%',
                    maxWidth: FIELD_W,
                    aspectRatio: `${FIELD_W} / ${FIELD_H}`,
                    position: 'relative',
                    background: colors.field,
                    border: `4px solid ${colors.panelElevated}`,
                    overflow: 'hidden',
                    cursor: draggedSlot !== null ? 'grabbing' : 'default',
                    touchAction: 'none',
                    margin: '0 auto',
                    boxShadow: `inset 0 0 40px #040805`
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} width="100%" height="100%" style={{ display: 'block' }}>
                    {/* Field lines */}
                    <rect x="4" y="4" width={FIELD_W - 8} height={FIELD_H - 8} fill="none" stroke={colors.fieldLines} strokeWidth="2" />
                    <line x1="0" y1={FIELD_H / 2} x2={FIELD_W} y2={FIELD_H / 2} stroke={colors.fieldLines} strokeWidth="2" />
                    <circle cx={FIELD_W / 2} cy={FIELD_H / 2} r="48" fill="none" stroke={colors.fieldLines} strokeWidth="2" />
                    <circle cx={FIELD_W / 2} cy={FIELD_H / 2} r="3" fill={colors.fieldLines} />
                    
                    {/* Top goal box */}
                    <rect x={FIELD_W / 2 - 100} y="0" width="200" height="70" fill="none" stroke={colors.fieldLines} strokeWidth="2" />
                    <rect x={FIELD_W / 2 - 40} y="0" width="80" height="24" fill="none" stroke={colors.fieldLines} strokeWidth="2" />
                    <path d={`M ${FIELD_W / 2 - 40} 70 A 40 40 0 0 0 ${FIELD_W / 2 + 40} 70`} fill="none" stroke={colors.fieldLines} strokeWidth="2" />
                    
                    {/* Bottom goal box */}
                    <rect x={FIELD_W / 2 - 100} y={FIELD_H - 70} width="200" height="70" fill="none" stroke={colors.fieldLines} strokeWidth="2" />
                    <rect x={FIELD_W / 2 - 40} y={FIELD_H - 24} width="80" height="24" fill="none" stroke={colors.fieldLines} strokeWidth="2" />
                    <path d={`M ${FIELD_W / 2 - 40} ${FIELD_H - 70} A 40 40 0 0 1 ${FIELD_W / 2 + 40} ${FIELD_H - 70}`} fill="none" stroke={colors.fieldLines} strokeWidth="2" />

                    {/* Corner arcs */}
                    <path d={`M 0 16 A 16 16 0 0 0 16 0`} fill="none" stroke={colors.fieldLines} strokeWidth="2" />
                    <path d={`M ${FIELD_W - 16} 0 A 16 16 0 0 0 ${FIELD_W} 16`} fill="none" stroke={colors.fieldLines} strokeWidth="2" />
                    <path d={`M 0 ${FIELD_H - 16} A 16 16 0 0 1 16 ${FIELD_H}`} fill="none" stroke={colors.fieldLines} strokeWidth="2" />
                    <path d={`M ${FIELD_W - 16} ${FIELD_H} A 16 16 0 0 1 ${FIELD_W} ${FIELD_H - 16}`} fill="none" stroke={colors.fieldLines} strokeWidth="2" />

                    {/* Jerseys (11 slots) */}
                    {Object.entries(layout).map(([slotIdx, pos]) => {
                        const player = pos.playerId ? playerById[pos.playerId] : null;
                        const cx = pos.x * FIELD_W;
                        const cy = pos.y * FIELD_H;
                        const isDragging = draggedSlot === Number(slotIdx);
                        const isGk = pos.role === 'GOL';
                        const fillColor = isGk ? colors.jerseyGold : colors.jerseyBlue;
                        const strokeColor = isGk ? '#8B6508' : '#1E3A8A';
                        
                        return (
                            <g
                                key={slotIdx}
                                transform={`translate(${cx}, ${cy})`}
                                style={{ cursor: editable ? 'grab' : 'default', transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}
                                onPointerDown={(e) => handlePointerDown(e, Number(slotIdx))}
                            >
                                {/* Shadow */}
                                <circle r={JERSEY_R} fill="#040805" cy={isDragging ? 8 : 4} cx={isDragging ? 4 : 2} />
                                
                                {/* Jersey Base */}
                                <circle r={JERSEY_R} fill={fillColor} stroke={colors.text} strokeWidth="2" opacity={isDragging ? 0.8 : 1} 
                                        style={{ filter: isDragging ? 'brightness(1.2)' : 'none' }} />
                                
                                {/* OVR */}
                                <text y="4" textAnchor="middle" fill={colors.text} fontSize="14" fontWeight="bold" fontFamily="var(--font-mono)">
                                    {player?.ovr || '?'}
                                </text>
                                
                                {/* Player Name Background */}
                                <rect x="-30" y="24" width="60" height="14" rx="4" fill="#111417" />
                                
                                {/* Player Name */}
                                <text y="34" textAnchor="middle" fill={colors.text} fontSize="9" fontWeight="600" fontFamily="var(--font-sans)">
                                    {player?.name?.split(' ')[0]?.slice(0, 8) || 'VAZIO'}
                                </text>
                                
                                {/* Role Badge Background */}
                                <rect x="-16" y="40" width="32" height="12" rx="2" fill={colors.panelElevated} stroke={colors.border} strokeWidth="1" />
                                
                                {/* Role */}
                                <text y="49" textAnchor="middle" fill={colors.secondary} fontSize="8" fontWeight="bold" fontFamily="var(--font-mono)">
                                    {pos.role}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div style={{ fontSize: '0.8rem', color: colors.textMuted, textAlign: 'center', fontFamily: 'var(--font-mono)', padding: '8px', backgroundColor: '#0E1F14', }}>
                {editable ? '👆 ARRASTE OS JOGADORES PARA AJUSTAR O POSICIONAMENTO EM CAMPO' : '👁️ VISUALIZAÇÃO DA FORMAÇÃO TÁTICA'}
            </div>
        </div>
    );
}

function buildInitialLayout(team, formationId) {
    if (team?.formationLayout) return team.formationLayout;
    const preset = getPreset(formationId);
    const result = {};
    const titulares = (team?.squad || []).filter(p => p.isTitular).slice(0, 11);
    preset.forEach((slot, i) => {
        const player = titulares[i] || null;
        result[slot.slot] = {
            playerId: player?.id || null,
            x: slot.x,
            y: slot.y,
            role: slot.role
        };
    });
    return result;
}

export default FormationBoard;
