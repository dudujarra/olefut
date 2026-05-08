/**
 * DashboardHeader — Stitch refactor (zero inline styles funcionais).
 *
 * Substitui linhas 38-63 de DashboardView legacy.
 */

import React from 'react';
import { EfPanel, EfTooltip, EfClubBadge } from '../ui';
import { getClubColors } from '../../data/clubColors';
import './dashboard.css';

export function DashboardHeader({ team, stats, boardStatus, board, balance, seasonWeek, seasonNumber, legacyLevel, division }) {
    const clubColors = getClubColors(team.name);
    const themeStyle = {
        '--ef-club-primary': clubColors.primary,
        '--ef-club-secondary': clubColors.secondary,
        '--ef-club-accent': clubColors.accent
    };

    return (
        <EfPanel padding="md" className="ef-dash-header" style={themeStyle}>
            <div className="ef-dash-header-row">
                <div className="ef-dash-header-identity">
                    <EfClubBadge name={team.name} size="md" />
                    <div>
                        <h2 className="ef-dash-header-title">{team.name}</h2>
                        {clubColors.nickname && (
                            <span className="ef-dash-header-nickname">{clubColors.nickname}</span>
                        )}
                        <span className="ef-dash-header-meta">
                            {stats.position}º · Série {['A','B','C','D'][division - 1]} · {stats.wins}V {stats.draws}E {stats.losses}D
                            {stats.streak > 0 ? ` 🔥${stats.streak}` : stats.streak < 0 ? ` ❄️${Math.abs(stats.streak)}` : ''}
                        </span>
                    </div>
                </div>
                <div className="ef-dash-header-right">
                    <div
                        className="ef-dash-balance"
                        style={{ color: balance > 0 ? 'var(--ef-color-func-success)' : 'var(--ef-color-func-danger)' }}
                    >
                        R$ {(balance / 1000000).toFixed(1)}M
                    </div>
                    {boardStatus && (
                        <EfTooltip content={`Diretoria: ${boardStatus.label} (${board?.confidence ?? 60}%). Demissão se < 10%.`}>
                            <span className="ef-dash-board-status" style={{ color: boardStatus.color }}>
                                {boardStatus.emoji} {boardStatus.label}
                            </span>
                        </EfTooltip>
                    )}
                </div>
            </div>

            <div className="ef-dash-progress-track">
                <div
                    className="ef-dash-progress-fill"
                    style={{ width: `${(seasonWeek / 38) * 100}%` }}
                />
            </div>
            <div className="ef-dash-progress-meta">
                <span>Temp {seasonNumber} · Semana {seasonWeek}/38</span>
                {legacyLevel && <span>{legacyLevel.emoji} {legacyLevel.label}</span>}
            </div>
        </EfPanel>
    );
}

export default DashboardHeader;
