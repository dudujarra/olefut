import { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
    listSaveSlots,
    saveToSlot,
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
    // BUG-081 fix: useState initializer evita setState em useEffect com []
    const [slots, setSlots] = useState(() => listSaveSlots());
    const [importingSlot, setImportingSlot] = useState(null);

    const refresh = () => setSlots(listSaveSlots());

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
        <div className="ef-anim-fade-in ef-scene-shell" style={{ backgroundImage: `url(${bgManagerOffice})` }}>
            <div className="ef-view-container ef-view-container--narrow">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-view-header" style={{ borderBottom: '2px solid #40BAF7' }}>
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <FloppyDisk size={28} color="#40BAF7" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title">MEMORY CARD</h2>
                            <span className="ef-view-header__subtitle">GERENCIADOR DE SAVES</span>
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
                            borderLeft: `4px solid ${slot.empty ? '#2D3748' : '#39FF14'}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <div className="ef-sans ef-text-main" style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '12px' }}>
                                        SLOT {slot.slot}
                                    </div>
                                    {slot.empty ? (
                                        <div className="ef-mono" style={{
                                            fontSize: '0.9rem',
                                            color: slot.corrupted ? '#FF3333' : '#8E9E94',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            {slot.corrupted ? (
                                                <><WarningCircle size={16} color="#FF3333" /> CORROMPIDO</>
                                            ) : (
                                                <><FileCode size={16} /> VAZIO</>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="ef-sans ef-text-primary" style={{
                                                fontSize: '1rem',
                                                marginBottom: '8px',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <CheckCircle size={16} /> {slot.managerName} — {slot.teamName}
                                            </div>
                                            <div className="ef-mono ef-text-muted" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                                                TEMPORADA {slot.seasonNumber} • SEMANA {slot.week}
                                            </div>
                                            <div className="ef-sans ef-text-muted" style={{ fontSize: '0.75rem' }}>
                                                SALVO EM: {new Date(slot.savedAt).toLocaleString('pt-BR')}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Memory card icon indicator */}
                                <div className={`ef-slot-card__mc ${slot.empty ? 'ef-slot-card__mc--empty' : 'ef-slot-card__mc--filled'}`}>
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
                                            className="ef-text-info"
                                            style={{ borderColor: '#40BAF7' }}
                                        >
                                            <DownloadSimple size={16} /> EXPORTAR
                                        </EfButton>
                                        <EfButton
                                            variant="secondary"
                                            onClick={() => handleDelete(slot.slot)}
                                            className="ef-text-danger"
                                            style={{ borderColor: '#FF3333' }}
                                        >
                                            <Trash size={16} /> DELETAR
                                        </EfButton>
                                    </>
                                )}

                                <EfButton
                                    variant="secondary"
                                    onClick={() => setImportingSlot(slot.slot)}
                                    className="ef-text-accent"
                                    style={{ borderColor: '#FFD700' }}
                                >
                                    <UploadSimple size={16} /> IMPORTAR
                                </EfButton>
                            </div>

                            {/* IMPORT FILE INPUT */}
                            {importingSlot === slot.slot && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    backgroundColor: '#0D1117',
                                    border: '1px dashed #FFD700'
                                }}>
                                    <div className="ef-sans ef-text-main" style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: 'bold' }}>
                                        Selecione o arquivo de save (.json):
                                    </div>
                                    <input
                                        type="file"
                                        accept="application/json"
                                        onChange={(e) => handleImport(slot.slot, e.target.files?.[0])}
                                        className="ef-mono ef-text-main"
                                        style={{
                                            marginBottom: '16px',
                                            display: 'block',
                                            width: '100%',
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
