#!/bin/bash
# ============================================================
# olefut-bug-sweep.sh — Skill de Bug Sweep Automatizado
#
# Protocolo AKITA de QA para o OléFUT RPG Engine
#
# WORKFLOW:
#   1. SCAN  — Varredura estática de bugs no source
#   2. TICKET — Gera/atualiza BUGS.md com achados
#   3. TEST  — Roda suite de testes (vitest)
#   4. BUILD — Valida build de produção (vite build)
#   5. REPORT — Gera relatório final
#
# USO:
#   ./scripts/olefut-bug-sweep.sh          # roda tudo
#   ./scripts/olefut-bug-sweep.sh scan     # só varredura
#   ./scripts/olefut-bug-sweep.sh test     # só testes
#   ./scripts/olefut-bug-sweep.sh ci       # testes + build
#   ./scripts/olefut-bug-sweep.sh report   # relatório
# ============================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$PROJECT_DIR/src"
ENGINE_DIR="$SRC_DIR/engine"
COMPONENTS_DIR="$SRC_DIR/components"
TESTS_DIR="$PROJECT_DIR/tests"
BUGS_FILE="$PROJECT_DIR/BUGS.md"
REPORT_FILE="$PROJECT_DIR/docs/qa-report.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

BUGS_FOUND=0
WARNINGS_FOUND=0
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# ============================================================
# HELPERS
# ============================================================
log_header() { echo -e "\n${CYAN}═══════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}═══════════════════════════════════════════${NC}"; }
log_ok()     { echo -e "  ${GREEN}✓${NC} $1"; }
log_warn()   { echo -e "  ${YELLOW}⚠${NC} $1"; WARNINGS_FOUND=$((WARNINGS_FOUND + 1)); }
log_bug()    { echo -e "  ${RED}✗${NC} $1"; BUGS_FOUND=$((BUGS_FOUND + 1)); }
log_info()   { echo -e "  ${BLUE}ℹ${NC} $1"; }

