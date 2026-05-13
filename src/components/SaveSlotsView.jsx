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
import '../styles/save-slots-view.css';

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
                <EfPanel padding="lg" className="ef-view-header ef-save-slots__header-panel">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <FloppyDisk size={28} color="var(--info)" />
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
                <div className="ef-save-slots__container">
                    {slots.map(slot => (
                        <EfPanel key={slot.slot} padding="lg" className={`ef-save-slots__slot-panel ${!slot.empty ? 'ef-save-slots__slot-panel--filled' : ''}`}>
                            <div className="ef-save-slots__slot-header">
                                <div className="ef-save-slots__slot-info">
                                    <div className="ef-save-slots__slot-number">
                                        SLOT {slot.slot}
                                    </div>
                                    {slot.empty ? (
                                        <div className={`ef-save-slots__slot-status ${slot.corrupted ? 'ef-save-slots__slot-status--corrupted' : ''}`}>
                                            {slot.corrupted ? (
                                                <><WarningCircle size={16} color="var(--danger)" /> CORROMPIDO</>
                                            ) : (
                                                <><FileCode size={16} /> VAZIO</>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="ef-save-slots__slot-data">
                                            <div className="ef-save-slots__slot-title">
                                                <CheckCircle size={16} /> {slot.managerName} — {slot.teamName}
                                            </div>
                                            <div className="ef-save-slots__slot-info-row">
                                                TEMPORADA {slot.seasonNumber} • SEMANA {slot.week}
                                            </div>
                                            <div className="ef-save-slots__slot-info-row--date">
                                                SALVO EM: {new Date(slot.savedAt).toLocaleString('pt-BR')}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Memory card icon indicator */}
                                <div className={`ef-save-slots__slot-icon ${!slot.empty ? 'ef-save-slots__slot-icon--filled' : ''}`}>
                                    <FloppyDisk size={24} weight={slot.empty ? "regular" : "fill"} />
                                </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="ef-save-slots__actions">
                                <EfButton
                                    className="ef-save-slots__action-button"
                                    variant="primary"
                                    onClick={() => handleSave(slot.slot)}
                                >
                                    <FloppyDisk size={16} /> SALVAR JOGO
                                </EfButton>

                                {!slot.empty && (
                                    <>
                                        <EfButton
                                            className="ef-save-slots__action-button ef-save-slots__action-button--export"
                                            variant="secondary"
                                            onClick={() => handleExport(slot.slot)}
                                        >
                                            <DownloadSimple size={16} /> EXPORTAR
                                        </EfButton>
                                        <EfButton
                                            className="ef-save-slots__action-button ef-save-slots__action-button--delete"
                                            variant="secondary"
                                            onClick={() => handleDelete(slot.slot)}
                                        >
                                            <Trash size={16} /> DELETAR
                                        </EfButton>
                                    </>
                                )}

                                <EfButton
                                    className="ef-save-slots__action-button ef-save-slots__action-button--import"
                                    variant="secondary"
                                    onClick={() => setImportingSlot(slot.slot)}
                                >
                                    <UploadSimple size={16} /> IMPORTAR
                                </EfButton>
                            </div>

                            {/* IMPORT FILE INPUT */}
                            {importingSlot === slot.slot && (
                                <div className="ef-save-slots__import-section">
                                    <div className="ef-save-slots__import-label">
                                        Selecione o arquivo de save (.json):
                                    </div>
                                    <input
                                        type="file"
                                        accept="application/json"
                                        onChange={(e) => handleImport(slot.slot, e.target.files?.[0])}
                                        className="ef-save-slots__file-input"
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
