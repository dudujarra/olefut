import React, { useState, useEffect, useRef } from 'react';
import { FORMATION_PRESETS, getPreset, FORMATION_KEYS } from '../engine/FormationLayout';
import { Tooltip } from './Tooltip';
import { EfButton } from './ui/EfButton';

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
    }, [formation]);

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

    if (!team) return <div>Time não encontrado.</div>;

    const playerById = {};
    (team.squad || []).forEach(p => { playerById[p.id] = p; });

    return (
        <div className="formation-board" style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            {/* Formation selector */}
            <div style={{display:'flex',gap:'0.4rem',alignItems:'center',flexWrap:'wrap'}}>
                <span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>Formação:</span>
                {FORMATION_KEYS.map(k => (
                    <Tooltip key={k} content={`Mudar para ${k} — reorganiza posições padrão`}>
                        <EfButton
                            variant={formation === k ? 'primary' : 'secondary'} size="sm"
                            onClick={() => setFormation(k)}
                        >
                            {k}
                        </EfButton>
                    </Tooltip>
                ))}
                <Tooltip content="Voltar para posições padrão da formação atual">
                    <EfButton variant="secondary" size="sm" onClick={resetToPreset}>↺ Reset</EfButton>
                </Tooltip>
                {onSave && (
                    <EfButton variant="primary" size="sm" onClick={handleSave} style={{marginLeft:'auto'}}>
                        💾 Salvar
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
                    background: '#2D6A4F',
                    border: '3px solid #6B4226',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: draggedSlot !== null ? 'grabbing' : 'default',
                    touchAction: 'none'
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} width="100%" height="100%" style={{display:'block'}}>
                    {/* Field lines */}
                    <rect x="2" y="2" width={FIELD_W - 4} height={FIELD_H - 4} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <line x1="0" y1={FIELD_H / 2} x2={FIELD_W} y2={FIELD_H / 2} stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <circle cx={FIELD_W / 2} cy={FIELD_H / 2} r="48" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    {/* Top goal box */}
                    <rect x={FIELD_W / 2 - 80} y="0" width="160" height="60" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <rect x={FIELD_W / 2 - 36} y="0" width="72" height="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    {/* Bottom goal box */}
                    <rect x={FIELD_W / 2 - 80} y={FIELD_H - 60} width="160" height="60" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <rect x={FIELD_W / 2 - 36} y={FIELD_H - 22} width="72" height="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />

                    {/* Jerseys (11 slots) */}
                    {Object.entries(layout).map(([slotIdx, pos]) => {
                        const player = pos.playerId ? playerById[pos.playerId] : null;
                        const cx = pos.x * FIELD_W;
                        const cy = pos.y * FIELD_H;
                        const isDragging = draggedSlot === Number(slotIdx);
                        const fillColor = pos.role === 'GOL' ? '#FFD700' : '#1E40AF';
                        return (
                            <g
                                key={slotIdx}
                                transform={`translate(${cx}, ${cy})`}
                                style={{ cursor: editable ? 'grab' : 'default' }}
                                onPointerDown={(e) => handlePointerDown(e, Number(slotIdx))}
                            >
                                <circle r={JERSEY_R} fill={fillColor} stroke="#000" strokeWidth="2" opacity={isDragging ? 0.7 : 1} />
                                <text y="3" textAnchor="middle" fill="#FFD700" fontSize="13" fontWeight="700" fontFamily="monospace">
                                    {player?.ovr || '?'}
                                </text>
                                <text y="32" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="600" fontFamily="sans-serif">
                                    {player?.name?.split(' ')[0]?.slice(0, 8) || 'Vazio'}
                                </text>
                                <text y="44" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="monospace">
                                    {pos.role}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div style={{fontSize:'0.75rem',color:'var(--text-muted)',textAlign:'center'}}>
                {editable ? '👆 Arraste as camisas para ajustar posicionamento (mais avançado/recuado/lados)' : '👁️ Visualização da formação'}
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
