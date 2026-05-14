#!/usr/bin/env bash
# ============================================================================
# OléFUT Lab — ALL Tests Sequential Runner
# Roda LITERALMENTE todos os .test.js do projeto, um a um, sequencialmente.
# Resultados completos salvos em lab-results/<timestamp>.log
#
# Uso:
#   ./scripts/run-lab.sh              # tudo, continua em falha
#   ./scripts/run-lab.sh --strict     # para no primeiro que falhar
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."

STRICT=false
[[ "${1:-}" == "--strict" ]] && STRICT=true

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m'
CYAN='\033[0;36m' BOLD='\033[1m' DIM='\033[2m' RST='\033[0m'

PASS=0 FAIL=0 TOTAL=0
RESULTS=()
T0=$(date +%s)

# ─── Log file ───────────────────────────────────────────────────────────
LOGDIR="lab-results"
mkdir -p "$LOGDIR"
LOGFILE="$LOGDIR/$(date +%Y%m%d-%H%M%S).log"
echo "═══ OléFUT Lab — $(date '+%Y-%m-%d %H:%M:%S') ═══" > "$LOGFILE"
echo "" >> "$LOGFILE"

run() {
    local label="$1" cmd="$2" tmo="${3:-120}"
    TOTAL=$((TOTAL+1))
    printf "\n${CYAN}━━━ ${BOLD}[%03d] %s${RST}\n${DIM}  $ %s${RST}\n" "$TOTAL" "$label" "$cmd"
    local t0=$(date +%s)
    # Capture full output to temp file
    local tmpout; tmpout=$(mktemp)
    set +e; eval "timeout $tmo $cmd" >"$tmpout" 2>&1; local rc=$?; set -e
    local dt=$(( $(date +%s) - t0 ))

    # Write to log file
    printf "\n━━━ [%03d] %s\n  \$ %s\n" "$TOTAL" "$label" "$cmd" >> "$LOGFILE"

    if [ $rc -eq 0 ]; then
        printf "${GREEN}  ✅ PASS${RST} (%ds)\n" "$dt"
        RESULTS+=("✅ $label ($dt s)")
        printf "  ✅ PASS (%ds)\n" "$dt" >> "$LOGFILE"
        PASS=$((PASS+1))
    else
        local tag="❌ FAIL (exit $rc)"
        [ $rc -eq 124 ] && tag="⏰ TIMEOUT"
        printf "${RED}  $tag${RST} (%ds)\n" "$dt"
        RESULTS+=("$tag — $label ($dt s)")
        printf "  $tag (%ds)\n" "$dt" >> "$LOGFILE"
        FAIL=$((FAIL+1))
        $STRICT && { rm -f "$tmpout"; summary; exit 1; }
    fi

    # Always append full output to log
    printf "  ── output ──\n" >> "$LOGFILE"
    cat "$tmpout" >> "$LOGFILE"
    printf "  ── end ──\n" >> "$LOGFILE"
    rm -f "$tmpout"
}

summary() {
    local elapsed=$(( $(date +%s) - T0 ))
    printf "\n${CYAN}╔════════════════════════════════════════════════════════════════╗${RST}\n"
    printf "${CYAN}║${RST} ${BOLD}OléFUT Lab — %d tests | %dm%02ds${RST}%*s${CYAN}║${RST}\n" \
        "$TOTAL" $((elapsed/60)) $((elapsed%60)) 28 ""
    printf "${CYAN}╠════════════════════════════════════════════════════════════════╣${RST}\n"
    printf "${CYAN}║${RST}  ${GREEN}Pass: %d${RST}  ${RED}Fail: %d${RST}%*s${CYAN}║${RST}\n" "$PASS" "$FAIL" 42 ""
    printf "${CYAN}╚════════════════════════════════════════════════════════════════╝${RST}\n"
    if [ $FAIL -gt 0 ]; then
        printf "\n${RED}${BOLD}FALHAS:${RST}\n"
        for r in "${RESULTS[@]}"; do [[ "$r" == ✅* ]] || printf "  %s\n" "$r"; done
    else
        printf "\n${GREEN}${BOLD}TUDO PASSOU ✅${RST}\n"
    fi

    # ─── Persist summary to log file ────────────────────────────────
    {
        echo ""
        echo "════════════════════════════════════════════════════════"
        echo "RESUMO — $TOTAL tests | ${elapsed}s ($(( elapsed/60 ))m$((elapsed%60))s)"
        echo "  Pass: $PASS  Fail: $FAIL"
        echo "════════════════════════════════════════════════════════"
        echo ""
        echo "── TODOS OS RESULTADOS ──"
        for r in "${RESULTS[@]}"; do echo "  $r"; done
        echo ""
        if [ $FAIL -gt 0 ]; then
            echo "── FALHAS ──"
            for r in "${RESULTS[@]}"; do [[ "$r" == ✅* ]] || echo "  $r"; done
        else
            echo "TUDO PASSOU ✅"
        fi
    } >> "$LOGFILE"

    printf "\n${DIM}📄 Log completo: %s${RST}\n" "$LOGFILE"
}

