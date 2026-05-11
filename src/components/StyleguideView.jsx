/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { EfButton, EfCardPlayer, EfTooltip, EfModal, EfInput } from './ui';
import { EfPanel } from './ui/EfPanel';
import bgManagerOffice from '../assets/environments/bg_manager_office.png';
import { PaintBrush, ArrowLeft, TextAa, Cube, ListDashes, SquaresFour } from '@phosphor-icons/react';

const PALETTE = [
    { group: 'Backgrounds', tokens: [{name: 'bg', hex: '#0D1117'}, {name: 'panelBg', hex: '#161B22'}, {name: 'panelElevated', hex: '#1A1F24'}] },
    { group: 'Borders & Text', tokens: [{name: 'border', hex: '#2D3748'}, {name: 'text', hex: '#FDFBF7'}, {name: 'textMuted', hex: '#8E9E94'}] },
    { group: 'Accents', tokens: [{name: 'accent', hex: '#39FF14'}, {name: 'secondary', hex: '#40BAF7'}] },
    { group: 'Feedback', tokens: [{name: 'warning', hex: '#FFD700'}, {name: 'danger', hex: '#FF3333'}] }
];

const FONTS = [
    { label: 'Heading 1', size: '2rem', family: 'var(--font-sans)', weight: 'bold' },
    { label: 'Heading 2', size: '1.5rem', family: 'var(--font-sans)', weight: 'bold' },
    { label: 'Heading 3', size: '1.2rem', family: 'var(--font-sans)', weight: 'bold' },
    { label: 'Body Large', size: '1rem', family: 'var(--font-sans)', weight: 'normal' },
    { label: 'Body Small', size: '0.85rem', family: 'var(--font-sans)', weight: 'normal' },
    { label: 'Mono Large', size: '1.5rem', family: 'var(--font-mono)', weight: 'bold' },
    { label: 'Mono Normal', size: '1rem', family: 'var(--font-mono)', weight: 'normal' },
    { label: 'Mono Small', size: '0.8rem', family: 'var(--font-mono)', weight: 'normal' }
];

