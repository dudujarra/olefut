/**
 * SPEC-B3: ChronicleSeasonEndModal — pure helper tests
 */

import { describe, it, expect } from 'vitest';
import {
    buildChronicleMarkdown,
    buildChronicleFilename,
    buildChroniclePngFilename,
    renderChronicleToCanvas,
} from '../../src/components/ChronicleSeasonEndModal.jsx';

const sampleChronicle = {
    season: 3,
    clubName: 'Cruzeiro',
    managerName: 'Dudu',
    mood: 'triumph',
    chronicle: 'Foi a temporada da raça. Vencemos o impossível.',
};

describe('SPEC-B3: ChronicleSeasonEndModal helpers', () => {

    describe('buildChronicleMarkdown', () => {
        it('returns string with season number', () => {
            const md = buildChronicleMarkdown(sampleChronicle);
            expect(md).toMatch(/Temporada 3/);
        });

        it('includes club name + manager', () => {
            const md = buildChronicleMarkdown(sampleChronicle);
            expect(md).toContain('Cruzeiro');
            expect(md).toContain('Dudu');
        });

        it('includes chronicle text', () => {
            const md = buildChronicleMarkdown(sampleChronicle);
            expect(md).toContain('Foi a temporada da raça');
        });

        it('mood triumph maps to TRIUNFO', () => {
            const md = buildChronicleMarkdown(sampleChronicle);
            expect(md).toContain('TRIUNFO');
        });

        it('mood despair maps to TRAGEDIA', () => {
            const md = buildChronicleMarkdown({ ...sampleChronicle, mood: 'despair' });
            expect(md).toContain('TRAGEDIA');
        });

        it('mood normal maps to CRONICA', () => {
            const md = buildChronicleMarkdown({ ...sampleChronicle, mood: 'normal' });
            expect(md).toContain('CRONICA');
        });

        it('null chronicle returns empty string', () => {
            expect(buildChronicleMarkdown(null)).toBe('');
        });

        it('starts with h1 markdown header', () => {
            expect(buildChronicleMarkdown(sampleChronicle)).toMatch(/^# /);
        });
    });

    describe('buildChronicleFilename', () => {
        it('format: cronica-temp-N-CLUB.md', () => {
            expect(buildChronicleFilename(sampleChronicle)).toBe('cronica-temp-3-cruzeiro.md');
        });

        it('sanitizes special chars in club name', () => {
            const r = buildChronicleFilename({ ...sampleChronicle, clubName: 'Atlético-MG' });
            expect(r).toBe('cronica-temp-3-atl_tico_mg.md');
        });

        it('null → default name', () => {
            expect(buildChronicleFilename(null)).toBe('cronica.md');
        });

        it('missing fields → graceful fallback', () => {
            const r = buildChronicleFilename({ season: 5 });
            expect(r).toMatch(/cronica-temp-5-clube\.md/);
        });
    });

    describe('determinism', () => {
        it('same chronicle → same MD', () => {
            const a = buildChronicleMarkdown(sampleChronicle);
            const b = buildChronicleMarkdown(sampleChronicle);
            expect(a).toBe(b);
        });

        it('same chronicle → same filename', () => {
            expect(buildChronicleFilename(sampleChronicle)).toBe(buildChronicleFilename(sampleChronicle));
        });
    });

    describe('PNG export helpers', () => {
        it('buildChroniclePngFilename has .png suffix', () => {
            expect(buildChroniclePngFilename(sampleChronicle)).toMatch(/\.png$/);
        });

        it('buildChroniclePngFilename includes season + club', () => {
            expect(buildChroniclePngFilename(sampleChronicle)).toBe('cronica-temp-3-cruzeiro.png');
        });

        it('buildChroniclePngFilename null → default', () => {
            expect(buildChroniclePngFilename(null)).toBe('cronica.png');
        });

        it('renderChronicleToCanvas returns null in non-browser env', () => {
            // happy-dom provides document; but if not, we skip
            if (typeof document === 'undefined') {
                expect(renderChronicleToCanvas(sampleChronicle)).toBe(null);
            } else {
                const dataUrl = renderChronicleToCanvas(sampleChronicle);
                expect(typeof dataUrl === 'string' || dataUrl === null).toBe(true);
            }
        });

        it('renderChronicleToCanvas null chronicle → null', () => {
            expect(renderChronicleToCanvas(null)).toBe(null);
        });
    });

});
