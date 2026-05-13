/**
 * CosmeticShopView — SPEC-101: Loja de Cosméticos
 * Stitch v1.1 port (AKITA-395): match docs/stitch-designs/v1.1-all/07-ol-fut-cosmeticshop.html
 *                              + docs/stitch-designs/v1.1-all/68-ol-fut-loja-cosm-tica.html
 * Tokens-only — zero raw hex, brand fonts (Press Start 2P / Pixelify Sans / IBM Plex Mono).
 * Engine/services untouched — pure visual refresh.
 */

import { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
    COSMETICS,
    getCosmeticState,
    purchaseCosmetic,
    equipCosmetic,
    getAchievementPoints
} from '../services/CosmeticShopService';
import { EfPanel, EfButton } from './ui';
import bgManagerOffice from '../assets/environments/bg_cosmetic_shop.png';
import '../styles/cosmetic-shop-view.css';

import {
    Storefront, ArrowLeft, Star, Lock, LockOpen, CheckCircle, ShoppingCart,
    TShirt, Shield, UserSquare, ImagesSquare, FlagBanner
} from '@phosphor-icons/react';

const TYPE_ICONS = {
    kit: TShirt,
    badge: Shield,
    portrait: UserSquare,
    pitch: ImagesSquare,
    banner: FlagBanner
};

const TYPE_LABELS = {
    kit: 'KITS & UNIFORMES',
    badge: 'ESCUDOS',
    portrait: 'RETRATOS',
    pitch: 'GRAMADOS',
    banner: 'BANNERS'
};

// Curated micro-descriptions for shop atmosphere (Stitch "arcade drop" copy).
const TYPE_FLAVOR = {
    kit: 'TEXTURAS POLIGONAIS PARA O VESTIÁRIO CYBERPUNK.',
    badge: 'A MARCA DO FUNDADOR. PIXELS DE FILIGRANA OURO.',
    portrait: 'AVATAR DE TÉCNICO COM ÓCULOS PIXELADOS.',
    pitch: 'GRAMA DE BAIXA RESOLUÇÃO COM ALMA 16-BIT.',
    banner: 'EFEITOS DE PARTÍCULAS PARA CADA COMEMORAÇÃO.'
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
        <div
            className="ef-anim-fade-in ef-scene-shell ef-cosmetic-shop"
            style={{ backgroundImage: `url(${bgManagerOffice})` }}
        >
            <div className="ef-view-container">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-view-header ef-cosmetic-shop__header-panel">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <Storefront size={28} className="ef-cosmetic-shop__header-icon" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title">LOJA DE COSMÉTICOS</h2>
                            <span className="ef-view-header__subtitle">
                                EXCLUSIVE 90S ARCADE DROPS · PERSONALIZE SUA DINASTIA
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* BANNER (Stitch "drop" headline) */}
                <div className="ef-cosmetic-shop__banner">
                    <h1 className="ef-cosmetic-shop__banner-title">COSMÉTICOS ELITE</h1>
                    <span className="ef-cosmetic-shop__banner-sub">
                        ITENS DESBLOQUEÁVEIS POR CONQUISTAS
                    </span>
                    <span className="ef-cosmetic-shop__banner-pill">NOVO DROP</span>
                </div>

                {/* POINTS DISPLAY */}
                <EfPanel padding="lg" className="ef-cosmetic-shop__points-panel">
                    <div className="ef-cosmetic-shop__points-left">
                        <div className="ef-cosmetic-shop__points-icon-box">
                            <Star
                                size={36}
                                weight="fill"
                                className="ef-cosmetic-shop__points-icon-box-svg"
                            />
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
                            {state.owned.length}
                            <span className="ef-cosmetic-shop__progress-separator">/</span>
                            {COSMETICS.length}
                        </div>
                    </div>
                </EfPanel>

                {/* CATEGORIES */}
                {Object.entries(grouped).map(([type, items]) => {
                    const TypeIcon = TYPE_ICONS[type] || Storefront;
                    return (
                        <EfPanel key={type} padding="lg">
                            <div className="ef-cosmetic-shop__category-header">
                                <TypeIcon size={20} className="ef-cosmetic-shop__category-icon" weight="fill" />
                                {TYPE_LABELS[type] || type.toUpperCase()}
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
                                                    <CheckCircle size={12} weight="fill" /> EQUIPADO
                                                </div>
                                            )}

                                            {/* Item icon "showcase" — replaces Stitch image */}
                                            <div className="ef-cosmetic-shop__card-icon" aria-hidden="true">
                                                {item.emoji}
                                            </div>

                                            <div className="ef-cosmetic-shop__card-name">
                                                {item.name}
                                            </div>

                                            <p className="ef-cosmetic-shop__card-desc">
                                                {TYPE_FLAVOR[item.type] || ''}
                                            </p>

                                            {!owned && (
                                                <div className="ef-cosmetic-shop__card-price">
                                                    <Star size={12} weight="fill" /> {item.cost}
                                                </div>
                                            )}

                                            <div className="ef-cosmetic-shop__card-actions">
                                                {owned ? (
                                                    <EfButton
                                                        className="ef-cosmetic-shop__card-button"
                                                        variant={equipped ? 'primary' : 'secondary'}
                                                        onClick={() => !equipped && handleEquip(item.id)}
                                                        disabled={equipped}
                                                    >
                                                        {equipped
                                                            ? (<><CheckCircle size={16} weight="fill" /> EM USO</>)
                                                            : (<><LockOpen size={16} /> EQUIPAR</>)
                                                        }
                                                    </EfButton>
                                                ) : (
                                                    <EfButton
                                                        className="ef-cosmetic-shop__card-button"
                                                        variant={canAfford ? 'primary' : 'secondary'}
                                                        onClick={() => canAfford && handlePurchase(item.id)}
                                                        disabled={!canAfford}
                                                    >
                                                        {canAfford
                                                            ? (<><ShoppingCart size={16} /> DESBLOQUEAR</>)
                                                            : (<><Lock size={16} /> PONTOS INSUF.</>)
                                                        }
                                                    </EfButton>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </EfPanel>
                    );
                })}

                {/* FOOTER INFO (Stitch arcade footer strip) */}
                <div className="ef-cosmetic-shop__footer">
                    <div className="ef-cosmetic-shop__footer-item">
                        <span className="ef-cosmetic-shop__footer-dot ef-cosmetic-shop__footer-dot--primary" />
                        DESBLOQUEIE COM PONTOS DE CONQUISTA
                    </div>
                    <div className="ef-cosmetic-shop__footer-divider" />
                    <div className="ef-cosmetic-shop__footer-item">
                        <span className="ef-cosmetic-shop__footer-dot ef-cosmetic-shop__footer-dot--secondary" />
                        ITENS SÃO PERMANENTES NO SAVE
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CosmeticShopView;
