import React, { useState, useEffect, useCallback } from 'react';

/**
 * §19.1 Progressive Disclosure Tooltip
 * Shows contextual tip when a new system becomes available.
 */
const DISCLOSURE_TIPS = {
    rivals: {
        emoji: '⚔️',
        title: 'Sistema de Rivalidade',
        tip: 'Agora você pode ver seus rivais — rivais jogam mais duro contra você. Preparação tática é essencial nos derbies!',
    },
    academy: {
        emoji: '🎓',
        title: 'Base de Formação',
        tip: 'Sua base está ativa! Jovens promessas vão surgir a cada temporada. Invista na academia para melhorar o nível dos jovens.',
    },
    analytics: {
        emoji: '📊',
        title: 'Analytics Avançado',
        tip: 'Dados detalhados de desempenho disponíveis. Use analytics para identificar padrões e otimizar sua tática.',
    },
    trophy_room: {
        emoji: '🏆',
        title: 'Sala de Troféus',
        tip: 'Seus troféus estão guardados aqui! Cada conquista conta para o legado do seu clube.',
    },
    scouting: {
        emoji: '🔍',
        title: 'Rede de Scouts',
        tip: 'Scouts revelam atributos escondidos de jogadores. Sem scouts, você compra no escuro — com eles, você encontra diamantes.',
    },
    media_center: {
        emoji: '📺',
        title: 'Centro de Mídia',
        tip: 'A imprensa acompanha cada passo seu agora. Entrevistas coletivas podem afetar o moral do elenco.',
    },
    board_room: {
        emoji: '🏛️',
        title: 'Reunião com Diretoria',
        tip: 'A diretoria agora quer te ouvir. Sua reputação afeta o orçamento e o poder de contratação.',
    },
    youth_watch: {
        emoji: '👶',
        title: 'Observatório de Jovens',
        tip: 'Acompanhe o progresso dos jovens da base em tempo real. Potencial (PA) nem sempre é atingido — depende de treino e oportunidades.',
    },
};

/**
 * §19.3 "Aha Moment" — scripted tactical teaching event
 */
const AHA_MOMENTS = [
    {
        week: 3,
        season: 1,
        condition: (engine) => {
            // Show if player has lost at least 1 match
            const stats = engine.managerStats || {};
            return (stats.losses || 0) >= 1;
        },
        emoji: '💡',
        title: 'Dica Tática',
        message: 'Você perdeu uma partida. Tente mudar a tática antes do próximo jogo — cada tática tem forças e fraquezas contra formações diferentes. Experimente!',
    },
    {
        week: 5,
        season: 1,
        condition: (engine) => {
            const stats = engine.managerStats || {};
            return (stats.wins || 0) >= 2;
        },
        emoji: '🔥',
        title: 'Você Está Aprendendo!',
        message: 'Duas vitórias! Sua tática está funcionando. Agora tente treinar o elenco regularmente — jogadores melhoram com treino semanal.',
    },
    {
        week: 8,
        season: 1,
        condition: (engine) => {
            const team = engine.getTeam(engine.manager?.teamId);
            return team?.squad?.some(p => (p.energy || 100) < 50);
        },
        emoji: '⚡',
        title: 'Gestão de Energia',
        message: 'Alguns jogadores estão cansados. Use preleção motivacional e rotacione o plantel — titular cansado joga pior que reserva descansado.',
    },
];

/**
 * UnlockTooltip — slides in when a new view is unlocked
 */
export function UnlockTooltip({ viewId, onDismiss }) {
    const [visible, setVisible] = useState(false);
    const tip = DISCLOSURE_TIPS[viewId];

    useEffect(() => {
        if (tip) {
            const timer = setTimeout(() => setVisible(true), 300);
            const autoHide = setTimeout(() => {
                setVisible(false);
                setTimeout(onDismiss, 500);
            }, 8000);
            return () => { clearTimeout(timer); clearTimeout(autoHide); };
        }
    }, [tip, onDismiss]);

    if (!tip) return null;

    return (
        <div className={`unlock-tooltip ${visible ? 'unlock-tooltip--visible' : ''}`}>
            <div className="unlock-tooltip__icon">{tip.emoji}</div>
            <div className="unlock-tooltip__content">
                <strong className="unlock-tooltip__title">🔓 {tip.title}</strong>
                <p className="unlock-tooltip__text">{tip.tip}</p>
            </div>
            <button className="unlock-tooltip__close" onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }} aria-label="Fechar">×</button>
        </div>
    );
}

/**
 * AhaMomentCard — contextual teaching card for week 2-8 of season 1
 */
export function AhaMomentCard({ engine }) {
    const [dismissed, setDismissed] = useState(() => {
        try { return JSON.parse(localStorage.getItem('elifoot_aha_dismissed') || '[]'); }
        catch { return []; }
    });

    const seasonWeek = ((engine.currentWeek - 1) % 38) + 1;
    const seasonNumber = engine.seasonNumber || 1;

    const activeMoment = AHA_MOMENTS.find(m =>
        m.week === seasonWeek &&
        m.season === seasonNumber &&
        !dismissed.includes(`${m.season}-${m.week}`) &&
        m.condition(engine)
    );

    const dismiss = useCallback((moment) => {
        const key = `${moment.season}-${moment.week}`;
        const updated = [...dismissed, key];
        setDismissed(updated);
        try { localStorage.setItem('elifoot_aha_dismissed', JSON.stringify(updated)); }
        catch { /* storage full */ }
    }, [dismissed]);

    if (!activeMoment) return null;

    return (
        <div className="aha-moment-card fade-in" onClick={() => dismiss(activeMoment)}>
            <div className="aha-moment-card__header">
                <span className="aha-moment-card__emoji">{activeMoment.emoji}</span>
                <strong>{activeMoment.title}</strong>
            </div>
            <p className="aha-moment-card__text">{activeMoment.message}</p>
            <span className="aha-moment-card__dismiss">Clique para fechar</span>
        </div>
    );
}

/**
 * §17 Achievement Popup — full celebration overlay for important unlocks
 */
export function AchievementPopup({ achievement, onDismiss }) {
    const [phase, setPhase] = useState('enter'); // enter → show → exit

    useEffect(() => {
        if (!achievement) return;
        const showTimer = setTimeout(() => setPhase('show'), 100);
        const exitTimer = setTimeout(() => setPhase('exit'), 4000);
        const doneTimer = setTimeout(onDismiss, 4500);
        return () => { clearTimeout(showTimer); clearTimeout(exitTimer); clearTimeout(doneTimer); };
    }, [achievement, onDismiss]);

    if (!achievement) return null;

    return (
        <div className={`achievement-popup achievement-popup--${phase}`} onClick={onDismiss}>
            <div className="achievement-popup__card">
                <div className="achievement-popup__glow" />
                <div className="achievement-popup__icon">{achievement.emoji || '🏅'}</div>
                <h3 className="achievement-popup__title">{achievement.name || achievement.title}</h3>
                <p className="achievement-popup__desc">{achievement.description || achievement.msg || ''}</p>
                {achievement.reward && (
                    <div className="achievement-popup__reward">+{achievement.reward} prestígio</div>
                )}
            </div>
        </div>
    );
}
