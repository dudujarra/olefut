/**
 * EfBanner — full-screen narrative moment overlay.
 *
 * Tipos: champion | promotion | relegation | fired | hired | retirement |
 *        offer | sponsor | motm | hattrick | injury | suspension | clean-sheet
 *
 * Auto-dismiss após duration (default 2500ms) ou click.
 * Usa pixel-art sprites + ef-pop-in + ef-anim-pulse-glow.
 */

import React, { useEffect } from 'react';

const BANNER_CONFIG = {
    champion: {
        icon: '🏆',
        title: 'CAMPEÃO!',
        subtitle: 'Título conquistado',
        bg: '#FFD700',
        color: '#0F1A14',
        spriteClass: 'ef-anim-trophy-unlock',
        duration: 4000
    },
    promotion: {
        icon: '⬆️',
        title: 'PROMOÇÃO',
        subtitle: 'Subiu de divisão',
        bg: '#2D5A3D',
        color: '#FFFFFF',
        duration: 3000
    },
    relegation: {
        icon: '⬇️',
        title: 'REBAIXAMENTO',
        subtitle: 'Caiu de divisão',
        bg: '#6B0000',
        color: '#FFFFFF',
        duration: 3000
    },
    fired: {
        icon: '💼',
        title: 'DEMITIDO',
        subtitle: 'Diretoria encerrou contrato',
        bg: '#000000',
        color: '#FFFFFF',
        duration: 3500
    },
    hired: {
        icon: '🤝',
        title: 'CONTRATADO',
        subtitle: 'Novo desafio',
        bg: '#002E63',
        color: '#FFFFFF',
        duration: 3000
    },
    retirement: {
        icon: '🎖️',
        title: 'APOSENTADORIA',
        subtitle: 'Fim de carreira lendária',
        bg: '#4A0E7A',
        color: '#FFFFFF',
        duration: 4500
    },
    offer: {
        icon: '📨',
        title: 'PROPOSTA',
        subtitle: 'Nova oferta recebida',
        bg: '#C8941F',
        color: '#0F1A14',
        duration: 2500
    },
    sponsor: {
        icon: '💰',
        title: 'PATROCÍNIO',
        subtitle: 'Contrato fechado',
        bg: '#6ABC3A',
        color: '#0F1A14',
        duration: 2500
    },
    motm: {
        icon: '⭐',
        title: 'CRAQUE DA PARTIDA',
        subtitle: 'MVP',
        bg: '#F7B538',
        color: '#0F1A14',
        duration: 3000
    },
    hattrick: {
        icon: '🎩',
        title: 'HAT-TRICK!',
        subtitle: 'Três gols na mesma partida',
        bg: '#D62828',
        color: '#0F1A14',
        duration: 3500
    },
    injury: {
        icon: '🩹',
        title: 'LESÃO',
        subtitle: 'Departamento médico',
        bg: '#4A0000',
        color: '#FFFFFF',
        duration: 2500
    },
    suspension: {
        icon: '🟥',
        title: 'SUSPENSÃO',
        subtitle: 'Cartões acumulados',
        bg: '#000000',
        color: '#FFFFFF',
        duration: 2500
    },
    cleanSheet: {
        icon: '🛡️',
        title: 'JOGO SEM SOFRER GOLS',
        subtitle: 'Defesa intransponível',
        bg: '#2D5A3D',
        color: '#FFFFFF',
        duration: 2000
    }
};

export function EfBanner({ type, customTitle, customSubtitle, onDismiss }) {
    const cfg = BANNER_CONFIG[type] || BANNER_CONFIG.offer;

    useEffect(() => {
        const t = setTimeout(() => { onDismiss?.(); }, cfg.duration);
        return () => clearTimeout(t);
    }, [type, onDismiss, cfg.duration]);

    return (
        <div
            onClick={onDismiss}
            role="dialog"
            aria-label={cfg.title}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                animation: 'ef-fade-in 200ms ease-out, ef-fade-out 400ms ease-out forwards',
                animationDelay: `0ms, ${cfg.duration - 400}ms`,
                cursor: 'pointer'
            }}
        >
            <div
                className="ef-anim-pop-in"
                style={{
                    background: cfg.bg,
                    color: cfg.color,
                    padding: '32px 48px',

                    border: '4px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    boxShadow: '0 8px 0 rgba(0,0,0,0.5), 0 0 40px rgba(247,181,56,0.4)',
                    textAlign: 'center',
                    minWidth: '320px',
                    maxWidth: '600px',
                    fontFamily: "'Press Start 2P', monospace"
                }}
            >
                {cfg.spriteClass ? (
                    <div className={cfg.spriteClass} style={{margin: '0 auto 16px'}} />
                ) : (
                    <div style={{fontSize: '64px', marginBottom: '16px'}} className="ef-anim-pulse-glow">{cfg.icon}</div>
                )}
                <h2 style={{
                    margin: 0,
                    fontSize: '32px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontFamily: "'Press Start 2P', monospace",
                    textShadow: '2px 2px 0 rgba(0,0,0,0.5)'
                }}>
                    {customTitle || cfg.title}
                </h2>
                <p style={{
                    margin: '12px 0 0',
                    fontSize: '14px',
                    opacity: 0.9,
                    fontStyle: 'italic'
                }}>
                    {customSubtitle || cfg.subtitle}
                </p>
                <div style={{
                    marginTop: '20px',
                    fontSize: '10px',
                    opacity: 0.6,
                    fontFamily: "'Press Start 2P', monospace"
                }}>
                    CLIQUE PARA CONTINUAR
                </div>
            </div>
        </div>
    );
}

export default EfBanner;
