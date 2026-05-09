/**
 * SPEC-113: Tutorial Funnel
 *
 * Drop rate por step. Em soak test pode ter pouca data; reporta isso.
 */

import { buildResult, safeDetect, clamp } from './_utils.js';

const SPEC = 'SPEC-113';
const NAME = 'Tutorial Funnel';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const tutorialSteps = history.tutorialSteps || [];
    const startedTutorial = Number(history.startedFromTutorial) || 0;
    const startedSkip = Number(history.startedFromSkip) || 0;

    if (tutorialSteps.length === 0 && startedTutorial === 0) {
        return buildResult(SPEC, NAME, 50, [{
            id: 'NO_DATA',
            severity: 0.5,
            msg: 'Tutorial não exercitado neste run'
        }], {
            startedTutorial,
            startedSkip,
            completionRate: 0
        });
    }

    const totalReached = tutorialSteps.filter(s => s.reached).length;
    const completionRate = tutorialSteps.length > 0
        ? totalReached / tutorialSteps.length
        : 0;

    const signals = [];

    const drops = tutorialSteps.filter(s => s.droppedAt);
    if (drops.length > 0) {
        const worstStep = drops.sort((a, b) => (b.droppedAt ? 1 : 0) - (a.droppedAt ? 1 : 0))[0];
        signals.push({
            id: 'HIGH_DROP',
            severity: 0.6,
            msg: `Drop em "${worstStep.step}"`
        });
    }

    if (completionRate >= 0.7) {
        signals.push({
            id: 'COMPLETION_OK',
            severity: 0.1,
            msg: `Completion ${(completionRate * 100).toFixed(0)}%`
        });
    }

    const score = clamp(completionRate * 100);

    return buildResult(SPEC, NAME, score, signals, {
        startedTutorial,
        startedSkip,
        completionRate: parseFloat(completionRate.toFixed(2))
    });
});

export default { detect, SPEC, NAME };
