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
        <div className="main-content fade-in">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>💾 Save Slots (3)</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(getDashboardView())}>← Voltar</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {slots.map(slot => (
                    <div key={slot.slot} className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Slot {slot.slot}</h3>
                                {slot.empty ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                                        {slot.corrupted ? '⚠️ Corrompido' : 'Vazio'}
                                    </p>
                                ) : (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <div><strong>{slot.managerName}</strong> — {slot.teamName}</div>
                                        <div>Temporada {slot.seasonNumber} • Semana {slot.week}</div>
                                        <div style={{ fontSize: '0.7rem' }}>Salvo: {new Date(slot.savedAt).toLocaleString('pt-BR')}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-sm btn-primary" onClick={() => handleSave(slot.slot)}>
                                💾 Salvar Aqui
                            </button>
                            {!slot.empty && (
                                <>
                                    <button className="btn btn-sm btn-secondary" onClick={() => handleExport(slot.slot)}>
                                        ⬇️ Exportar JSON
                                    </button>
                                    <button className="btn btn-sm btn-secondary" onClick={() => handleDelete(slot.slot)}>
                                        🗑️ Deletar
                                    </button>
                                </>
                            )}
                            <button className="btn btn-sm btn-secondary" onClick={() => setImportingSlot(slot.slot)}>
                                ⬆️ Importar JSON
                            </button>
                        </div>

                        {importingSlot === slot.slot && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <input
                                    type="file"
                                    accept="application/json"
                                    onChange={(e) => handleImport(slot.slot, e.target.files?.[0])}
                                />
                                <button className="btn btn-sm" onClick={() => setImportingSlot(null)}>Cancelar</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SaveSlotsView;
