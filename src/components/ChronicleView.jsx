/**
 * ChronicleView — SPEC-082: Crônica do Save
 * Stitch v1.1 port (AKITA-391): match docs/stitch-designs/v1.1-all/21-ol-fut-chronicle-cr-nica-do-save.html
 * Tokens-only — zero raw hex, brand fonts (Press Start 2P / Pixelify Sans / IBM Plex Mono).
 *
 * Faithful to Stitch layout: hero banner (LIVE FEED) + 4/8 grid
 * (left aside: narrative-view toggle + manager bio · right: terminal panel with chapters + export actions).
 *
 * ZERO engine/business-logic changes — apenas reorganização visual.
 */

import { useState, useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ViewOnboarding } from './ViewOnboarding';
import { ChronicleService } from '../services/ChronicleService';
import { EfPanel, EfButton } from './ui';
import '../styles/chronicle-view.css';

import {
    Article, ArrowLeft, Image as ImageIcon, FileCode,
    CalendarBlank, Infinity as InfinityIcon, RadioButton,
    Buildings, Info, Trophy, ChartLineUp,
} from '@phosphor-icons/react';

/**
 * Parse markdown-ish content from ChronicleService into structured chapters.
 * Returns array of { type: 'chapter'|'paragraph', title?, body }.
 */
function parseChronicle(md) {
    if (!md || typeof md !== 'string') return [];
    const lines = md.split('\n');
    const blocks = [];
    let currentChapter = null;
    let buffer = [];

    function flushParagraph() {
        const text = buffer.join('\n').trim();
        buffer = [];
        if (!text) return;
        if (currentChapter) {
            currentChapter.body = currentChapter.body
                ? `${currentChapter.body}\n\n${text}`
                : text;
        } else {
            blocks.push({ type: 'paragraph', body: text });
        }
    }

    for (const raw of lines) {
        const line = raw.replace(/\r$/, '');
        if (line.startsWith('# ')) {
            flushParagraph();
            if (currentChapter) blocks.push(currentChapter);
            currentChapter = { type: 'chapter', title: line.slice(2).trim(), body: '' };
        } else if (line.startsWith('## ')) {
            flushParagraph();
            if (currentChapter) blocks.push(currentChapter);
            currentChapter = { type: 'chapter', title: line.slice(3).trim(), body: '' };
        } else if (line.trim() === '') {
            flushParagraph();
        } else {
            buffer.push(line);
        }
    }
    flushParagraph();
    if (currentChapter) blocks.push(currentChapter);

    return blocks;
}

/**
 * Compute manager bio stats from engine state (read-only).
 */
function deriveBio(engine) {
    if (!engine) return null;
    const manager = engine.manager || {};
    const team = manager.teamId != null ? engine.getTeam?.(manager.teamId) : null;
    const stats = engine.managerStats || { wins: 0, draws: 0, losses: 0 };
    const total = (stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0);
    const winRate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : '0.0';
    const trophies = engine.viewUnlockState?.titlesWon ?? 0;
    const seasonNumber = engine.seasonNumber ?? 1;

    return {
        name: (manager.name || 'MANAGER ALPHA').toUpperCase(),
        currentClub: (team?.name || '—').toUpperCase(),
        trophies,
        winRate,
        seasonNumber,
    };
}

