import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import {
    listSaveSlots,
    saveToSlot,
    loadFromSlot,
    deleteSlot,
    exportSlotJSON,
    importJSONToSlot
} from '../services/SaveSlotsService';
import { EfPanel, EfButton } from './ui';
import bgManagerOffice from '../assets/environments/bg_manager_office.png';

import { 
    FloppyDisk, ArrowLeft, DownloadSimple, UploadSimple, 
    Trash, FileCode, WarningCircle, CheckCircle
} from '@phosphor-icons/react';

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
        danger: '#FF3333'
    };

    return (
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgManagerOffice})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: colors.bg,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '24px',
            color: colors.text,
            fontFamily: 'var(--font-sans)',
            overflowY: 'auto'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* HEADER */}
                <EfPanel padding="lg" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: `2px solid ${colors.secondary}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: colors.panelElevated, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${colors.border}` }}>
                            <FloppyDisk size={28} color={colors.secondary} />
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', color: colors.text, fontWeight: 'bold' }}>
                                MEMORY CARD
                            </h2>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted }}>
                                GERENCIADOR DE SAVES
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* SLOTS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {slots.map(slot => (
                        <EfPanel key={slot.slot} padding="lg" style={{
                            borderLeft: `4px solid ${slot.empty ? colors.border : colors.accent}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <div style={{
                                        fontFamily: 'var(--font-sans)',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        color: colors.text,
                                        marginBottom: '12px'
                                    }}>
                                        SLOT {slot.slot}
                                    </div>
                                    {slot.empty ? (
                                        <div style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.9rem',
                                            color: slot.corrupted ? colors.danger : colors.textMuted,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            {slot.corrupted ? (
                                                <><WarningCircle size={16} color={colors.danger} /> CORROMPIDO</>
                                            ) : (
                                                <><FileCode size={16} /> VAZIO</>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{
                                                fontFamily: 'var(--font-sans)',
                                                fontSize: '1rem',
                                                color: colors.accent,
                                                marginBottom: '8px',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <CheckCircle size={16} /> {slot.managerName} — {slot.teamName}
                                            </div>
                                            <div style={{fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '4px'}}>
                                                TEMPORADA {slot.seasonNumber} • SEMANA {slot.week}
                                            </div>
                                            <div style={{fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: colors.textMuted}}>
                                                SALVO EM: {new Date(slot.savedAt).toLocaleString('pt-BR')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Memory card icon indicator */}
                                <div style={{
                                    width: '48px', height: '48px',
                                    backgroundColor: slot.empty ? colors.bg : colors.accent,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `1px solid ${slot.empty ? colors.border : 'transparent'}`,
                                    color: slot.empty ? colors.border : '#000'
                                }}>
                                    <FloppyDisk size={24} weight={slot.empty ? "regular" : "fill"} />
                                </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <EfButton
                                    variant="primary"
                                    onClick={() => handleSave(slot.slot)}
                                >
                                    <FloppyDisk size={16} /> SALVAR JOGO
                                </EfButton>
                                
                                {!slot.empty && (
                                    <>
                                        <EfButton
                                            variant="secondary"
                                            onClick={() => handleExport(slot.slot)}
                                            style={{ color: colors.secondary, borderColor: colors.secondary }}
                                        >
                                            <DownloadSimple size={16} /> EXPORTAR
                                        </EfButton>
                                        <EfButton
                                            variant="secondary"
                                            onClick={() => handleDelete(slot.slot)}
                                            style={{ color: colors.danger, borderColor: colors.danger }}
                                        >
                                            <Trash size={16} /> DELETAR
                                        </EfButton>
                                    </>
                                )}
                                
                                <EfButton
                                    variant="secondary"
                                    onClick={() => setImportingSlot(slot.slot)}
                                    style={{ color: colors.warning, borderColor: colors.warning }}
                                >
                                    <UploadSimple size={16} /> IMPORTAR
                                </EfButton>
                            </div>

                            {/* IMPORT FILE INPUT */}
                            {importingSlot === slot.slot && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    backgroundColor: colors.bg,
                                    border: `1px dashed ${colors.warning}`,
                                    }}>
                                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: colors.text, marginBottom: '12px', fontWeight: 'bold' }}>
                                        Selecione o arquivo de save (.json):
                                    </div>
                                    <input
                                        type="file"
                                        accept="application/json"
                                        onChange={(e) => handleImport(slot.slot, e.target.files?.[0])}
                                        style={{
                                            color: colors.text,
                                            marginBottom: '16px',
                                            display: 'block',
                                            width: '100%',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                    <EfButton
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setImportingSlot(null)}
                                    >
                                        CANCELAR
                                    </EfButton>
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
