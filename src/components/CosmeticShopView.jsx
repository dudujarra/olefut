import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { COSMETICS, getCosmeticState, purchaseCosmetic, equipCosmetic, getAchievementPoints } from '../services/CosmeticShopService';
import { EfPanel, EfButton } from './ui';
import bgManagerOffice from '../assets/environments/bg_cosmetic_shop.png';
import '../styles/cosmetic-shop-view.css';

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
                <EfPanel padding="lg" className="ef-view-header ef-cosmetic-shop__header-panel">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <Storefront size={28} color="var(--info)" />
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
                <EfPanel padding="lg" className="ef-cosmetic-shop__points-panel">
                    <div className="ef-cosmetic-shop__points-left">
                        <div className="ef-cosmetic-shop__points-icon-box">
                            <Star size={36} color="#000" weight="fill" />
                        </div>
                        <div className="ef-cosmetic-shop__points-info">
                            <span className="ef-cosmetic-shop__points-label">
                                PONTOS DISPONÍVEIS
                            </span>
                            <span className="ef-cosmetic-shop__points-value">
                                {points}
                            </span>
                        </div>
                    </div>
                    <div className="ef-cosmetic-shop__points-right">
                        <div className="ef-cosmetic-shop__progress-label">
                            PROGRESSO DE COLEÇÃO
                        </div>
                        <div className="ef-cosmetic-shop__progress-value">
                            {state.owned.length} <span className="ef-cosmetic-shop__progress-separator">/</span> {COSMETICS.length}
                        </div>
                    </div>
                </EfPanel>

                {/* CATEGORIES */}
                {Object.entries(grouped).map(([type, items]) => (
                    <EfPanel key={type} padding="lg">
                        {/* Category header */}
                        <div className="ef-cosmetic-shop__category-header">
                            {TYPE_ICONS[type]} {TYPE_LABELS[type] || type.toUpperCase()}
                        </div>

                        <div className="ef-cosmetic-shop__cards-grid">
                            {items.map(item => {
                                const owned = state.owned.includes(item.id);
                                const equipped = state.equipped[item.type] === item.id;
                                const canAfford = points >= item.cost;

                                const cardCls = equipped
                                    ? 'ef-cosmetic-shop__card ef-cosmetic-shop__card--equipped'
                                    : owned
                                        ? 'ef-cosmetic-shop__card ef-cosmetic-shop__card--owned'
                                        : 'ef-cosmetic-shop__card';

                                return (
                                    <div key={item.id} className={cardCls}>
                                        {equipped && (
                                            <div className="ef-cosmetic-shop__card-equipped-banner">
                                                <CheckCircle weight="fill" /> EQUIPADO
                                            </div>
                                        )}

                                        {/* Item icon */}
                                        <div className="ef-cosmetic-shop__card-icon">
                                            {item.emoji}
                                        </div>

                                        <div className="ef-cosmetic-shop__card-name">
                                            {item.name}
                                        </div>

                                        {!owned && (
                                            <div className="ef-cosmetic-shop__card-price">
                                                <Star weight="fill" /> {item.cost}
                                            </div>
                                        )}

                                        <div className="ef-cosmetic-shop__card-actions">
                                            {owned ? (
                                                <EfButton
                                                    className="ef-cosmetic-shop__card-button"
                                                    variant={equipped ? "primary" : "secondary"}
                                                    onClick={() => !equipped && handleEquip(item.id)}
                                                    disabled={equipped}
                                                >
                                                    {equipped ? 'EM USO' : 'EQUIPAR'}
                                                </EfButton>
                                            ) : (
                                                <EfButton
                                                    className={`ef-cosmetic-shop__card-button ${canAfford ? 'ef-cosmetic-shop__card-button--purchasable' : 'ef-cosmetic-shop__card-button--unpurchasable'}`}
                                                    variant={canAfford ? "primary" : "secondary"}
                                                    onClick={() => canAfford && handlePurchase(item.id)}
                                                    disabled={!canAfford}
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
