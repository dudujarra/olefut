/**
 * StyleguideView — /dev/styleguide
 *
 * Renderiza paleta + tipos + componentes Stitch pra QA visual.
 * Apenas em dev (acessível via changeView('styleguide')).
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { EfButton, EfCardPlayer, EfTooltip, EfModal, EfInput } from './ui';
import { EfPanel } from './ui/EfPanel';
import bgManagerOffice from '../assets/environments/bg_manager_office.png';

const PALETTE = [
    { group: 'Grass', tokens: ['grass-900', 'grass-800', 'grass-700', 'grass-500', 'grass-300', 'grass-100'] },
    { group: 'Funcional', tokens: ['func-success', 'func-warning', 'func-danger', 'func-info', 'func-mute'] },
    { group: 'Brasil', tokens: ['br-yellow', 'br-blue', 'br-white'] },
    { group: 'Neutral', tokens: ['neutral-bg', 'neutral-bg-elev', 'neutral-bg-card', 'neutral-text-hi', 'neutral-text-md', 'neutral-text-lo'] }
];

const FONTS = [
    { label: 'display 48', size: '48px', family: "\"Press Start 2P\", monospace" },
    { label: 'h1 32', size: '32px', family: "\"Press Start 2P\", monospace" },
    { label: 'h2 24', size: '24px', family: "\"Press Start 2P\", monospace" },
    { label: 'subtitle 18', size: '18px', family: 'monospace' },
    { label: 'bodyL 16', size: '16px', family: 'monospace' },
    { label: 'body 14', size: '14px', family: 'monospace' },
    { label: 'caption 12', size: '12px', family: 'monospace' },
    { label: 'mono 14', size: '14px', family: "\"Press Start 2P\", monospace" }
];

export function StyleguideView() {
    const { changeView, getDashboardView } = useGame();
    const [modalOpen, setModalOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const samplePlayer = {
        id: 1, name: 'Ronaldinho', position: 'ATA', age: 28,
        ovr: 92, energy: 75, moral: 88
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
            color: '#E2E8F0'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>🎨 STYLEGUIDE v1.0</h2>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← VOLTAR</EfButton>
                </EfPanel>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
                    {/* PALETTE */}
                    <EfPanel variant="sunk" padding="md">
                        <h3 style={{ marginTop: 0 }}>Paleta (24 cores)</h3>
                        {PALETTE.map(group => (
                            <div key={group.group} style={{ marginBottom: '12px' }}>
                                <h4 style={{ fontSize: '14px', color: '#888', margin: '0 0 8px' }}>{group.group}</h4>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {group.tokens.map(t => (
                                        <div key={t} style={{
                                            width: '60px',
                                            height: '60px',
                                            background: '#1E2124',
                                            border: '2px solid #111417',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            padding: '4px',
                                            fontSize: '9px',
                                            fontFamily: "'Press Start 2P', monospace",
                                            color: t.includes('text-lo') || t.includes('grass-100') || t.includes('br-yellow') ? '#000' : '#fff'
                                        }}>
                                            {t}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </EfPanel>

                    {/* TYPOGRAPHY */}
                    <EfPanel variant="sunk" padding="md">
                        <h3 style={{ marginTop: 0 }}>Tipografia</h3>
                        {FONTS.map(f => (
                            <div key={f.label} style={{
                                fontSize: f.size,
                                fontFamily: f.family,
                                marginBottom: '12px',
                                color: '#E2E8F0'
                            }}>
                                <span style={{ color: '#888', fontSize: '12px', fontFamily: "'Press Start 2P', monospace" }}>{f.label}</span>
                                {' — '}
                                OLÉ FUT 1234567890
                            </div>
                        ))}
                    </EfPanel>

                    {/* BUTTONS */}
                    <EfPanel variant="sunk" padding="md">
                        <h3 style={{ marginTop: 0 }}>EfButton</h3>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <EfButton variant="primary" size="lg">Primary LG</EfButton>
                            <EfButton variant="primary" size="md">Primary MD</EfButton>
                            <EfButton variant="primary" size="sm">Primary SM</EfButton>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <EfButton variant="secondary">Secondary</EfButton>
                            <EfButton variant="danger">Danger</EfButton>
                            <EfButton variant="ghost">Ghost</EfButton>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <EfButton variant="primary" disabled>Disabled</EfButton>
                            <EfButton variant="primary" loading>Loading</EfButton>
                            <EfButton variant="primary" icon="⚽">Com ícone</EfButton>
                        </div>
                    </EfPanel>

                    {/* CARD PLAYER */}
                    <EfPanel variant="sunk" padding="md">
                        <h3 style={{ marginTop: 0 }}>EfCardPlayer</h3>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <EfCardPlayer player={samplePlayer} />
                            <EfCardPlayer player={samplePlayer} layout="column" />
                            <EfCardPlayer player={samplePlayer} badge="LEN" selected />
                        </div>
                    </EfPanel>

                    {/* INPUT & TOOLTIP */}
                    <EfPanel variant="sunk" padding="md">
                        <h3 style={{ marginTop: 0 }}>EfInput & EfTooltip</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '320px', marginBottom: '16px' }}>
                            <EfInput
                                label="Nome"
                                placeholder="Digite seu nome"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                helper="Nome do manager"
                            />
                            <EfInput label="Email" type="email" error="Email inválido" />
                            <EfInput label="Idade" type="number" disabled />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <EfTooltip content="Tooltip info default">
                                <EfButton variant="secondary">Info</EfButton>
                            </EfTooltip>
                            <EfTooltip content="Tooltip success" color="success">
                                <EfButton variant="primary">Success</EfButton>
                            </EfTooltip>
                            <EfTooltip content="Tooltip warning" color="warning">
                                <EfButton variant="ghost">Warning</EfButton>
                            </EfTooltip>
                            <EfTooltip content="Tooltip danger" color="danger">
                                <EfButton variant="danger">Danger</EfButton>
                            </EfTooltip>
                        </div>
                    </EfPanel>

                    {/* MODAL & SPACING */}
                    <EfPanel variant="sunk" padding="md">
                        <h3 style={{ marginTop: 0 }}>EfModal & Spacing</h3>
                        <div style={{ marginBottom: '16px' }}>
                            <EfButton variant="primary" onClick={() => setModalOpen(true)}>Abrir Modal</EfButton>
                            <EfModal
                                open={modalOpen}
                                onClose={() => setModalOpen(false)}
                                title="Modal de exemplo"
                                size="md"
                                footer={
                                    <>
                                        <EfButton variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</EfButton>
                                        <EfButton variant="primary" onClick={() => setModalOpen(false)}>Confirmar</EfButton>
                                    </>
                                }
                            >
                                <p>Conteúdo do modal. Esc fecha. Click backdrop fecha.</p>
                                <p>Beveled border + slide down animation 200ms.</p>
                            </EfModal>
                        </div>
                        
                        <h4 style={{ margin: '0 0 8px 0' }}>Spacing (grid 8px sagrado)</h4>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                <div key={n} style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: `${n * 8}px`,
                                        height: '40px',
                                        background: '#39FF14',
                                        border: '1px solid #111417',
                                        marginBottom: '4px'
                                    }} />
                                    <span style={{ fontSize: '10px', fontFamily: "'Press Start 2P', monospace" }}>
                                        sp-{n}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </EfPanel>
                </div>
            </div>
        </div>
    );
}

export default StyleguideView;
