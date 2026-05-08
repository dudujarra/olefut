/**
 * ChronicleService — v1.5 (AKITA-056)
 *
 * Gera prosa narrativa do save: por temporada + lifetime.
 *
 * Stateless. Composição de:
 * - NarrativeService (events + decay + arcs)
 * - MythService (legends + halls)
 * - RelationshipService (rivalries + president)
 * - CareerService (proPlayer + manager career)
 *
 * Output: string Markdown-ish que pode ser convertida pra PNG/PDF/share.
 */

export class ChronicleService {
    constructor({ narrativeService, mythService, relationshipService, careerService } = {}) {
        this._narrativeService = narrativeService;
        this._mythService = mythService;
        this._relationshipService = relationshipService;
        this._careerService = careerService;
    }

    /**
     * Generate season chronicle (markdown).
     */
    generateSeasonChronicle(save, season = null) {
        if (!save) return '';
        const lines = [];
        const currentSeason = season ?? save.seasonNumber ?? 1;

        lines.push(`# CRÔNICA — TEMPORADA ${currentSeason}`);
        lines.push('');
        lines.push('## EVENTOS MARCANTES');

        // Events with high narrativeWeight, sorted by intensity
        if (this._narrativeService) {
            const events = this._narrativeService.getDecayedEvents(save);
            const top = events
                .filter(e => e.narrativeWeight >= 3)
                .sort((a, b) => (b.currentIntensity ?? b.intensity) - (a.currentIntensity ?? a.intensity))
                .slice(0, 5);

            if (top.length === 0) {
                lines.push('*Temporada sem eventos memoráveis registrados.*');
            } else {
                for (const evt of top) {
                    lines.push(`- ${evt.headline || evt.type}`);
                }
            }
        }
        lines.push('');

        // Open arcs
        lines.push('## ARCOS NARRATIVOS');
        if (this._narrativeService) {
            const arcs = this._narrativeService.getOpenArcs(save);
            if (arcs.length === 0) {
                lines.push('*Nenhum arco em aberto.*');
            } else {
                for (const arc of arcs) {
                    lines.push(`- **${arc.name}** — atores ${arc.actors.join(', ')}`);
                }
            }
        }
        lines.push('');

        // Hall of Fame
        if (this._mythService) {
            const totalCanonized = this._mythService.getTotalCanonized(save);
            lines.push('## HALL DE LENDAS');
            lines.push(`Total ídolos canonizados: ${totalCanonized}`);
            lines.push('');
        }

        // Manager state
        if (this._relationshipService) {
            const trust = this._relationshipService.getCoachReputation(save);
            const patience = this._relationshipService.getPresidentPatience(save);
            lines.push('## DIRETORIA');
            lines.push(`Confiança: ${trust >= 0 ? '+' : ''}${trust} | Paciência: ${patience}/100`);
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Generate lifetime chronicle (cumulativa de todas temporadas).
     */
    generateLifetimeChronicle(save) {
        if (!save) return '';
        const lines = [];

        lines.push('# CRÔNICA DO SAVE');
        lines.push(`Temporadas jogadas: ${save.seasonNumber || 1}`);
        lines.push('');

        // ProPlayer journey if existed
        if (this._careerService) {
            const proPlayer = this._careerService.getProPlayer(save);
            if (proPlayer) {
                lines.push('## CARREIRA JOGADOR');
                lines.push(`- ${proPlayer.name} ${proPlayer.retired ? '(aposentado)' : '(ativo)'}`);
                if (proPlayer.careerStats) {
                    lines.push(`- ${proPlayer.careerStats.totalGoals || 0} gols / ${proPlayer.careerStats.totalAppearances || 0} jogos`);
                }
                lines.push('');
            }

            const managerCareer = this._careerService.getManagerCareer(save);
            if (managerCareer) {
                lines.push('## CARREIRA TÉCNICO');
                lines.push(`- ${managerCareer.history?.length || 0} clube(s) dirigido(s)`);
                lines.push('');
            }
        }

        // Total mythic legends
        if (this._mythService) {
            const total = this._mythService.getTotalCanonized(save);
            lines.push(`## LEGADO MÍTICO`);
            lines.push(`${total} jogador${total !== 1 ? 'es' : ''} canonizado${total !== 1 ? 's' : ''} no save.`);
            lines.push('');
        }

        // Regen lineage
        if (this._mythService) {
            const children = this._mythService.getRegenChildren(save);
            if (children.length > 0) {
                lines.push('## LINHAGEM REGEN');
                lines.push(`${children.length} filho${children.length !== 1 ? 's' : ''} de ex-jogadores nasceram.`);
                lines.push('');
            }
        }

        return lines.join('\n');
    }

    /**
     * Export save as JSON string (debugging + share).
     */
    exportSaveJSON(save) {
        try {
            return JSON.stringify(save, null, 2);
        } catch (e) {
            return '{}';
        }
    }

    /**
     * Generate quick stats summary (used em ChronicleView header).
     */
    getStatsSummary(save) {
        if (!save) return null;
        return {
            season: save.seasonNumber || 1,
            week: save.currentWeek || 0,
            eventsCount: (save.events || []).length,
            arcsCount: (save.arcs || []).length,
            openArcsCount: (save.arcs || []).filter(a => a.status === 'open').length,
            decisionsCount: (save.decisions || []).length,
            regenChildrenCount: (save.regenLineage || []).length,
            retiredPlayersCount: (save.retiredPlayers || []).length
        };
    }
}
