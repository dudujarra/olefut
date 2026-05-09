/**
 * CosmeticShopView — SPEC-101
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { COSMETICS, getCosmeticState, purchaseCosmetic, equipCosmetic, getAchievementPoints } from '../services/CosmeticShopService';

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
        <div className="main-content fade-in">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>🛍️ Loja de Cosméticos</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(getDashboardView())}>← Voltar</button>
            </div>

            <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pontos disponíveis (de conquistas):</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>⭐ {points}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    Cosméticos: {state.owned.length}/{COSMETICS.length}
                </div>
            </div>

            {Object.entries(grouped).map(([type, items]) => (
                <div key={type} className="card" style={{ padding: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
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
                                    border: `1px solid ${equipped ? 'var(--accent)' : '#2a3530'}`,
                                    borderRadius: '4px',
                                    padding: '0.5rem',
                                    background: equipped ? 'rgba(247,181,56,0.1)' : 'transparent'
                                }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '4px', textAlign: 'center' }}>{item.emoji}</div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginBottom: '6px' }}>⭐ {item.cost}</div>
                                    {owned ? (
                                        <button
                                            onClick={() => handleEquip(item.id)}
                                            disabled={equipped}
                                            className="btn btn-sm"
                                            style={{
                                                width: '100%',
                                                fontSize: '0.7rem',
                                                background: equipped ? 'var(--accent)' : 'transparent',
                                                color: equipped ? '#0F1A14' : 'var(--text)',
                                                border: '1px solid var(--accent)'
                                            }}
                                        >{equipped ? 'EQUIPADO' : 'EQUIPAR'}</button>
                                    ) : (
                                        <button
                                            onClick={() => handlePurchase(item.id)}
                                            disabled={!canAfford}
                                            className="btn btn-sm btn-primary"
                                            style={{ width: '100%', fontSize: '0.7rem' }}
                                        >{canAfford ? 'COMPRAR' : 'SEM PONTOS'}</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default CosmeticShopView;
