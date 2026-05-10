/**
 * SaveSlotsView — SPEC-074
 *
 * 3 slots UI: load/save/delete/export/import.
 * 
 * 16-BIT BRUTALIST ARCADE AESTHETIC — Memory Card style
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
            color: '#E2E8F0',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* HEADER */}
                <div style={{
                    background: '#1E2124',
                    border: '4px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 8px 0 rgba(0,0,0,0.8)'
                }}>
                    <div>
                        <h2 style={{fontFamily: "'Press Start 2P', monospace", color: '#FFD700', margin: '0 0 8px 0', fontSize: '1rem', textShadow: '3px 3px 0 #000'}}>
                            MEMORY CARD
                        </h2>
                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#888'}}>3 SAVE SLOTS</span>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>SAIR</EfButton>
                </div>

                {/* SLOTS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {slots.map(slot => (
                        <div key={slot.slot} style={{
                            background: '#1E2124',
                            border: '4px solid',
                            borderColor: slot.empty ? '#333 #111 #111 #333' : '#4A5059 #111417 #111417 #4A5059',
                            padding: '20px',
                            boxShadow: slot.empty ? 'none' : '0 4px 0 rgba(0,0,0,0.5)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <div style={{
                                        fontFamily: "'Press Start 2P', monospace",
                                        fontSize: '0.8rem',
                                        color: '#FFD700',
                                        marginBottom: '8px',
                                        textShadow: '2px 2px 0 #000'
                                    }}>
                                        SLOT {slot.slot}
                                    </div>
                                    {slot.empty ? (
                                        <div style={{
                                            fontFamily: "'Press Start 2P', monospace",
                                            fontSize: '0.6rem',
                                            color: slot.corrupted ? '#FF3333' : '#555'
                                        }}>
                                            {slot.corrupted ? '⚠ CORROMPIDO' : '— VAZIO —'}
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{
                                                fontFamily: "'Press Start 2P', monospace",
                                                fontSize: '0.7rem',
                                                color: '#39FF14',
                                                marginBottom: '6px'
                                            }}>
                                                {slot.managerName} — {slot.teamName}
                                            </div>
                                            <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#888'}}>
                                                TEMP {slot.seasonNumber} • SEM {slot.week}
                                            </div>
                                            <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#555', marginTop: '4px'}}>
                                                SALVO: {new Date(slot.savedAt).toLocaleString('pt-BR')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Memory card icon */}
                                <div style={{
                                    width: '40px', height: '40px',
                                    background: slot.empty ? '#222' : '#39FF14',
                                    border: '3px solid #000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.2)'
                                }}>
                                    💾
                                </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <div
                                    onClick={() => handleSave(slot.slot)}
                                    style={{
                                        background: '#0A1A0A', border: '4px solid', borderColor: '#39FF14 #1A8A0A #1A8A0A #39FF14',
                                        padding: '8px 16px', cursor: 'pointer',
                                        fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#39FF14'
                                    }}
                                >
                                    SALVAR
                                </div>
                                {!slot.empty && (
                                    <>
                                        <div
                                            onClick={() => handleExport(slot.slot)}
                                            style={{
                                                background: '#111', border: '4px solid', borderColor: '#40BAF7 #2070A0 #2070A0 #40BAF7',
                                                padding: '8px 16px', cursor: 'pointer',
                                                fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#40BAF7'
                                            }}
                                        >
                                            EXPORTAR
                                        </div>
                                        <div
                                            onClick={() => handleDelete(slot.slot)}
                                            style={{
                                                background: '#1A0A0A', border: '4px solid', borderColor: '#FF3333 #AA1111 #AA1111 #FF3333',
                                                padding: '8px 16px', cursor: 'pointer',
                                                fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#FF3333'
                                            }}
                                        >
                                            DELETAR
                                        </div>
                                    </>
                                )}
                                <div
                                    onClick={() => setImportingSlot(slot.slot)}
                                    style={{
                                        background: '#111', border: '4px solid', borderColor: '#FFD700 #AA8800 #AA8800 #FFD700',
                                        padding: '8px 16px', cursor: 'pointer',
                                        fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#FFD700'
                                    }}
                                >
                                    IMPORTAR
                                </div>
                            </div>

                            {/* IMPORT FILE INPUT */}
                            {importingSlot === slot.slot && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    background: '#111',
                                    border: '4px dashed #FFD700'
                                }}>
                                    <input
                                        type="file"
                                        accept="application/json"
                                        onChange={(e) => handleImport(slot.slot, e.target.files?.[0])}
                                        style={{
                                            color: '#FFF',
                                            marginBottom: '12px',
                                            display: 'block',
                                            width: '100%',
                                            fontFamily: "'Press Start 2P', monospace",
                                            fontSize: '0.5rem'
                                        }}
                                    />
                                    <div
                                        onClick={() => setImportingSlot(null)}
                                        style={{
                                            background: '#111', border: '4px solid', borderColor: '#333 #000 #000 #333',
                                            padding: '8px 16px', cursor: 'pointer', display: 'inline-block',
                                            fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#888'
                                        }}
                                    >
                                        CANCELAR
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SaveSlotsView;