V="npx vitest run --reporter=dot"
VS="env SOAK=1 npx vitest run --reporter=dot"

# ══════════════════════════════════════════════════════════════════
# BLOCO 0: BUILD
# ══════════════════════════════════════════════════════════════════
run "Build produção" "npx vite build" 60

# ══════════════════════════════════════════════════════════════════
# BLOCO 1: ROOT (2 files)
# ══════════════════════════════════════════════════════════════════
run "engine.test.js"         "$V tests/engine.test.js" 60
run "static-checks.test.js"  "$V tests/static-checks.test.js" 60

# ══════════════════════════════════════════════════════════════════
# BLOCO 2: UNIT (5 files)
# ══════════════════════════════════════════════════════════════════
for f in \
  dagger-bootstrap learned-emotional-modifiers learned-goal-relevance \
  llm-narrative-service-toggle thompson-bandit; do
    run "unit/$f" "$V tests/unit/$f.test.js" 60
done

# ══════════════════════════════════════════════════════════════════
# BLOCO 3: AUDIO (1 file)
# ══════════════════════════════════════════════════════════════════
run "audio/audio-generator" "$V tests/audio/audio-generator.test.js" 60

# ══════════════════════════════════════════════════════════════════
# BLOCO 4: DESIGN (1 file)
# ══════════════════════════════════════════════════════════════════
run "design/gdd-checklist" "$V tests/design/gdd-checklist.test.js" 60

# ══════════════════════════════════════════════════════════════════
# BLOCO 5: CHARACTERIZATION (2 files)
# ══════════════════════════════════════════════════════════════════
run "char/engine-golden"   "$V tests/characterization/engine-golden.test.js" 120
run "char/save-roundtrip"  "$V tests/characterization/save-roundtrip.test.js" 120

# ══════════════════════════════════════════════════════════════════
# BLOCO 6: STATISTICAL (2 files)
# ══════════════════════════════════════════════════════════════════
run "stat/baseline-stats" "$V tests/statistical/baseline-stats.test.js" 120
run "stat/poisson-10k"    "$V tests/statistical/poisson-10k.test.js" 120

# ══════════════════════════════════════════════════════════════════
# BLOCO 7: REGRESSION (25 files)
# ══════════════════════════════════════════════════════════════════
for f in \
  BUG-010 BUG-011 BUG-015 BUG-019 BUG-020 BUG-021 BUG-022 \
  BUG-026-029-autoplay BUG-032-034-cascade BUG-040-043-cascade \
  BUG-055-draws-only BUG-078 BUG-079 \
  BUG-083-save-reload-error-boundary BUG-084-standings-hydration \
  BUG-085-press-service-dead BUG-086-achievement-callsites \
  SPEC-060-club-identity SPEC-080-positions SPEC-100-114-telemetry \
  SPEC-115-117-adaptive-bot SPEC-117-skip-auto-restore \
  SPEC-122-buy-offer-memory SPEC-123-realtime-learning UX-overhaul; do
    run "regression/$f" "$V tests/regression/$f.test.js" 60
done

