/**
 * CosmeticShopView — SPEC-101
 * 
 * 16-BIT BRUTALIST ARCADE AESTHETIC — RPG Item Shop style
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { COSMETICS, getCosmeticState, purchaseCosmetic, equipCosmetic, getAchievementPoints } from '../services/CosmeticShopService';
import { EfButton } from './ui/EfButton';
import bgManagerOffice from '../assets/environments/bg_manager_office.png';

const TYPE_LABELS = {
    kit: '👕 KITS',
    badge: '🛡️ BADGES',
    portrait: '👤 PORTRAITS',
    pitch: '🟢 GRAMAS',
    banner: '🎉 BANNERS'
};

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
            color: '#E2E8F0',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* HEADER */}
                <div style={{
                    background: '#1E2124',
                    border: '4px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 8px 0 rgba(0,0,0,0.8)'
                }}>
                    <div>
                        <h2 style={{fontFamily: "'Press Start 2P', monospace", color: '#FFD700', margin: '0 0 8px 0', fontSize: '1rem', textShadow: '3px 3px 0 #000'}}>
                            LOJA DE COSMÉTICOS
                        </h2>
                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#888'}}>ITENS DESBLOQUEÁVEIS</span>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>SAIR</EfButton>
                </div>

                {/* POINTS DISPLAY — RPG Gold Counter */}
                <div style={{
                    background: '#111',
                    border: '4px solid',
                    borderColor: '#FFD700 #AA8800 #AA8800 #FFD700',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#888', display: 'block', marginBottom: '6px'}}>
                            PONTOS DISPONÍVEIS
                        </span>
                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '1.4rem', color: '#FFD700', textShadow: '3px 3px 0 #000'}}>
                            ⭐ {points}
                        </span>
                    </div>
                    <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#888', textAlign: 'right'}}>
                        ITENS: {state.owned.length}/{COSMETICS.length}
                    </div>
                </div>

                {/* CATEGORIES */}
                {Object.entries(grouped).map(([type, items]) => (
                    <div key={type} style={{
                        background: '#1E2124',
                        border: '4px solid',
                        borderColor: '#4A5059 #111417 #111417 #4A5059',
                        padding: '16px'
                    }}>
                        {/* Category header */}
                        <div style={{
                            background: '#111',
                            padding: '8px',
                            borderBottom: '2px solid #333',
                            marginBottom: '16px',
                            fontFamily: "'Press Start 2P', monospace",
                            color: '#FFD700',
                            fontSize: '0.65rem',
                            textShadow: '2px 2px 0 #000'
                        }}>
                            {TYPE_LABELS[type] || type.toUpperCase()}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                            {items.map(item => {
                                const owned = state.owned.includes(item.id);
                                const equipped = state.equipped[item.type] === item.id;
                                const canAfford = points >= item.cost;
                                return (
                                    <div key={item.id} style={{
                                        background: '#111',
                                        border: '4px solid',
                                        borderColor: equipped ? '#FFD700 #AA8800 #AA8800 #FFD700' : '#333 #000 #000 #333',
                                        padding: '16px',
                                        textAlign: 'center'
                                    }}>
                                        {/* Item icon */}
                                        <div style={{
                                            width: '48px', height: '48px', margin: '0 auto 8px',
                                            background: equipped ? '#FFD700' : (owned ? '#39FF14' : '#333'),
                                            border: '3px solid #000',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.2)'
                                        }}>
                                            {item.emoji}
                                        </div>

                                        <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#FFF', marginBottom: '4px'}}>
                                            {item.name.toUpperCase()}
                                        </div>
                                        <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#FFD700', marginBottom: '12px'}}>
                                            ⭐ {item.cost}
                                        </div>

                                        {owned ? (
                                            <div
                                                onClick={() => !equipped && handleEquip(item.id)}
                                                style={{
                                                    background: equipped ? '#0A1A0A' : '#111',
                                                    border: '4px solid',
                                                    borderColor: equipped ? '#39FF14 #1A8A0A #1A8A0A #39FF14' : '#333 #000 #000 #333',
                                                    padding: '6px 12px',
                                                    cursor: equipped ? 'default' : 'pointer',
                                                    fontFamily: "'Press Start 2P', monospace",
                                                    fontSize: '0.5rem',
                                                    color: equipped ? '#39FF14' : '#888'
                                                }}
                                            >
                                                {equipped ? '✓ EQUIPADO' : 'EQUIPAR'}
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => canAfford && handlePurchase(item.id)}
                                                style={{
                                                    background: canAfford ? '#1A1A0A' : '#1A0A0A',
                                                    border: '4px solid',
                                                    borderColor: canAfford ? '#FFD700 #AA8800 #AA8800 #FFD700' : '#FF3333 #AA1111 #AA1111 #FF3333',
                                                    padding: '6px 12px',
                                                    cursor: canAfford ? 'pointer' : 'not-allowed',
                                                    fontFamily: "'Press Start 2P', monospace",
                                                    fontSize: '0.5rem',
                                                    color: canAfford ? '#FFD700' : '#FF3333',
                                                    opacity: canAfford ? 1 : 0.6
                                                }}
                                            >
                                                {canAfford ? 'COMPRAR' : 'SEM PONTOS'}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CosmeticShopView;
