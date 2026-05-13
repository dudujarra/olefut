import { useState, useEffect, useRef } from 'react';
import { FORMATION_PRESETS, getPreset, FORMATION_KEYS } from '../engine/FormationLayout';
import { EfTooltip, EfButton } from './ui';
import { ArrowsClockwise, FloppyDisk } from '@phosphor-icons/react';
import '../styles/formation-board.css';

const FIELD_W = 600;
const FIELD_H = 400;
const JERSEY_R = 22;

const FIELD_LINE = 'var(--ef-form-field-lines)';

/**
 * FormationBoard — Drag/drop visual editor for tactical positioning
 */
export function FormationBoard({ team, onSave, onChange, editable = true }) {
    const [formation, setFormation] = useState(team?.formation || '4-3-3');
    const [layout, setLayout] = useState(() => buildInitialLayout(team, team?.formation || '4-3-3'));
    const [draggedSlot, setDraggedSlot] = useState(null);
    const fieldRef = useRef(null);

    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    useEffect(() => {
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

    if (!team) return <div className="ef-form__empty-text">Time não encontrado.</div>;

    const playerById = {};
    (team.squad || []).forEach(p => { playerById[p.id] = p; });

    return (
        <div className="formation-board ef-form">
            <div className="ef-form__toolbar">
                <span className="ef-form__toolbar-label">ESQUEMA:</span>
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

                <div className="ef-form__toolbar-spacer" />

                <EfTooltip content="Voltar para posições padrão da formação atual">
                    <EfButton variant="secondary" size="sm" onClick={resetToPreset} className="ef-form__btn-icon">
                        <ArrowsClockwise size={16} /> RESET
                    </EfButton>
                </EfTooltip>

                {onSave && (
                    <EfButton variant="primary" size="sm" onClick={handleSave} className="ef-form__btn-icon">
                        <FloppyDisk size={16} weight="fill" /> SALVAR
                    </EfButton>
                )}
            </div>

            <div
                ref={fieldRef}
                className={`ef-form__field${draggedSlot !== null ? ' ef-form__field--dragging' : ''}`}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} width="100%" height="100%" className="ef-form__field-svg">
                    <rect x="4" y="4" width={FIELD_W - 8} height={FIELD_H - 8} fill="none" stroke={FIELD_LINE} strokeWidth="2" />
                    <line x1="0" y1={FIELD_H / 2} x2={FIELD_W} y2={FIELD_H / 2} stroke={FIELD_LINE} strokeWidth="2" />
                    <circle cx={FIELD_W / 2} cy={FIELD_H / 2} r="48" fill="none" stroke={FIELD_LINE} strokeWidth="2" />
                    <circle cx={FIELD_W / 2} cy={FIELD_H / 2} r="3" fill={FIELD_LINE} />

                    <rect x={FIELD_W / 2 - 100} y="0" width="200" height="70" fill="none" stroke={FIELD_LINE} strokeWidth="2" />
                    <rect x={FIELD_W / 2 - 40} y="0" width="80" height="24" fill="none" stroke={FIELD_LINE} strokeWidth="2" />
                    <path d={`M ${FIELD_W / 2 - 40} 70 A 40 40 0 0 0 ${FIELD_W / 2 + 40} 70`} fill="none" stroke={FIELD_LINE} strokeWidth="2" />

                    <rect x={FIELD_W / 2 - 100} y={FIELD_H - 70} width="200" height="70" fill="none" stroke={FIELD_LINE} strokeWidth="2" />
                    <rect x={FIELD_W / 2 - 40} y={FIELD_H - 24} width="80" height="24" fill="none" stroke={FIELD_LINE} strokeWidth="2" />
                    <path d={`M ${FIELD_W / 2 - 40} ${FIELD_H - 70} A 40 40 0 0 1 ${FIELD_W / 2 + 40} ${FIELD_H - 70}`} fill="none" stroke={FIELD_LINE} strokeWidth="2" />

                    <path d={`M 0 16 A 16 16 0 0 0 16 0`} fill="none" stroke={FIELD_LINE} strokeWidth="2" />
                    <path d={`M ${FIELD_W - 16} 0 A 16 16 0 0 0 ${FIELD_W} 16`} fill="none" stroke={FIELD_LINE} strokeWidth="2" />
                    <path d={`M 0 ${FIELD_H - 16} A 16 16 0 0 1 16 ${FIELD_H}`} fill="none" stroke={FIELD_LINE} strokeWidth="2" />
                    <path d={`M ${FIELD_W - 16} ${FIELD_H} A 16 16 0 0 1 ${FIELD_W} ${FIELD_H - 16}`} fill="none" stroke={FIELD_LINE} strokeWidth="2" />

                    {Object.entries(layout).map(([slotIdx, pos]) => {
                        const player = pos.playerId ? playerById[pos.playerId] : null;
                        const cx = pos.x * FIELD_W;
                        const cy = pos.y * FIELD_H;
                        const isDragging = draggedSlot === Number(slotIdx);
                        const isGk = pos.role === 'GOL';
                        const fillColor = isGk ? 'var(--ef-form-jersey-gold)' : 'var(--ef-form-jersey-blue)';
                        const strokeColor = isGk ? 'var(--ef-form-jersey-stroke-gold)' : 'var(--ef-form-jersey-stroke-blue)';

                        return (
                            <g
                                key={slotIdx}
                                transform={`translate(${cx}, ${cy})`}
                                style={{ cursor: editable ? 'grab' : 'default', transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}
                                onPointerDown={(e) => handlePointerDown(e, Number(slotIdx))}
                            >
                                <circle r={JERSEY_R} fill="var(--ef-form-shadow-deep)" cy={isDragging ? 8 : 4} cx={isDragging ? 4 : 2} />

                                <circle r={JERSEY_R} fill={fillColor} stroke="var(--text-main)" strokeWidth="2" opacity={isDragging ? 0.8 : 1}
                                        style={{ filter: isDragging ? 'brightness(1.2)' : 'none' }} />

                                <text y="4" textAnchor="middle" fill="var(--text-main)" fontSize="14" fontWeight="bold" fontFamily="var(--font-mono)">
                                    {player?.ovr || '?'}
                                </text>

                                <rect x="-30" y="24" width="60" height="14" rx="4" fill="var(--ef-form-field-lines)" />

                                <text y="34" textAnchor="middle" fill="var(--text-main)" fontSize="9" fontWeight="600" fontFamily="var(--font-sans)">
                                    {player?.name?.split(' ')[0]?.slice(0, 8) || 'VAZIO'}
                                </text>

                                <rect x="-16" y="40" width="32" height="12" rx="2" fill="var(--bg-panel)" stroke="var(--ef-form-soft-border)" strokeWidth="1" />

                                <text y="49" textAnchor="middle" fill="var(--ef-form-info)" fontSize="8" fontWeight="bold" fontFamily="var(--font-mono)">
                                    {pos.role}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="ef-form__hint">
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
