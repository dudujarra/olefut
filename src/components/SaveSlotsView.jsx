/**
 * SaveSlotsView — SPEC-074
 *
 * 3 slots UI: load/save/delete/export/import.
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import {
    listSaveSlots,
    saveToSlot,
    loadFromSlot,
    deleteSlot,
    exportSlotJSON,
    importJSONToSlot
} from '../services/SaveSlotsService';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgManagerOffice from '../assets/environments/bg_manager_office.png';

export function SaveSlotsView() {
    const { gameState, getEngine, changeView, getDashboardView } = useGame();
    const [slots, setSlots] = useState([]);
    const [importingSlot, setImportingSlot] = useState(null);

    const refresh = () => setSlots(listSaveSlots());

    useEffect(() => {
        refresh();
    }, []);

    const handleSave = (slotNum) => {
        const engine = getEngine();
        const ok = saveToSlot(slotNum, gameState, engine);
        if (ok) {
            alert(`Save no slot ${slotNum} OK`);
            refresh();
        } else {
            alert('Erro ao salvar');
        }
    };

    const handleDelete = (slotNum) => {
        if (!confirm(`Deletar slot ${slotNum}? Irreversível.`)) return;
        if (deleteSlot(slotNum)) refresh();
    };

    const handleExport = (slotNum) => {
        if (exportSlotJSON(slotNum)) {
            // Download triggered
        } else {
            alert('Slot vazio');
        }
    };

    const handleImport = async (slotNum, file) => {
        if (!file) return;
        const result = await importJSONToSlot(slotNum, file);
        alert(result.msg);
        if (result.success) refresh();
        setImportingSlot(null);
    };

    return (
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgManagerOffice})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: '#0A130E',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: 'var(--ef-color-neutral-text-hi)'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>💾 SAVE SLOTS (3)</h2>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← VOLTAR</EfButton>
                </EfPanel>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {slots.map(slot => (
                        <EfPanel key={slot.slot} variant="sunk" padding="md">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>SLOT {slot.slot}</h3>
                                    {slot.empty ? (
                                        <p style={{ color: slot.corrupted ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                                            {slot.corrupted ? '⚠️ CORROMPIDO' : 'VAZIO'}
                                        </p>
                                    ) : (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                            <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.95rem' }}>{slot.managerName} — {slot.teamName}</div>
                                            <div style={{ marginTop: '4px' }}>Temporada {slot.seasonNumber} • Semana {slot.week}</div>
                                            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Salvo: {new Date(slot.savedAt).toLocaleString('pt-BR')}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <EfButton variant="primary" size="sm" onClick={() => handleSave(slot.slot)}>
                                    💾 SALVAR AQUI
                                </EfButton>
                                {!slot.empty && (
                                    <>
                                        <EfButton variant="secondary" size="sm" onClick={() => handleExport(slot.slot)}>
                                            ⬇️ EXPORTAR JSON
                                        </EfButton>
                                        <EfButton variant="danger" size="sm" onClick={() => handleDelete(slot.slot)} style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}>
                                            🗑️ DELETAR
                                        </EfButton>
                                    </>
                                )}
                                <EfButton variant="secondary" size="sm" onClick={() => setImportingSlot(slot.slot)}>
                                    ⬆️ IMPORTAR JSON
                                </EfButton>
                            </div>

                            {importingSlot === slot.slot && (
                                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px dashed var(--border-subtle)' }}>
                                    <input
                                        type="file"
                                        accept="application/json"
                                        onChange={(e) => handleImport(slot.slot, e.target.files?.[0])}
                                        style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', width: '100%' }}
                                    />
                                    <EfButton variant="secondary" size="sm" onClick={() => setImportingSlot(null)}>CANCELAR</EfButton>
                                </div>
                            )}
                        </EfPanel>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SaveSlotsView;
