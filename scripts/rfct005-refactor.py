#!/usr/bin/env python3
"""
RFCT-005: Rewrite engine.js to delegate advanceWeek manager-mode and startNewSeason
to WeekProcessor and SeasonProcessor respectively.

Strategy:
1. Replace imports (lines 28-39) → slim imports + WeekProcessor/SeasonProcessor
2. Add processor instantiation in constructor after MatchSimulator
3. Replace advanceWeek manager-mode block (lines 844-1183) → single delegation call
4. Replace startNewSeason try block (lines 1294-1563) → delegation + keep post-try code
"""
import re

with open('src/engine/engine.js', 'r') as f:
    lines = f.readlines()

content = ''.join(lines)

# 1. Replace narrative system imports with slim version
old_imports = """import { InheritanceService } from '../services/InheritanceService';
import { apply as applyBoardTension, canBoardInterfere } from './BoardTensionSystem';
import { evaluate as evaluateHumiliation } from './HumiliationCascadeSystem';
import { evaluate as evaluateLossStreak, recordResult as recordStreakResult } from './LossStreakResponseSystem';
import { generate as generateChronicle } from './ChronicleSystem';
import { evaluate as evaluateCoachProposal } from './CoachProposalSystem';
import { evaluate as evaluateOrganicChallenge } from './OrganicChallengeSystem';
import { onBoardSellAttempt as checkStarProtection, updatePerformance as updateStarPerformance } from './StarProtectionSystem';
import { compute as computeHallOfLegends } from './HallOfLegendsSystem';
import { inherit as inheritTraits } from './HeritageTraitSystem';
import { evaluate as evaluateRivalry } from './RivalryUpgradeSystem';
import { evaluate as evaluateFilhosRegen } from './FilhosRegenSystem';"""

new_imports = """import { InheritanceService } from '../services/InheritanceService';
import { WeekProcessor } from '../services/WeekProcessor';
import { SeasonProcessor } from '../services/SeasonProcessor';
import { apply as applyBoardTension } from './BoardTensionSystem';
import { onBoardSellAttempt as checkStarProtection } from './StarProtectionSystem';"""

content = content.replace(old_imports, new_imports)

# 2. Add processor instantiation after MatchSimulator
old_constructor = """        // RFCT-004: MatchSimulator extracted from playMatch (ver src/services/MatchSimulator.js)
        this._matchSimulator = new MatchSimulator();"""
new_constructor = """        // RFCT-004: MatchSimulator extracted from playMatch (ver src/services/MatchSimulator.js)
        this._matchSimulator = new MatchSimulator();
        // RFCT-005: WeekProcessor + SeasonProcessor extracted from advanceWeek/startNewSeason
        this._weekProcessor = new WeekProcessor();
        this._seasonProcessor = new SeasonProcessor();"""

content = content.replace(old_constructor, new_constructor)

# 3. Replace advanceWeek manager-mode block
# Find the block from "// Manager mode:" to the closing of that if block
# The block starts with "        // Manager mode: finanças, fadiga, condições, transferências"
# and ends before "        // SPEC-131 + SPEC-132: NPC tactic pivot"
old_manager_start = "        // Manager mode: finanças, fadiga, condições, transferências\n"
old_manager_end = "\n        // SPEC-131 + SPEC-132: NPC tactic pivot"

idx_start = content.index(old_manager_start)
idx_end = content.index(old_manager_end)

new_manager_block = """        // Manager mode: delegated to WeekProcessor (RFCT-005)
        if (this.mode === 'manager') {
            this._weekProcessor.process(this, weekResults);
        }
"""

content = content[:idx_start] + new_manager_block + content[idx_end:]

# 4. Replace startNewSeason try block
# The block starts with "        try {\n            const team = this.getTeam(this.manager?.teamId);\n            if (team && this.mode === 'manager') {"
# and ends with "        } catch { /* defensive — never break rollover */ }"
old_season_start = "        try {\n            const team = this.getTeam(this.manager?.teamId);\n            if (team && this.mode === 'manager') {"
old_season_end = "        } catch { /* defensive — never break rollover */ }\n"

idx_s2 = content.index(old_season_start)
idx_e2 = content.index(old_season_end) + len(old_season_end)

new_season_block = """        // Season-end processing: delegated to SeasonProcessor (RFCT-005)
        try {
            this._seasonProcessor.process(this);
        } catch { /* defensive — never break rollover */ }
"""

content = content[:idx_s2] + new_season_block + content[idx_e2:]

with open('src/engine/engine.js', 'w') as f:
    f.write(content)

# Count final lines
final_loc = content.count('\n')
print(f"✅ engine.js rewritten: {final_loc} LOC")
