/**
 * EfBanner — full-screen narrative moment overlay.
 */

import { useEffect } from 'react';
import '../../styles/ef-banner.css';

const BANNER_CONFIG = {
    champion: {
        icon: '🏆',
        title: 'CAMPEÃO!',
        subtitle: 'Título conquistado',
        bg: 'var(--accent)',
        color: 'var(--ef-banner-stripe)',
        spriteClass: 'ef-anim-trophy-unlock',
        duration: 4000
    },
    promotion: {
        icon: '⬆️',
        title: 'PROMOÇÃO',
        subtitle: 'Subiu de divisão',
        bg: 'var(--ef-banner-promo)',
        color: 'var(--text-main)',
        duration: 3000
    },
    relegation: {
        icon: '⬇️',
        title: 'REBAIXAMENTO',
        subtitle: 'Caiu de divisão',
        bg: 'var(--ef-banner-relegation)',
        color: 'var(--text-main)',
        duration: 3000
    },
    fired: {
        icon: '💼',
        title: 'DEMITIDO',
        subtitle: 'Diretoria encerrou contrato',
        bg: 'var(--ef-banner-fired)',
        color: 'var(--text-main)',
        duration: 3500
    },
    hired: {
        icon: '🤝',
        title: 'CONTRATADO',
        subtitle: 'Novo desafio',
        bg: 'var(--ef-banner-hired)',
        color: 'var(--text-main)',
        duration: 3000
    },
    retirement: {
        icon: '🎖️',
        title: 'APOSENTADORIA',
        subtitle: 'Fim de carreira lendária',
        bg: 'var(--ef-banner-retirement)',
        color: 'var(--text-main)',
        duration: 4500
    },
    offer: {
        icon: '📨',
        title: 'PROPOSTA',
        subtitle: 'Nova oferta recebida',
        bg: 'var(--ef-banner-offer)',
        color: 'var(--ef-banner-stripe)',
        duration: 2500
    },
    sponsor: {
        icon: '💰',
        title: 'PATROCÍNIO',
        subtitle: 'Contrato fechado',
        bg: 'var(--ef-banner-sponsor)',
        color: 'var(--ef-banner-stripe)',
        duration: 2500
    },
    motm: {
        icon: '⭐',
        title: 'CRAQUE DA PARTIDA',
        subtitle: 'MVP',
        bg: 'var(--ef-banner-motm)',
        color: 'var(--ef-banner-stripe)',
        duration: 3000
    },
    hattrick: {
        icon: '🎩',
        title: 'HAT-TRICK!',
        subtitle: 'Três gols na mesma partida',
        bg: 'var(--ef-banner-hattrick)',
        color: 'var(--ef-banner-stripe)',
        duration: 3500
    },
    injury: {
        icon: '🩹',
        title: 'LESÃO',
        subtitle: 'Departamento médico',
        bg: 'var(--ef-banner-injury)',
        color: 'var(--text-main)',
        duration: 2500
    },
    suspension: {
        icon: '🟥',
        title: 'SUSPENSÃO',
        subtitle: 'Cartões acumulados',
        bg: 'var(--ef-banner-fired)',
        color: 'var(--text-main)',
        duration: 2500
    },
    cleanSheet: {
        icon: '🛡️',
        title: 'JOGO SEM SOFRER GOLS',
        subtitle: 'Defesa intransponível',
        bg: 'var(--ef-banner-promo)',
        color: 'var(--text-main)',
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
            className="ef-banner"
            style={{ animationDelay: `0ms, ${cfg.duration - 400}ms` }}
        >
            <div
                className="ef-anim-pop-in ef-banner__card"
                style={{ background: cfg.bg, color: cfg.color }}
            >
                {cfg.spriteClass ? (
                    <div className={`${cfg.spriteClass} ef-banner__sprite`} />
                ) : (
                    <div className="ef-banner__icon ef-anim-pulse-glow">{cfg.icon}</div>
                )}
                <h2 className="ef-banner__title">
                    {customTitle || cfg.title}
                </h2>
                <p className="ef-banner__subtitle">
                    {customSubtitle || cfg.subtitle}
                </p>
                <div className="ef-banner__hint">
                    CLIQUE PARA CONTINUAR
                </div>
            </div>
        </div>
    );
}

export default EfBanner;