export function ChronicleView() {
    const { getEngine, changeView, getDashboardView } = useGame();
    const engine = getEngine();
    const [view, setView] = useState('season');
    const [content, setContent] = useState('');

    const chronicle = useMemo(() => new ChronicleService({
        narrativeService: engine?._narrativeService,
        mythService: engine?._mythService,
        relationshipService: engine?._relationshipService,
        careerService: engine?._careerService,
    }), [engine]);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!engine) return;
        if (view === 'season') {
            const chronicles = engine.chronicles || [];
            if (chronicles.length > 0) {
                const lines = chronicles.map(c =>
                    `## Temporada ${c.season} — ${c.mood === 'triumph' ? '[TITULO]' : c.mood === 'despair' ? '[QUEDA]' : '[CRONICA]'}\n${c.chronicle}`
                );
                setContent(`# Crônicas de ${engine.manager?.name || 'Anônimo'}\n\n${lines.join('\n\n')}`);
            } else {
                setContent(chronicle.generateSeasonChronicle(engine));
            }
        } else {
            setContent(chronicle.generateLifetimeChronicle(engine));
        }
    }, [view, engine, chronicle]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const blocks = useMemo(() => parseChronicle(content), [content]);
    const bio = useMemo(() => deriveBio(engine), [engine]);

    function handleExportJSON() {
        const json = chronicle.exportSaveJSON(engine);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `olefut-save-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleExportPNG() {
        try {
            const canvas = document.createElement('canvas');
            const width = 800;
            const lineHeight = 26;
            const lines = content.split('\n');
            const height = Math.max(600, lines.length * lineHeight + 80);
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#161B22';
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = '#2D3748';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, width - 2, height - 2);

            ctx.fillStyle = '#FDFBF7';
            ctx.font = '16px monospace';
            let y = 40;
            for (const line of lines) {
                if (line.startsWith('# ')) {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 24px sans-serif';
                    ctx.fillText(line.slice(2), 30, y);
                    ctx.font = '16px monospace';
                    ctx.fillStyle = '#FDFBF7';
                    y += 10;
                } else if (line.startsWith('## ')) {
                    ctx.fillStyle = '#39FF14';
                    ctx.font = 'bold 18px sans-serif';
                    ctx.fillText(line.slice(3), 30, y);
                    ctx.font = '16px monospace';
                    ctx.fillStyle = '#FDFBF7';
                } else {
                    ctx.fillText(line, 30, y);
                }
                y += lineHeight;
            }

            ctx.fillStyle = '#8E9E94';
            ctx.font = '12px monospace';
            ctx.fillText(`OléFUT · gerado em ${new Date().toLocaleString('pt-BR')}`, 30, height - 20);

            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cronica-${view}-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
            });
        } catch (e) {
            console.error('PNG export failed:', e);
        }
    }

    if (!engine) {
        return (
            <div className="ef-mono ef-text-main ef-chron__error">
                ENGINE NÃO INICIALIZADA.
            </div>
        );
    }

    const logFile = `SAVE_LOG_${(bio?.seasonNumber ?? 1).toString().padStart(4, '0')}.TXT`;

    return (
        <div className="ef-anim-fade-in ef-scene-shell ef-chron">
            <ViewOnboarding viewId="chronicle" />
            <div className="ef-view-container">

                <EfPanel padding="lg" className="ef-view-header ef-chron__header">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <Article size={28} className="ef-chron__header-icon" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title">OLÉFUT CHRONICLE</h2>
                            <span className="ef-view-header__subtitle">CRÔNICA DO SAVE · REGISTROS HISTÓRICOS</span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* Hero banner — LIVE FEED + STADIUM 01 */}
                <div className="ef-chron__hero ef-anim-slide-down">
                    <Buildings size={120} className="ef-chron__hero-bg-icon" weight="duotone" />
                    <div className="ef-chron__hero-inner">
                        <div className="ef-chron__hero-tags">
                            <span className="ef-chron__pill-live">LIVE FEED</span>
                            <span className="ef-chron__pill-status">STADIUM 01 — OK</span>
                        </div>
                        <h3 className="ef-chron__hero-title">CRÔNICA DO SAVE</h3>
                        <p className="ef-chron__hero-tagline">
                            Manager Career Journey — a ascensão, as quedas e a glória pixelada da carreira do técnico.
                        </p>
                    </div>
                </div>

                {/* Grid: aside + terminal */}
                <div className="ef-chron__grid">

                    {/* LEFT — toggle + bio */}
                    <aside className="ef-chron__aside">

                        <div className="ef-chron__panel-frame">
                            <h4 className="ef-chron__panel-title">Narrative View</h4>
                            <div className="ef-chron__toggle-stack">
                                <button
                                    type="button"
                                    className={`ef-chron__toggle-btn${view === 'season' ? ' ef-chron__toggle-btn--active' : ''}`}
                                    onClick={() => setView('season')}
                                    aria-pressed={view === 'season'}
                                >
                                    <span className="ef-chron__toggle-btn__label">
                                        <CalendarBlank size={14} /> TEMPORADA
                                    </span>
                                    <RadioButton size={16} weight={view === 'season' ? 'fill' : 'regular'} />
                                </button>
                                <button
                                    type="button"
                                    className={`ef-chron__toggle-btn${view === 'lifetime' ? ' ef-chron__toggle-btn--active' : ''}`}
                                    onClick={() => setView('lifetime')}
                                    aria-pressed={view === 'lifetime'}
                                >
                                    <span className="ef-chron__toggle-btn__label">
                                        <InfinityIcon size={14} /> SAVE INTEIRO
                                    </span>
                                    <RadioButton size={16} weight={view === 'lifetime' ? 'fill' : 'regular'} />
                                </button>
                            </div>
                        </div>

                        {bio && (
                            <div className="ef-chron__bio">
                                <div className="ef-chron__bio-banner">
                                    <Buildings size={72} className="ef-chron__bio-banner-icon" weight="duotone" />
                                    <span className="ef-chron__bio-tag">{bio.name}</span>
                                </div>
                                <div className="ef-chron__bio-body">
                                    <div className="ef-chron__bio-row">
                                        <span className="ef-chron__bio-label">Clube Atual</span>
                                        <span className="ef-chron__bio-value">{bio.currentClub}</span>
                                    </div>
                                    <div className="ef-chron__bio-row">
                                        <span className="ef-chron__bio-label">
                                            <Trophy size={12} weight="fill" className="ef-chron__bio-icon" />
                                            Títulos
                                        </span>
                                        <span className="ef-chron__bio-value">{bio.trophies}</span>
                                    </div>
                                    <div className="ef-chron__bio-row">
                                        <span className="ef-chron__bio-label">
                                            <ChartLineUp size={12} weight="bold" className="ef-chron__bio-icon" />
                                            Aproveitamento
                                        </span>
                                        <span className="ef-chron__bio-value ef-chron__bio-value--primary">{bio.winRate}%</span>
                                    </div>
                                    <div className="ef-chron__bio-row">
                                        <span className="ef-chron__bio-label">Temporada</span>
                                        <span className="ef-chron__bio-value">{bio.seasonNumber}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* RIGHT — terminal-style chronicle */}
                    <section>
                        <div className="ef-chron__terminal">
                            <div className="ef-chron__terminal-head">
                                <span>{logFile}</span>
                                <div className="ef-chron__terminal-dots">
                                    <span className="ef-chron__terminal-dot" />
                                    <span className="ef-chron__terminal-dot" />
                                </div>
                            </div>

                            <div className="ef-chron__terminal-body">
                                {blocks.length === 0 && (
                                    <div className="ef-chron__terminal-empty">CARREGANDO CRÔNICA...</div>
                                )}
                                {blocks.map((b, i) => {
                                    if (b.type === 'chapter') {
                                        return (
                                            <div key={i} className="ef-chron__chapter">
                                                <h5 className="ef-chron__chapter-title">{b.title}</h5>
                                                {b.body && (
                                                    <div className="ef-chron__chapter-body">{b.body}</div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <p key={i} className="ef-chron__paragraph">{b.body}</p>
                                    );
                                })}

                                {blocks.length > 0 && bio && (
                                    <div className="ef-chron__log">
                                        <Info size={16} className="ef-chron__log-icon" weight="fill" />
                                        <span>
                                            LOG ENTRY: Temporada {bio.seasonNumber} ativa · {bio.trophies} título(s) ·
                                            aproveitamento {bio.winRate}%. Preparando próximas qualificatórias.
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="ef-chron__terminal-foot">
                                <EfButton variant="secondary" onClick={handleExportPNG}>
                                    <ImageIcon size={16} /> EXPORTAR PNG
                                </EfButton>
                                <EfButton variant="secondary" onClick={handleExportJSON}>
                                    <FileCode size={16} /> EXPORTAR JSON
                                </EfButton>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default ChronicleView;
