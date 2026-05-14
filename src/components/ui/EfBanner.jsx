/**
 * EfBanner — full-screen narrative moment overlay.
 */

import { useEffect } from 'react';
import {
    Trophy, ArrowUp, ArrowDown, Briefcase, Handshake, Medal,
    EnvelopeSimple, CurrencyDollar, Star, Crown, Bandaids, Square, Shield
} from '@phosphor-icons/react';
import '../../styles/ef-banner.css';

const BANNER_CONFIG = {
    champion: {
        Icon: Trophy,
        title: 'CAMPEÃO!',
        subtitle: 'Título conquistado',
        bg: 'var(--accent)',
        color: 'var(--ef-banner-stripe)',
        spriteClass: 'ef-anim-trophy-unlock',
        duration: 4000
    },
    promotion: {
        Icon: ArrowUp,
        title: 'PROMOÇÃO',
        subtitle: 'Subiu de divisão',
        bg: 'var(--ef-banner-promo)',
        color: 'var(--text-main)',
        duration: 3000
    },
    relegation: {
        Icon: ArrowDown,
        title: 'REBAIXAMENTO',
        subtitle: 'Caiu de divisão',
        bg: 'var(--ef-banner-relegation)',
        color: 'var(--text-main)',
        duration: 3000
    },
    fired: {
        Icon: Briefcase,
        title: 'DEMITIDO',
        subtitle: 'Diretoria encerrou contrato',
        bg: 'var(--ef-banner-fired)',
        color: 'var(--text-main)',
        duration: 3500
    },
    hired: {
        Icon: Handshake,
        title: 'CONTRATADO',
        subtitle: 'Novo desafio',
        bg: 'var(--ef-banner-hired)',
        color: 'var(--text-main)',
        duration: 3000
    },
    retirement: {
        Icon: Medal,
        title: 'APOSENTADORIA',
        subtitle: 'Fim de carreira lendária',
        bg: 'var(--ef-banner-retirement)',
        color: 'var(--text-main)',
        duration: 4500
    },
    offer: {
        Icon: EnvelopeSimple,
        title: 'PROPOSTA',
        subtitle: 'Nova oferta recebida',
        bg: 'var(--ef-banner-offer)',
        color: 'var(--ef-banner-stripe)',
        duration: 2500
    },
    sponsor: {
        Icon: CurrencyDollar,
        title: 'PATROCÍNIO',
        subtitle: 'Contrato fechado',
        bg: 'var(--ef-banner-sponsor)',
        color: 'var(--ef-banner-stripe)',
        duration: 2500
    },
    motm: {
        Icon: Star,
        title: 'CRAQUE DA PARTIDA',
        subtitle: 'MVP',
        bg: 'var(--ef-banner-motm)',
        color: 'var(--ef-banner-stripe)',
        duration: 3000
    },
    hattrick: {
        Icon: Crown,
        title: 'HAT-TRICK!',
        subtitle: 'Três gols na mesma partida',
        bg: 'var(--ef-banner-hattrick)',
        color: 'var(--ef-banner-stripe)',
        duration: 3500
    },
    injury: {
        Icon: Bandaids,
        title: 'LESÃO',
        subtitle: 'Departamento médico',
        bg: 'var(--ef-banner-injury)',
        color: 'var(--text-main)',
        duration: 2500
    },
    suspension: {
        Icon: Square,
        title: 'SUSPENSÃO',
        subtitle: 'Cartões acumulados',
        bg: 'var(--ef-banner-fired)',
        color: 'var(--text-main)',
        duration: 2500
    },
    cleanSheet: {
        Icon: Shield,
        title: 'JOGO SEM SOFRER GOLS',
        subtitle: 'Defesa intransponível',
        bg: 'var(--ef-banner-promo)',
        color: 'var(--text-main)',
        duration: 2000
    }
};

export function EfBanner({ type, customTitle, customSubtitle, onDismiss }) {
    const cfg = BANNER_CONFIG[type] || BANNER_CONFIG.offer;
    const IconComp = cfg.Icon;

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
                    <div className="ef-banner__icon ef-anim-pulse-glow">
                        <IconComp size={64} weight="fill" />
                    </div>
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