# ══════════════════════════════════════════════════════════════════
# BLOCO 8: SPECS (86 files)
# ══════════════════════════════════════════════════════════════════
for f in \
  SPEC-001-match-engine SPEC-002-events-deck SPEC-003-player-development \
  SPEC-004-formation-tactic SPEC-005-injury-system SPEC-006-board-system \
  SPEC-007-personality-traits SPEC-008-stress-system SPEC-009-youth-academy \
  SPEC-010-stadium SPEC-011-staff SPEC-012-scouting SPEC-014-season-tournament \
  SPEC-025-aging SPEC-029-achievements SPEC-070-manager-identity-system \
  SPEC-071-contract-goal-system SPEC-072-board-tension-system \
  SPEC-073-coach-proposal-system SPEC-074-organic-challenge-system \
  SPEC-075-star-protection-system SPEC-076-humiliation-cascade-system \
  SPEC-077-loss-streak-response-system SPEC-078-hall-of-legends-system \
  SPEC-079-heritage-trait-system SPEC-080-rivalry-upgrade-system \
  SPEC-081-filhos-regen-system SPEC-082-chronicle-system \
  SPEC-131-npc-tactic-advisor SPEC-132-squad-health-monitor \
  SPEC-133-market-pricer SPEC-134-growth-event-system \
  SPEC-135-view-unlock-system SPEC-143-meta-progression SPEC-144-soak-tests \
  SPEC-166-lineage-inline-audit SPEC-171-font-tokens \
  SPEC-178-inline-style-enforcement SPEC-179-player-mode-scope \
  SPEC-180-win-streak-modifier SPEC-181-legends-pool SPEC-183 SPEC-184 \
  SPEC-A1-rookie-sidebar SPEC-A2-onboarding-coach SPEC-A3-tactic-suggester \
  SPEC-A4-match-analyst SPEC-A5-rookie-handicap SPEC-AUTOPLAYLAB \
  SPEC-B1-event-classifier SPEC-B1.3-ball-sprite SPEC-B2-mid-match-deck \
  SPEC-B2.2-mid-match-modal SPEC-B3-chronicle-modal SPEC-B5-tactic-formatter \
  SPEC-B6-brazilian-atmosphere SPEC-B6.2-enrich-card \
  SPEC-C2-star-player-link SPEC-C2.3-unified-bridge \
  SPEC-C4-mod-loader SPEC-C4.2-sample-mod \
  SPEC-C5.2-derby-detector SPEC-C5.3-derby-cards \
  SPEC-C6-seasonal-events SPEC-C6.2-seasonal-modal \
  SPEC-CareerService SPEC-ChronicleService \
  SPEC-F1.1-highlight-modal SPEC-F1.2-F1.3-reactive-toast \
  SPEC-F3-club-voice SPEC-F4-star-narrative \
  SPEC-F5-F6-aha-telemetry SPEC-F5.1-onboarding-triggers \
  SPEC-InheritanceService SPEC-MonitorAutoLogger SPEC-MonitorService \
  SPEC-MythService SPEC-NarrativeArcs SPEC-NarrativeService \
  SPEC-RegenLineage SPEC-RelationshipService \
  SPEC-evaluateMyth SPEC-eventTemplates \
  loan-system playstyles tournament-reset; do
    run "specs/$f" "$V tests/specs/$f.test.js" 60
done

# ══════════════════════════════════════════════════════════════════
# BLOCO 9: INTEGRATION — rápidos (11 files)
# ══════════════════════════════════════════════════════════════════
for f in \
  autoplay-full-audit autoplay-gdd-proof build-budget e2e-config \
  lineage-view-data llm-narrative-service seasonhistory-data \
  state-championship-init state-championship-mg-rs \
  system-integration v2-gaps-smoke; do
    run "integration/$f" "$V tests/integration/$f.test.js" 180
done

# ══════════════════════════════════════════════════════════════════
# BLOCO 10: INTEGRATION — MARL E2E (pesado)
# ══════════════════════════════════════════════════════════════════
run "integration/marl-e2e" "$V tests/integration/marl-e2e.test.js --testTimeout=120000" 180

# ══════════════════════════════════════════════════════════════════
# BLOCO 11: DEEP SOAK 20 seasons
# ══════════════════════════════════════════════════════════════════
run "🔥 deep-soak-20seasons" "$VS tests/integration/deep-soak-20seasons.test.js --testTimeout=300000" 300

# ══════════════════════════════════════════════════════════════════
# BLOCO 12: DEEP SOAK 100 seasons
# ══════════════════════════════════════════════════════════════════
run "🔥 deep-soak-100seasons" "$VS tests/integration/deep-soak-100seasons.test.js --testTimeout=600000" 600

# ══════════════════════════════════════════════════════════════════
# BLOCO 13: 💀 SINISTRO LAB 100 seasons (Iguatu × Hell Mode)
# ══════════════════════════════════════════════════════════════════
run "💀 sinistro-500seasons-lab" "$VS tests/integration/sinistro-100seasons-lab.test.js --testTimeout=3600000" 3600

# ══════════════════════════════════════════════════════════════════
# BLOCO 14: 🧪 LAB PRESETS FULL (46 presets headless)
# ══════════════════════════════════════════════════════════════════
run "🧪 lab-presets-full (46 presets)" "$VS tests/integration/lab-presets-full.test.js --testTimeout=300000" 600

# ══════════════════════════════════════════════════════════════════
# BLOCO 15: E2E Playwright (6 specs)
# ══════════════════════════════════════════════════════════════════
for f in \
  advance-week-standings responsive-mobile save-reload-roundtrip \
  sidebar-nav-no-crash start-team-select tutorial-completable; do
    run "e2e/$f" "npx playwright test tests/e2e/$f.spec.js" 120
done

# ══════════════════════════════════════════════════════════════════
summary
exit $FAIL
