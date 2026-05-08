/**
 * StyleguideView — /dev/styleguide
 *
 * Renderiza paleta + tipos + componentes Stitch pra QA visual.
 * Apenas em dev (acessível via changeView('styleguide')).
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { EfButton, EfCardPlayer, EfTooltip, EfModal, EfInput } from './ui';

const PALETTE = [
    { group: 'Grass', tokens: ['grass-900', 'grass-800', 'grass-700', 'grass-500', 'grass-300', 'grass-100'] },
    { group: 'Funcional', tokens: ['func-success', 'func-warning', 'func-danger', 'func-info', 'func-mute'] },
    { group: 'Brasil', tokens: ['br-yellow', 'br-blue', 'br-white'] },
    { group: 'Neutral', tokens: ['neutral-bg', 'neutral-bg-elev', 'neutral-bg-card', 'neutral-text-hi', 'neutral-text-md', 'neutral-text-lo'] }
];

const FONTS = [
    { label: 'display 48', size: '48px', family: 'var(--ef-font-family-display)' },
    { label: 'h1 32', size: '32px', family: 'var(--ef-font-family-display)' },
    { label: 'h2 24', size: '24px', family: 'var(--ef-font-family-display)' },
    { label: 'subtitle 18', size: '18px', family: 'var(--ef-font-family-body)' },
    { label: 'bodyL 16', size: '16px', family: 'var(--ef-font-family-body)' },
    { label: 'body 14', size: '14px', family: 'var(--ef-font-family-body)' },
    { label: 'caption 12', size: '12px', family: 'var(--ef-font-family-body)' },
    { label: 'mono 14', size: '14px', family: 'var(--ef-font-family-mono)' }
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
        <div className="main-content fade-in" style={{ padding: 'var(--ef-space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--ef-space-5)' }}>
                <h2 style={{ margin: 0 }}>🎨 Styleguide v1.0</h2>
                <EfButton variant="ghost" size="sm" onClick={() => changeView(getDashboardView())}>← Voltar</EfButton>
            </div>

            {/* PALETTE */}
            <section style={{ marginBottom: 'var(--ef-space-6)' }}>
                <h3>Paleta (24 cores)</h3>
                {PALETTE.map(group => (
                    <div key={group.group} style={{ marginBottom: 'var(--ef-space-3)' }}>
                        <h4 style={{ fontSize: '14px', color: 'var(--ef-text-md)', margin: '0 0 8px' }}>{group.group}</h4>
                        <div style={{ display: 'flex', gap: 'var(--ef-space-2)', flexWrap: 'wrap' }}>
                            {group.tokens.map(t => (
                                <div key={t} style={{
                                    width: '80px',
                                    height: '80px',
                                    background: `var(--ef-color-${t})`,
                                    border: '2px solid var(--ef-bevel-dark)',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    padding: '4px',
                                    fontSize: '10px',
                                    fontFamily: 'var(--ef-font-family-mono)',
                                    color: t.includes('text-lo') || t.includes('grass-100') || t.includes('br-yellow') ? '#000' : '#fff'
                                }}>
                                    {t}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            {/* TYPOGRAPHY */}
            <section style={{ marginBottom: 'var(--ef-space-6)' }}>
                <h3>Tipografia</h3>
                {FONTS.map(f => (
                    <div key={f.label} style={{
                        fontSize: f.size,
                        fontFamily: f.family,
                        marginBottom: 'var(--ef-space-2)',
                        color: 'var(--ef-text-hi)'
                    }}>
                        <span style={{ color: 'var(--ef-text-md)', fontSize: '12px', fontFamily: 'var(--ef-font-family-mono)' }}>{f.label}</span>
                        {' — '}
                        ELIFOOT 1234567890
                    </div>
                ))}
            </section>

            {/* BUTTONS */}
            <section style={{ marginBottom: 'var(--ef-space-6)' }}>
                <h3>EfButton</h3>
                <div style={{ display: 'flex', gap: 'var(--ef-space-2)', flexWrap: 'wrap', marginBottom: 'var(--ef-space-2)' }}>
                    <EfButton variant="primary" size="lg">Primary LG</EfButton>
                    <EfButton variant="primary" size="md">Primary MD</EfButton>
                    <EfButton variant="primary" size="sm">Primary SM</EfButton>
                </div>
                <div style={{ display: 'flex', gap: 'var(--ef-space-2)', flexWrap: 'wrap', marginBottom: 'var(--ef-space-2)' }}>
                    <EfButton variant="secondary">Secondary</EfButton>
                    <EfButton variant="danger">Danger</EfButton>
                    <EfButton variant="ghost">Ghost</EfButton>
                </div>
                <div style={{ display: 'flex', gap: 'var(--ef-space-2)', flexWrap: 'wrap' }}>
                    <EfButton variant="primary" disabled>Disabled</EfButton>
                    <EfButton variant="primary" loading>Loading</EfButton>
                    <EfButton variant="primary" icon="⚽">Com ícone</EfButton>
                </div>
            </section>

            {/* CARD PLAYER */}
            <section style={{ marginBottom: 'var(--ef-space-6)' }}>
                <h3>EfCardPlayer</h3>
                <div style={{ display: 'flex', gap: 'var(--ef-space-3)', flexWrap: 'wrap' }}>
                    <EfCardPlayer player={samplePlayer} />
                    <EfCardPlayer player={samplePlayer} layout="column" />
                    <EfCardPlayer player={samplePlayer} badge="LEN" selected />
                </div>
            </section>

            {/* INPUT */}
            <section style={{ marginBottom: 'var(--ef-space-6)' }}>
                <h3>EfInput</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ef-space-3)', maxWidth: '320px' }}>
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
            </section>

            {/* TOOLTIP */}
            <section style={{ marginBottom: 'var(--ef-space-6)' }}>
                <h3>EfTooltip</h3>
                <div style={{ display: 'flex', gap: 'var(--ef-space-3)', flexWrap: 'wrap' }}>
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
            </section>

            {/* MODAL */}
            <section style={{ marginBottom: 'var(--ef-space-6)' }}>
                <h3>EfModal</h3>
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
            </section>

            {/* SPACING */}
            <section style={{ marginBottom: 'var(--ef-space-6)' }}>
                <h3>Spacing (grid 8px sagrado)</h3>
                <div style={{ display: 'flex', gap: 'var(--ef-space-2)', alignItems: 'flex-end' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                        <div key={n} style={{ textAlign: 'center' }}>
                            <div style={{
                                width: `var(--ef-space-${n})`,
                                height: '40px',
                                background: 'var(--ef-color-grass-500)',
                                border: '1px solid var(--ef-bevel-dark)',
                                marginBottom: '4px'
                            }} />
                            <span style={{ fontSize: '10px', fontFamily: 'var(--ef-font-family-mono)' }}>
                                space-{n}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default StyleguideView;
