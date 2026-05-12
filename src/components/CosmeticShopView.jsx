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

                {/* HEADER */}
                <EfPanel padding="lg" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: `2px solid ${colors.secondary}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: colors.panelElevated, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${colors.border}` }}>
                            <Storefront size={28} color={colors.secondary} />
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', color: colors.text, fontWeight: 'bold' }}>
                                LOJA DE COSMÉTICOS
                            </h2>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted }}>
                                DESBLOQUEIE ITENS DE PERSONALIZAÇÃO
                            </span>
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
                    border: `2px solid ${colors.warning}`,
                    backgroundColor: '#1B4332'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ 
                            width: '64px', height: '64px', 
                            backgroundColor: colors.warning, 
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            boxShadow: `0 0 20px #1B4332`
                        }}>
                            <Star size={36} color="#000" weight="fill" />
                        </div>
                        <div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: colors.warning, display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                PONTOS DISPONÍVEIS
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', color: colors.text, fontWeight: '800' }}>
                                {points}
                            </span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '8px' }}>
                            PROGRESSO DE COLEÇÃO
                        </div>
                        <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: colors.secondary }}>
                            {state.owned.length} <span style={{ color: colors.border }}>/</span> {COSMETICS.length}
                        </div>
                    </div>
                </EfPanel>

                {/* CATEGORIES */}
                {Object.entries(grouped).map(([type, items]) => (
                    <EfPanel key={type} padding="lg">
                        {/* Category header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            paddingBottom: '12px',
                            borderBottom: `1px solid ${colors.border}`,
                            marginBottom: '20px',
                            fontFamily: 'var(--font-mono)',
                            color: colors.secondary,
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}>
                            {TYPE_ICONS[type]} {TYPE_LABELS[type] || type.toUpperCase()}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                            {items.map(item => {
                                const owned = state.owned.includes(item.id);
                                const equipped = state.equipped[item.type] === item.id;
                                const canAfford = points >= item.cost;
                                
                                let itemBorderColor = colors.border;
                                if (equipped) itemBorderColor = colors.accent;
                                else if (owned) itemBorderColor = colors.secondary;

                                return (
                                    <div key={item.id} style={{
                                        backgroundColor: colors.panelElevated,
                                        border: `1px solid ${itemBorderColor}`,
                                        padding: '20px 16px',
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        {equipped && (
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0,
                                                backgroundColor: colors.accent, color: '#000',
                                                fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                                                fontWeight: 'bold', padding: '4px',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px'
                                            }}>
                                                <CheckCircle weight="fill" /> EQUIPADO
                                            </div>
                                        )}

                                        {/* Item icon */}
                                        <div style={{
                                            width: '64px', height: '64px', margin: '16px auto 16px',
                                            backgroundColor: equipped ? colors.accent : (owned ? colors.secondary : colors.bg),
                                            color: owned ? '#000' : colors.textMuted,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '2rem',
                                            border: `2px solid ${owned ? 'transparent' : colors.border}`
                                        }}>
                                            {item.emoji}
                                        </div>

                                        <div style={{fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: colors.text, marginBottom: '8px', fontWeight: 'bold', flex: 1}}>
                                            {item.name}
                                        </div>
                                        
                                        {!owned && (
                                            <div style={{
                                                fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: colors.warning, 
                                                marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                                fontWeight: 'bold'
                                            }}>
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
                                                        backgroundColor: canAfford ? colors.warning : 'transparent',
                                                        color: canAfford ? '#000' : colors.textMuted,
                                                        borderColor: canAfford ? colors.warning : colors.border
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
