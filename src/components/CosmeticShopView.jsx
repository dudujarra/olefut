import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { COSMETICS, getCosmeticState, purchaseCosmetic, equipCosmetic, getAchievementPoints } from '../services/CosmeticShopService';
import { EfPanel, EfButton } from './ui';
import bgManagerOffice from '../assets/environments/bg_cosmetic_shop.png';

import {
    Storefront, ArrowLeft, Star, Lock, LockOpen, CheckCircle,
    TShirt, Shield, UserSquare, ImagesSquare, FlagBanner
} from '@phosphor-icons/react';

const TYPE_ICONS = {
    kit: <TShirt size={20} />,
    badge: <Shield size={20} />,
    portrait: <UserSquare size={20} />,
    pitch: <ImagesSquare size={20} />,
    banner: <FlagBanner size={20} />
};

const TYPE_LABELS = {
    kit: 'KITS & UNIFORMES',
    badge: 'ESCUDOS',
    portrait: 'RETRATOS',
    pitch: 'GRAMADOS',
    banner: 'BANNERS'
};

export function CosmeticShopView() {
    const { changeView, getEngine, getDashboardView } = useGame();
    const engine = getEngine();
    const [state, setState] = useState(getCosmeticState());
    // BUG-081 fix: useState initializer evita setState em useEffect.
    // points é mutado localmente em handlePurchase (não pode ser useMemo derivado).
    const [points, setPoints] = useState(() => getAchievementPoints(engine));

    const handlePurchase = (id) => {
        const result = purchaseCosmetic(id, points);
        if (result.success) {
            setState(getCosmeticState());
            setPoints(p => p - COSMETICS.find(c => c.id === id).cost);
        }
    };

    const handleEquip = (id) => {
        equipCosmetic(id);
        setState(getCosmeticState());
    };

    const grouped = {};
    COSMETICS.forEach(c => {
        if (!grouped[c.type]) grouped[c.type] = [];
        grouped[c.type].push(c);
    });

    return (
        <div className="ef-anim-fade-in ef-scene-shell" style={{ backgroundImage: `url(${bgManagerOffice})` }}>
            <div className="ef-view-container">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-view-header" style={{ borderBottom: '2px solid #40BAF7' }}>
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <Storefront size={28} color="#40BAF7" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title">LOJA DE COSMÉTICOS</h2>
                            <span className="ef-view-header__subtitle">DESBLOQUEIE ITENS DE PERSONALIZAÇÃO</span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* POINTS DISPLAY */}
                <EfPanel padding="lg" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '2px solid #FFD700',
                    backgroundColor: '#1B4332'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{
                            width: '64px', height: '64px',
                            backgroundColor: '#FFD700',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            boxShadow: '0 0 20px #1B4332'
                        }}>
                            <Star size={36} color="#000" weight="fill" />
                        </div>
                        <div>
                            <span className="ef-mono ef-text-accent" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                PONTOS DISPONÍVEIS
                            </span>
                            <span className="ef-mono ef-text-main" style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                                {points}
                            </span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div className="ef-mono ef-text-muted" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
                            PROGRESSO DE COLEÇÃO
                        </div>
                        <div className="ef-mono ef-text-info" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {state.owned.length} <span style={{ color: '#2D3748' }}>/</span> {COSMETICS.length}
                        </div>
                    </div>
                </EfPanel>

                {/* CATEGORIES */}
                {Object.entries(grouped).map(([type, items]) => (
                    <EfPanel key={type} padding="lg">
                        {/* Category header */}
                        <div className="ef-panel-cat-header">
                            {TYPE_ICONS[type]} {TYPE_LABELS[type] || type.toUpperCase()}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                            {items.map(item => {
                                const owned = state.owned.includes(item.id);
                                const equipped = state.equipped[item.type] === item.id;
                                const canAfford = points >= item.cost;

                                const cardCls = equipped
                                    ? 'ef-cosmetic-card ef-cosmetic-card--equipped'
                                    : owned
                                        ? 'ef-cosmetic-card ef-cosmetic-card--owned'
                                        : 'ef-cosmetic-card';

                                return (
                                    <div key={item.id} className={cardCls}>
                                        {equipped && (
                                            <div className="ef-cosmetic-card__equipped-banner">
                                                <CheckCircle weight="fill" /> EQUIPADO
                                            </div>
                                        )}

                                        {/* Item icon */}
                                        <div className="ef-cosmetic-card__icon">
                                            {item.emoji}
                                        </div>

                                        <div className="ef-cosmetic-card__name">
                                            {item.name}
                                        </div>

                                        {!owned && (
                                            <div className="ef-cosmetic-card__price">
                                                <Star weight="fill" /> {item.cost}
                                            </div>
                                        )}

                                        <div style={{ marginTop: 'auto' }}>
                                            {owned ? (
                                                <EfButton
                                                    variant={equipped ? "primary" : "secondary"}
                                                    onClick={() => !equipped && handleEquip(item.id)}
                                                    disabled={equipped}
                                                    style={{ width: '100%', justifyContent: 'center' }}
                                                >
                                                    {equipped ? 'EM USO' : 'EQUIPAR'}
                                                </EfButton>
                                            ) : (
                                                <EfButton
                                                    variant={canAfford ? "primary" : "secondary"}
                                                    onClick={() => canAfford && handlePurchase(item.id)}
                                                    disabled={!canAfford}
                                                    style={{
                                                        width: '100%',
                                                        justifyContent: 'center',
                                                        backgroundColor: canAfford ? '#FFD700' : 'transparent',
                                                        color: canAfford ? '#000' : '#8E9E94',
                                                        borderColor: canAfford ? '#FFD700' : '#2D3748'
                                                    }}
                                                >
                                                    {canAfford ? <><LockOpen size={16} /> DESBLOQUEAR</> : <><Lock size={16} /> PONTOS INSUF.</>}
                                                </EfButton>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </EfPanel>
                ))}
            </div>
        </div>
    );
}

export default CosmeticShopView;
