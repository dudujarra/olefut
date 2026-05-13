/**
 * SaveSlotsView — Memory Card Save Manager
 * Stitch v1.1 port (AKITA-396): match docs/stitch-designs/v1.1-all/24-memory-card-ol-fut-save-manager.html
 * Tokens-only — zero raw hex. Press Start 2P + Pixelify Sans + IBM Plex Mono via tokens.
 * Preserves all SaveSlotsService logic (save/load/delete/export/import + slot metadata).
 */

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
import '../styles/save-slots-view.css';

import {
    FloppyDisk, ArrowLeft, DownloadSimple, UploadSimple,
    Trash, WarningCircle, SimCard, Database
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
        if (!exportSlotJSON(slotNum)) {
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

    const formatDate = (iso) => {
        const d = new Date(iso);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    return (
        <div className="ef-anim-fade-in ef-scene-shell ef-mc">
            <div className="ef-mc__scanlines" aria-hidden="true" />
            <div className="ef-view-container ef-view-container--wide">

                {/* ============ HEADER ============ */}
                <EfPanel padding="lg" className="ef-view-header ef-mc__header">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box ef-mc__icon-box">
                            <SimCard size={28} className="ef-mc__header-icon" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title ef-mc__title">
                                MEMORY CARD
                            </h2>
                            <span className="ef-view-header__subtitle ef-mc__subtitle">
                                GERENCIADOR DE SAVES &middot; SLOT MANAGER
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* ============ SLOTS GRID ============ */}
                <div className="ef-mc__grid">
                    {slots.map(slot => {
                        const filled = !slot.empty;
                        return (
                            <div
                                key={slot.slot}
                                className={`ef-mc__slot ${filled ? 'ef-mc__slot--filled' : 'ef-mc__slot--empty'} ${slot.corrupted ? 'ef-mc__slot--corrupted' : ''}`}
                            >
                                {/* SLOT CARD */}
                                <div className="ef-mc__card">
                                    <div className="ef-mc__slot-tag">SLOT {slot.slot}</div>

                                    {filled ? (
                                        <>
                                            <div className="ef-mc__screen">
                                                <div className="ef-mc__screen-glyph" aria-hidden="true">
                                                    <Database size={48} weight="duotone" />
                                                </div>
                                                <div className="ef-mc__screen-mark">
                                                    {(slot.teamName || 'CLUB').slice(0, 3).toUpperCase()}
                                                </div>
                                            </div>

                                            <div className="ef-mc__rows">
                                                <div className="ef-mc__row">
                                                    <p className="ef-mc__row-label">MANAGER</p>
                                                    <p className="ef-mc__row-value">
                                                        {(slot.managerName || 'MISTER X').toUpperCase()}
                                                    </p>
                                                </div>
                                                <div className="ef-mc__row">
                                                    <p className="ef-mc__row-label">CLUB</p>
                                                    <p className="ef-mc__row-value">
                                                        {(slot.teamName || 'UNITED FC').toUpperCase()}
                                                    </p>
                                                </div>
                                                <div className="ef-mc__row-meta">
                                                    <div className="ef-mc__meta-col">
                                                        <p className="ef-mc__meta-label">INFO</p>
                                                        <p className="ef-mc__meta-value">
                                                            SEASON {slot.seasonNumber ?? '-'}/W{slot.week ?? '-'}
                                                        </p>
                                                    </div>
                                                    <div className="ef-mc__meta-col ef-mc__meta-col--right">
                                                        <p className="ef-mc__meta-label">DATE</p>
                                                        <p className="ef-mc__meta-value">
                                                            {slot.savedAt ? formatDate(slot.savedAt) : '--/--/----'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="ef-mc__empty">
                                            <WarningCircle size={56} weight="duotone" className="ef-mc__empty-icon" />
                                            <p className="ef-mc__empty-title">
                                                {slot.corrupted ? 'CORRUPTED DATA' : 'EMPTY SLOT'}
                                            </p>
                                            <p className="ef-mc__empty-sub">
                                                {slot.corrupted ? 'CHECKSUM FAILED' : 'NO DATA DETECTED'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* ACTIONS */}
                                <div className="ef-mc__actions">
                                    <EfButton
                                        variant="primary"
                                        size="sm"
                                        className="ef-mc__btn"
                                        onClick={() => handleSave(slot.slot)}
                                    >
                                        <FloppyDisk size={14} /> SALVAR
                                    </EfButton>
                                    <EfButton
                                        variant="secondary"
                                        size="sm"
                                        className="ef-mc__btn"
                                        onClick={() => handleExport(slot.slot)}
                                        disabled={!filled}
                                    >
                                        <DownloadSimple size={14} /> EXPORTAR
                                    </EfButton>
                                    <EfButton
                                        variant="secondary"
                                        size="sm"
                                        className="ef-mc__btn ef-mc__btn--danger"
                                        onClick={() => handleDelete(slot.slot)}
                                        disabled={!filled}
                                    >
                                        <Trash size={14} /> DELETAR
                                    </EfButton>
                                    <EfButton
                                        variant="secondary"
                                        size="sm"
                                        className="ef-mc__btn"
                                        onClick={() => setImportingSlot(slot.slot)}
                                    >
                                        <UploadSimple size={14} /> IMPORTAR
                                    </EfButton>
                                </div>

                                {/* IMPORT FILE INPUT (collapsible per slot) */}
                                {importingSlot === slot.slot && (
                                    <div className="ef-mc__import">
                                        <div className="ef-mc__import-label">
                                            SELECIONE ARQUIVO (.json)
                                        </div>
                                        <input
                                            type="file"
                                            accept="application/json"
                                            onChange={(e) => handleImport(slot.slot, e.target.files?.[0])}
                                            className="ef-mc__file-input"
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
                            </div>
                        );
                    })}
                </div>

                {/* ============ WARNING STRIP ============ */}
                <div className="ef-mc__warning">
                    <WarningCircle size={20} weight="fill" className="ef-mc__warning-icon" />
                    <p className="ef-mc__warning-text">
                        NÃO REMOVA O MEMORY CARD ENQUANTO O INDICADOR DE ACESSO ESTIVER PISCANDO.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SaveSlotsView;
