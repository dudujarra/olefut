/**
 * CosmeticShopView — SPEC-101
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { COSMETICS, getCosmeticState, purchaseCosmetic, equipCosmetic, getAchievementPoints } from '../services/CosmeticShopService';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgManagerOffice from '../assets/environments/bg_manager_office.png';

export function CosmeticShopView() {
    const { changeView, getEngine, getDashboardView } = useGame();
    const engine = getEngine();
    const [state, setState] = useState(getCosmeticState());
    const [points, setPoints] = useState(0);

    useEffect(() => {
        setPoints(getAchievementPoints(engine));
    }, [engine]);

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
            color: 'var(--ef-color-neutral-text-hi)'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>🛍️ LOJA DE COSMÉTICOS</h2>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← VOLTAR</EfButton>
                </EfPanel>

                <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pontos disponíveis (de conquistas):</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>⭐ {points}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                        Cosméticos: {state.owned.length}/{COSMETICS.length}
                    </div>
                </EfPanel>

                {Object.entries(grouped).map(([type, items]) => (
                    <EfPanel key={type} variant="sunk" padding="md">
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', marginTop: 0, textTransform: 'uppercase' }}>
                            {type === 'kit' ? '👕 Kits' :
                             type === 'badge' ? '🛡️ Badges' :
                             type === 'portrait' ? '👤 Portraits' :
                             type === 'pitch' ? '🟢 Gramas' :
                             type === 'banner' ? '🎉 Banners' : type}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                            {items.map(item => {
                                const owned = state.owned.includes(item.id);
                                const equipped = state.equipped[item.type] === item.id;
                                const canAfford = points >= item.cost;
                                return (
                                    <div key={item.id} style={{
                                        border: `1px solid ${equipped ? 'var(--accent)' : 'var(--border-subtle)'}`,
                                        borderRadius: '4px',
                                        padding: '0.5rem',
                                        background: equipped ? 'rgba(247,181,56,0.1)' : 'var(--bg-panel-hover)'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', marginBottom: '4px', textAlign: 'center' }}>{item.emoji}</div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginBottom: '8px', textAlign: 'center' }}>⭐ {item.cost}</div>
                                        {owned ? (
                                            <EfButton
                                                onClick={() => handleEquip(item.id)}
                                                disabled={equipped}
                                                variant={equipped ? 'primary' : 'secondary'}
                                                size="sm"
                                                style={{ width: '100%', justifyContent: 'center' }}
                                            >{equipped ? 'EQUIPADO' : 'EQUIPAR'}</EfButton>
                                        ) : (
                                            <EfButton
                                                onClick={() => handlePurchase(item.id)}
                                                disabled={!canAfford}
                                                variant="primary"
                                                size="sm"
                                                style={{ width: '100%', justifyContent: 'center' }}
                                            >{canAfford ? 'COMPRAR' : 'SEM PONTOS'}</EfButton>
                                        )}
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