# ============================================================
# SCAN: Varredura estática de bugs
# ============================================================
do_scan() {
    log_header "🔍 FASE 1: VARREDURA ESTÁTICA"

    # --- CHECK 1: Métodos chamados na UI que não existem na engine ---
    log_info "Verificando métodos UI vs Engine..."
    
    # Extract all engine.METHOD() calls from components
    UI_METHODS=$(grep -rohE 'engine\.\w+\(' "$COMPONENTS_DIR"/*.jsx 2>/dev/null | sed 's/engine\.//;s/($//' | sort -u)
    
    # Extract all method definitions from engine
    ENGINE_METHODS=$(grep -oE '^\s+(get|set|do|check|answer|advance|play|accept|reject|upgrade|hire|loan|renew|scout|sell|sign)\w+\(' "$ENGINE_DIR/engine.js" 2>/dev/null | sed 's/^\s*//;s/($//' | sort -u)
    
    for method in $UI_METHODS; do
        # Skip common JS methods
        [[ "$method" =~ ^(getTeam|find|filter|map|forEach|length|push|includes|slice|reduce)$ ]] && continue
        if ! echo "$ENGINE_METHODS" | grep -q "^${method}$" 2>/dev/null; then
            # Check if it exists anywhere in engine.js (could be a property access, not a method def)
            if ! grep -q "${method}" "$ENGINE_DIR/engine.js" 2>/dev/null; then
                log_bug "BUG: UI chama engine.${method}() mas método não existe na engine"
            fi
        fi
    done
    
    # --- CHECK 2: Imports mortos ---
    log_info "Verificando imports mortos..."
    
    for file in "$COMPONENTS_DIR"/*.jsx; do
        basename=$(basename "$file")
        # Get named imports (handle multiline by extracting single names)
        imports=$(grep -oE 'import \{ [^}]+ \}' "$file" 2>/dev/null | sed 's/import { //;s/ }//;s/,/\n/g' | sed 's/^ *//;s/ *$//' | grep -v '^$')
        for imp in $imports; do
            # Skip short names that cause false positives
            [ ${#imp} -lt 3 ] && continue
            # Count occurrences (should be > 1: the import + at least 1 usage)
            count=$(grep -cw "$imp" "$file" 2>/dev/null || true)
            if [ "$count" -le 1 ]; then
                log_warn "Import morto: ${basename} importa '${imp}' mas nunca usa"
            fi
        done
    done
    
    # --- CHECK 3: Null safety em eventos ---
    log_info "Verificando null-safety em eventos..."
    
    # Check for .text without optional chaining in MatchView
    UNSAFE=$(grep -n '\.text\.' "$COMPONENTS_DIR/MatchView.jsx" 2>/dev/null | grep -v '\.text?\.' | grep -v '//' || true)
    if [ -n "$UNSAFE" ]; then
        log_warn "Acesso não-seguro a .text em MatchView (sem optional chaining)"
    else
        log_ok "Null-safety OK em MatchView"
    fi
    
    # --- CHECK 4: State resets ---
    log_info "Verificando reset de state entre fases..."
    
    # Check that the fulltime/dashboard button resets all states
    # We search the entire file for lines that contain both changeView('dashboard') and each state setter
    RESET_BLOCK=$(grep "changeView.*dashboard" "$COMPONENTS_DIR/MatchView.jsx" 2>/dev/null || true)
    for state in "setPreStep" "setTalkDone" "setSubUsed" "setTacticChanged"; do
        if echo "$RESET_BLOCK" | grep -q "$state"; then
            log_ok "Fulltime reseta: ${state}"
        else
            log_bug "BUG: Fulltime NÃO reseta: ${state}"
        fi
    done
    
    # --- CHECK 5: Direct state mutation ---
    log_info "Verificando mutação direta de engine state..."
    
    for file in "$COMPONENTS_DIR"/*.jsx; do
        basename=$(basename "$file")
        # Check for team.squad = or team.balance = (should use engine methods)
        MUTATIONS=$(grep -n 'team\.squad\s*=' "$file" 2>/dev/null | grep -v '//' || true)
        if [ -n "$MUTATIONS" ]; then
            log_warn "Mutação direta de squad em ${basename}"
        fi
        BALANCE_MUT=$(grep -n 'team\.balance\s*[+-]=' "$file" 2>/dev/null | grep -v '//' || true)
        if [ -n "$BALANCE_MUT" ]; then
            log_warn "Mutação direta de balance em ${basename}"
        fi
    done
    
    # --- CHECK 6: useRef for intervals ---
    log_info "Verificando cleanup de timers..."
    
    if grep -q "clearInterval(timerRef" "$COMPONENTS_DIR/MatchView.jsx" 2>/dev/null; then
        log_ok "Timer cleanup presente em MatchView"
    else
        log_bug "BUG: Sem cleanup de timer em MatchView (memory leak)"
    fi
    
    # --- CHECK 7: Speed ref pattern ---
    log_info "Verificando speedRef pattern..."
    
    if grep -q "speedRef.current" "$COMPONENTS_DIR/MatchView.jsx" 2>/dev/null; then
        log_ok "speedRef pattern presente"
    else
        log_warn "speedRef não encontrado — speed control pode não funcionar em tempo real"
    fi

    # --- CHECK 8: Mobile responsiveness ---
    log_info "Verificando responsive mobile..."
    
    if grep -q "hide-mobile" "$SRC_DIR/index.css" 2>/dev/null; then
        log_ok "hide-mobile CSS rule presente"
    else
        log_warn "Sem rule .hide-mobile — SquadView pode estourar em mobile"
    fi
    
    echo ""
    log_info "Scan completo: ${BUGS_FOUND} bugs, ${WARNINGS_FOUND} warnings"
}

# ============================================================
# TEST: Roda suite de testes
# ============================================================
do_test() {
    log_header "🧪 FASE 2: TESTES AUTOMATIZADOS"
    
    cd "$PROJECT_DIR"
    
    if [ ! -f "$TESTS_DIR/engine.test.js" ]; then
        log_bug "Arquivo de teste engine.test.js não encontrado!"
        return 1
    fi
    
    log_info "Rodando vitest..."
    echo ""
    
    if npx vitest run --reporter=verbose 2>&1; then
        log_ok "Todos os testes passaram!"
    else
        log_bug "Testes falharam!"
        return 1
    fi
}

# ============================================================
# BUILD: Valida build de produção
# ============================================================
do_build() {
    log_header "🔨 FASE 3: BUILD DE PRODUÇÃO"
    
    cd "$PROJECT_DIR"
    
    log_info "Rodando vite build..."
    
    BUILD_OUTPUT=$(npx vite build 2>&1)
    
    if echo "$BUILD_OUTPUT" | grep -q "✓ built"; then
        # Extract metrics
        JS_SIZE=$(echo "$BUILD_OUTPUT" | grep '\.js' | awk '{print $3, $4}')
        CSS_SIZE=$(echo "$BUILD_OUTPUT" | grep '\.css' | awk '{print $3, $4}')
        BUILD_TIME=$(echo "$BUILD_OUTPUT" | grep 'built in' | grep -oE '[0-9]+ms')
        MODULES=$(echo "$BUILD_OUTPUT" | grep 'modules' | grep -oE '[0-9]+ modules')
        
        log_ok "Build OK: JS=${JS_SIZE}, CSS=${CSS_SIZE}, ${BUILD_TIME}, ${MODULES}"
    else
        log_bug "Build falhou!"
        echo "$BUILD_OUTPUT"
        return 1
    fi
}

# ============================================================
# REPORT: Gera relatório QA
# ============================================================
do_report() {
    log_header "📊 FASE 4: RELATÓRIO"
    
    cd "$PROJECT_DIR"
    
    # Count tests
    TEST_COUNT=$(grep -rc 'it(' "$TESTS_DIR" 2>/dev/null | awk -F: '{sum+=$2} END{print sum}')
    TEST_FILES=$(ls "$TESTS_DIR"/*.test.js 2>/dev/null | wc -l | tr -d ' ')
    
    # Count engine methods
    ENGINE_METHODS=$(grep -cE '^\s+\w+\(' "$ENGINE_DIR/engine.js" 2>/dev/null || echo "0")
    
    # Count components
    COMPONENT_COUNT=$(ls "$COMPONENTS_DIR"/*.jsx 2>/dev/null | wc -l | tr -d ' ')
    
    # Count lines
    ENGINE_LINES=$(wc -l < "$ENGINE_DIR/engine.js" 2>/dev/null | tr -d ' ')
    TOTAL_SRC_LINES=$(find "$SRC_DIR" -name "*.js" -o -name "*.jsx" -o -name "*.css" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
    
    mkdir -p "$PROJECT_DIR/docs"
    
    cat > "$REPORT_FILE" << EOF
# 📊 QA Report — OléFUT RPG

> Gerado: ${TIMESTAMP}
> Protocolo: AKITA Bug Sweep

## Métricas

| Métrica | Valor |
|---|---|
| Arquivos de teste | ${TEST_FILES} |
| Total de testes | ${TEST_COUNT} |
| Componentes | ${COMPONENT_COUNT} |
| Linhas de engine | ${ENGINE_LINES} |
| Linhas totais src | ${TOTAL_SRC_LINES} |
| Bugs encontrados | ${BUGS_FOUND} |
| Warnings | ${WARNINGS_FOUND} |

## Checks Executados

1. ✅ Métodos UI vs Engine (missing methods)
2. ✅ Imports mortos
3. ✅ Null-safety em eventos
4. ✅ State resets entre fases
5. ✅ Mutação direta de state
6. ✅ Timer cleanup (memory leaks)
7. ✅ Speed ref pattern
8. ✅ Mobile responsiveness

## Resultado

$([ "$BUGS_FOUND" -eq 0 ] && echo "✅ **APROVADO** — Nenhum bug encontrado" || echo "❌ **REPROVADO** — ${BUGS_FOUND} bug(s) encontrado(s)")

## Comandos

\`\`\`bash
npm test              # testes unitários
npm run test:ci       # testes + build
./scripts/olefut-bug-sweep.sh        # sweep completo
./scripts/olefut-bug-sweep.sh scan   # só varredura
./scripts/olefut-bug-sweep.sh test   # só testes
./scripts/olefut-bug-sweep.sh ci     # testes + build
\`\`\`
EOF

    log_ok "Relatório salvo em docs/qa-report.md"
    log_info "Bugs: ${BUGS_FOUND} | Warnings: ${WARNINGS_FOUND} | Testes: ${TEST_COUNT}"
    
    if [ "$BUGS_FOUND" -eq 0 ]; then
        echo -e "\n${GREEN}  ✅ APROVADO — Zero bugs${NC}\n"
    else
        echo -e "\n${RED}  ❌ REPROVADO — ${BUGS_FOUND} bug(s)${NC}\n"
        exit 1
    fi
}

# ============================================================
# MAIN
# ============================================================
main() {
    echo -e "${CYAN}"
    echo "  ╔═══════════════════════════════════════╗"
    echo "  ║  🐛 OléFUT BUG SWEEP — AKITA QA     ║"
    echo "  ║  Varredura • Teste • Build • Report   ║"
    echo "  ╚═══════════════════════════════════════╝"
    echo -e "${NC}"
    
    local cmd="${1:-all}"
    
    case "$cmd" in
        scan)
            do_scan
            ;;
        test)
            do_test
            ;;
        build)
            do_build
            ;;
        ci)
            do_test
            do_build
            ;;
        report)
            do_scan
            do_report
            ;;
        all)
            do_scan
            do_test
            do_build
            do_report
            ;;
        *)
            echo "Uso: $0 {all|scan|test|build|ci|report}"
            exit 1
            ;;
    esac
}

main "$@"
