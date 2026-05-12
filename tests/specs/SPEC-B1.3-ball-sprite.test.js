/**
 * SPEC-B1.3: MatchBallSprite — pure helpers
 */

import { describe, it, expect } from 'vitest';
import {
    getBallAnimationDuration,
    getBallSize,
    MatchBallSprite,
} from '../../src/components/MatchBallSprite.jsx';

describe('SPEC-B1.3: MatchBallSprite', () => {

    describe('getBallAnimationDuration', () => {
        it('idle = 6s', () => {
            expect(getBallAnimationDuration('idle')).toBe('6s');
        });

        it('active = 3s', () => {
            expect(getBallAnimationDuration('active')).toBe('3s');
        });

        it('goal = 0.8s', () => {
            expect(getBallAnimationDuration('goal')).toBe('0.8s');
        });

        it('unknown defaults to idle', () => {
            expect(getBallAnimationDuration('random')).toBe('6s');
        });

        it('no arg defaults', () => {
            expect(getBallAnimationDuration()).toBe('6s');
        });
    });

    describe('getBallSize', () => {
        it('idle = 18', () => {
            expect(getBallSize('idle')).toBe(18);
        });

        it('active = 22', () => {
            expect(getBallSize('active')).toBe(22);
        });

        it('goal = 28', () => {
            expect(getBallSize('goal')).toBe(28);
        });
    });

    describe('MatchBallSprite component', () => {
        it('is exported as function', () => {
            expect(typeof MatchBallSprite).toBe('function');
        });
    });

});