export function StyleguideView() {
    const { changeView, getDashboardView } = useGame();
    const [modalOpen, setModalOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const samplePlayer = {
        id: 1, name: 'Ronaldinho', position: 'ATA', age: 28,
        ovr: 92, energy: 75, moral: 88
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
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <EfPanel padding="lg" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: `2px solid ${colors.secondary}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: colors.panelElevated, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${colors.border}` }}>
                            <PaintBrush size={28} color={colors.secondary} />
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', color: colors.text, fontWeight: 'bold' }}>
                                STYLEGUIDE LUXURY ARCADE
                            </h2>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted }}>
                                DOCUMENTAÇÃO DO DESIGN SYSTEM
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> VOLTAR
                    </EfButton>
                </EfPanel>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                    {/* PALETTE */}
                    <EfPanel padding="lg">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: colors.secondary, fontWeight: 'bold' }}>
                            <PaintBrush size={20} /> PALETA DE CORES
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {PALETTE.map(group => (
                                <div key={group.group}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '8px' }}>{group.group.toUpperCase()}</div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {group.tokens.map(t => (
                                            <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '80px' }}>
                                                <div style={{
                                                    width: '100%',
                                                    height: '60px',
                                                    backgroundColor: t.hex,
                                                    border: `1px solid ${colors.border}`
                                                }} />
                                                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: colors.text }}>{t.name}</div>
                                                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: colors.textMuted }}>{t.hex}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </EfPanel>

                    {/* TYPOGRAPHY */}
                    <EfPanel padding="lg">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: colors.secondary, fontWeight: 'bold' }}>
                            <TextAa size={20} /> TIPOGRAFIA
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {FONTS.map(f => (
                                <div key={f.label} style={{
                                    borderBottom: `1px solid ${colors.border}`,
                                    paddingBottom: '12px'
                                }}>
                                    <div style={{ color: colors.textMuted, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{f.label} ({f.size}, {f.family})</div>
                                    <div style={{
                                        fontSize: f.size,
                                        fontFamily: f.family,
                                        fontWeight: f.weight,
                                        color: colors.text
                                    }}>
                                        The quick brown fox jumps over the lazy dog.
                                    </div>
                                </div>
                            ))}
                        </div>
                    </EfPanel>

                    {/* BUTTONS */}
                    <EfPanel padding="lg">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: colors.secondary, fontWeight: 'bold' }}>
                            <SquaresFour size={20} /> BOTÕES (EfButton)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '8px' }}>TAMANHOS</div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <EfButton variant="primary" size="lg">Size Large</EfButton>
                                    <EfButton variant="primary" size="md">Size Medium</EfButton>
                                    <EfButton variant="primary" size="sm">Size Small</EfButton>
                                </div>
                            </div>
                            
                            <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '8px' }}>VARIANTES</div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <EfButton variant="primary">Primary</EfButton>
                                    <EfButton variant="secondary">Secondary</EfButton>
                                    <EfButton variant="danger">Danger</EfButton>
                                    <EfButton variant="ghost">Ghost</EfButton>
                                </div>
                            </div>
                            
                            <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '8px' }}>ESTADOS</div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <EfButton variant="primary" disabled>Disabled</EfButton>
                                    <EfButton variant="primary" loading>Loading</EfButton>
                                    <EfButton variant="primary"><Cube size={16} /> Com Ícone</EfButton>
                                </div>
                            </div>
                        </div>
                    </EfPanel>

                    {/* INPUTS & MODALS */}
                    <EfPanel padding="lg">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: colors.secondary, fontWeight: 'bold' }}>
                            <ListDashes size={20} /> INPUTS & MODALS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <EfInput
                                    label="Nome de Usuário"
                                    placeholder="Digite seu nome"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    helper="Este nome será usado no jogo"
                                />
                                <EfInput label="Email" type="email" error="Formato de email inválido" value="invalid-email" />
                                <EfInput label="Idade" type="number" disabled value="25" />
                            </div>
                            
                            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '16px' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '12px' }}>MODALS</div>
                                <EfButton variant="secondary" onClick={() => setModalOpen(true)}>Abrir Modal de Exemplo</EfButton>
                                <EfModal
                                    open={modalOpen}
                                    onClose={() => setModalOpen(false)}
                                    title="Modal de Confirmação"
                                    size="md"
                                    footer={
                                        <>
                                            <EfButton variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</EfButton>
                                            <EfButton variant="primary" onClick={() => setModalOpen(false)}>Confirmar Ação</EfButton>
                                        </>
                                    }
                                >
                                    <p style={{ color: colors.text, lineHeight: '1.6' }}>Este é o novo modal no formato Bento Grid. Ele possui bordas arredondadas suaves, fundo translúcido moderno e aderência à paleta Luxury Arcade.</p>
                                </EfModal>
                            </div>
                        </div>
                    </EfPanel>
                    
                    {/* CARD PLAYER & TOOLTIPS */}
                    <EfPanel padding="lg">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: colors.secondary, fontWeight: 'bold' }}>
                            <Cube size={20} /> COMPONENTES DIVERSOS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '12px' }}>EF-CARD-PLAYER</div>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <EfCardPlayer player={samplePlayer} />
                                    <EfCardPlayer player={samplePlayer} badge="LEND" selected />
                                </div>
                            </div>
                            
                            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '16px' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '12px' }}>EF-TOOLTIP</div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <EfTooltip content="Informação básica do tooltip">
                                        <EfButton variant="secondary">Info</EfButton>
                                    </EfTooltip>
                                    <EfTooltip content="Ação executada com sucesso!" color="success">
                                        <EfButton variant="primary">Success</EfButton>
                                    </EfTooltip>
                                    <EfTooltip content="Atenção: esta ação pode ser perigosa." color="warning">
                                        <EfButton variant="ghost">Warning</EfButton>
                                    </EfTooltip>
                                    <EfTooltip content="Erro ao conectar com o servidor." color="danger">
                                        <EfButton variant="danger">Danger</EfButton>
                                    </EfTooltip>
                                </div>
                            </div>
                        </div>
                    </EfPanel>
                </div>
            </div>
        </div>
    );
}

export default StyleguideView;
