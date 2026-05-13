import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { EfButton, EfCardPlayer, EfTooltip, EfModal, EfInput } from './ui';
import { EfPanel } from './ui/EfPanel';
import bgManagerOffice from '../assets/environments/bg_manager_office.png';
import { PaintBrush, ArrowLeft, TextAa, Cube, ListDashes, SquaresFour } from '@phosphor-icons/react';
import '../styles/styleguide-view.css';

// PALETTE: hex literals intentional — this view documents the design token values
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

    return (
        <div className="ef-anim-fade-in ef-scene-shell ef-sg" style={{ backgroundImage: `url(${bgManagerOffice})` }}>
            <div className="ef-sg__container">
                <EfPanel padding="lg" className="ef-view-header ef-sg__header">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <PaintBrush size={28} className="ef-sg__header-icon" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title">
                                STYLEGUIDE LUXURY ARCADE
                            </h2>
                            <span className="ef-view-header__subtitle">
                                DOCUMENTAÇÃO DO DESIGN SYSTEM
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> VOLTAR
                    </EfButton>
                </EfPanel>

                <div className="ef-sg__grid">
                    {/* PALETTE */}
                    <EfPanel padding="lg">
                        <div className="ef-panel-section-icon-header">
                            <PaintBrush size={20} /> PALETA DE CORES
                        </div>
                        <div className="ef-sg__section">
                            {PALETTE.map(group => (
                                <div key={group.group}>
                                    <div className="ef-mono ef-text-muted ef-sg__group-label">{group.group.toUpperCase()}</div>
                                    <div className="ef-sg__chip-row">
                                        {group.tokens.map(t => (
                                            <div key={t.name} className="ef-swatch">
                                                <div className="ef-swatch__chip" style={{ backgroundColor: t.hex }} />
                                                <div className="ef-swatch__name">{t.name}</div>
                                                <div className="ef-swatch__hex">{t.hex}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </EfPanel>

                    {/* TYPOGRAPHY */}
                    <EfPanel padding="lg">
                        <div className="ef-panel-section-icon-header">
                            <TextAa size={20} /> TIPOGRAFIA
                        </div>
                        <div className="ef-sg__section">
                            {FONTS.map(f => (
                                <div key={f.label} className="ef-typo-sample">
                                    <div className="ef-typo-sample__label">{f.label} ({f.size}, {f.family})</div>
                                    <div className="ef-sg__typo-line" style={{
                                        fontSize: f.size,
                                        fontFamily: f.family,
                                        fontWeight: f.weight
                                    }}>
                                        The quick brown fox jumps over the lazy dog.
                                    </div>
                                </div>
                            ))}
                        </div>
                    </EfPanel>

                    {/* BUTTONS */}
                    <EfPanel padding="lg">
                        <div className="ef-panel-section-icon-header">
                            <SquaresFour size={20} /> BOTÕES (EfButton)
                        </div>
                        <div className="ef-sg__section">
                            <div>
                                <div className="ef-mono ef-text-muted ef-sg__group-label">TAMANHOS</div>
                                <div className="ef-sg__btn-row">
                                    <EfButton variant="primary" size="lg">Size Large</EfButton>
                                    <EfButton variant="primary" size="md">Size Medium</EfButton>
                                    <EfButton variant="primary" size="sm">Size Small</EfButton>
                                </div>
                            </div>

                            <div>
                                <div className="ef-mono ef-text-muted ef-sg__group-label">VARIANTES</div>
                                <div className="ef-sg__btn-row">
                                    <EfButton variant="primary">Primary</EfButton>
                                    <EfButton variant="secondary">Secondary</EfButton>
                                    <EfButton variant="danger">Danger</EfButton>
                                    <EfButton variant="ghost">Ghost</EfButton>
                                </div>
                            </div>

                            <div>
                                <div className="ef-mono ef-text-muted ef-sg__group-label">ESTADOS</div>
                                <div className="ef-sg__btn-row">
                                    <EfButton variant="primary" disabled>Disabled</EfButton>
                                    <EfButton variant="primary" loading>Loading</EfButton>
                                    <EfButton variant="primary"><Cube size={16} /> Com Ícone</EfButton>
                                </div>
                            </div>
                        </div>
                    </EfPanel>

                    {/* INPUTS & MODALS */}
                    <EfPanel padding="lg">
                        <div className="ef-panel-section-icon-header">
                            <ListDashes size={20} /> INPUTS & MODALS
                        </div>
                        <div className="ef-sg__section--lg-gap ef-sg__section">
                            <div className="ef-sg__section">
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

                            <div className="ef-sg__divider">
                                <div className="ef-mono ef-text-muted ef-sg__group-label--mb12">MODALS</div>
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
                                    <p className="ef-sg__modal-body">Este é o novo modal no formato Bento Grid. Ele possui bordas arredondadas suaves, fundo translúcido moderno e aderência à paleta Luxury Arcade.</p>
                                </EfModal>
                            </div>
                        </div>
                    </EfPanel>

                    {/* CARD PLAYER & TOOLTIPS */}
                    <EfPanel padding="lg">
                        <div className="ef-panel-section-icon-header">
                            <Cube size={20} /> COMPONENTES DIVERSOS
                        </div>
                        <div className="ef-sg__section--lg-gap ef-sg__section">
                            <div>
                                <div className="ef-mono ef-text-muted ef-sg__group-label--mb12">EF-CARD-PLAYER</div>
                                <div className="ef-sg__chip-row">
                                    <EfCardPlayer player={samplePlayer} />
                                    <EfCardPlayer player={samplePlayer} badge="LEND" selected />
                                </div>
                            </div>

                            <div className="ef-sg__divider">
                                <div className="ef-mono ef-text-muted ef-sg__group-label--mb12">EF-TOOLTIP</div>
                                <div className="ef-sg__btn-row">
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
