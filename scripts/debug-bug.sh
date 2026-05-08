#!/usr/bin/env bash
# ============================================================
# debug-bug.sh — Workflow Debug Akita Completo
#
# Mandamento Akita #6:
#   Bug = ticket + fix + regression test (3 artefatos pareados)
#
# WORKFLOW:
#   1. SEARCH  — busca bug (grep, logs, sweep estático)
#   2. TICKET  — cria GitHub Issue + atualiza BUGS.md
#   3. FIX     — gera branch + edit + commit
#   4. TEST    — gera regressão + valida
#   5. AUTO    — testes série automático (CI ready)
#
# USO:
#   ./scripts/debug-bug.sh search <termo>      # procura bug
#   ./scripts/debug-bug.sh ticket "<title>"    # cria issue
#   ./scripts/debug-bug.sh fix <BUG-XXX>       # branch fix
#   ./scripts/debug-bug.sh test <BUG-XXX>      # gera teste
#   ./scripts/debug-bug.sh full "<title>"      # workflow completo
#   ./scripts/debug-bug.sh series              # roda tests série
#   ./scripts/debug-bug.sh watch               # tests watch
# ============================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUGS_FILE="$PROJECT_DIR/BUGS.md"
TESTS_DIR="$PROJECT_DIR/tests"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

cmd="${1:-help}"
shift || true

# ========== 1. SEARCH ==========
search_bug() {
    local term="${1:-}"
    if [ -z "$term" ]; then
        echo -e "${RED}❌ Usage: debug-bug.sh search <term>${NC}"
        exit 1
    fi
    echo -e "${CYAN}🔍 Searching: $term${NC}"

    echo -e "\n${BLUE}1. Source files matching:${NC}"
    grep -rn "$term" "$PROJECT_DIR/src" --include="*.js" --include="*.jsx" 2>/dev/null | head -20 || echo "  (none)"

    echo -e "\n${BLUE}2. Tests files matching:${NC}"
    grep -rn "$term" "$PROJECT_DIR/tests" --include="*.js" 2>/dev/null | head -10 || echo "  (none)"

    echo -e "\n${BLUE}3. Specs matching:${NC}"
    grep -rln "$term" "$PROJECT_DIR/specs" 2>/dev/null | head -5 || echo "  (none)"

    echo -e "\n${BLUE}4. Recent commits:${NC}"
    git log --oneline --grep="$term" 2>/dev/null | head -5 || echo "  (none)"

    echo -e "\n${BLUE}5. Open issues GitHub:${NC}"
    gh issue list --search "$term" --limit 5 2>/dev/null || echo "  (gh not configured)"

    echo -e "\n${GREEN}✅ Search complete${NC}"
}

# ========== 2. TICKET ==========
create_ticket() {
    local title="${1:-}"
    if [ -z "$title" ]; then
        echo -e "${RED}❌ Usage: debug-bug.sh ticket \"<title>\"${NC}"
        exit 1
    fi

    # Próximo BUG-XXX (force base 10 para evitar octal em 008+)
    local next_num
    next_num=$(grep -oE "BUG-[0-9]+" "$BUGS_FILE" 2>/dev/null | sort -V | tail -1 | grep -oE "[0-9]+" || echo "0")
    next_num=$((10#$next_num + 1))
    local bug_id
    bug_id=$(printf "BUG-%03d" "$next_num")

    echo -e "${CYAN}🎫 Creating $bug_id: $title${NC}"

    # 1. GitHub Issue
    local issue_url=""
    if command -v gh &>/dev/null; then
        issue_url=$(gh issue create \
            --title "$bug_id: $title" \
            --body "$(cat <<EOF
## Repro mínimo
TODO: passos para reproduzir

## Expected
TODO: comportamento esperado

## Actual
TODO: comportamento observado

## Files affected
TODO: caminhos

## Acceptance criteria
- [ ] Fix branch criado: \`bug/$bug_id\`
- [ ] Regression test em \`tests/regression/$bug_id.test.js\`
- [ ] PR linkado a esta issue
- [ ] CI verde antes de merge
EOF
)" \
            --label "bug" 2>/dev/null || echo "")
        echo -e "${GREEN}✓ Issue: $issue_url${NC}"
    else
        echo -e "${YELLOW}⚠ gh CLI não configurado, skipping issue${NC}"
    fi

    # 2. Append BUGS.md
    cat >> "$BUGS_FILE" <<EOF

---

### $bug_id ⏳ ABERTO — $title
- **Issue:** $issue_url
- **Branch:** \`bug/$bug_id\`
- **Fix:** TODO
- **Teste:** \`tests/regression/$bug_id.test.js\`
- **Status:** OPEN ($(date +%Y-%m-%d))

EOF

    echo -e "${GREEN}✓ $bug_id criado em BUGS.md${NC}"
    echo -e "${CYAN}Next: ./scripts/debug-bug.sh fix $bug_id${NC}"
}

# ========== 3. FIX ==========
create_fix_branch() {
    local bug_id="${1:-}"
    if [ -z "$bug_id" ]; then
        echo -e "${RED}❌ Usage: debug-bug.sh fix <BUG-XXX>${NC}"
        exit 1
    fi
    local branch="bug/$bug_id"
    echo -e "${CYAN}🔧 Creating fix branch: $branch${NC}"

    # Pull main, criar branch
    git checkout main 2>/dev/null || true
    git pull origin main 2>/dev/null || true
    git checkout -b "$branch" 2>/dev/null || git checkout "$branch"

    echo -e "${GREEN}✓ Branch: $branch${NC}"
    echo -e "${CYAN}Now: edit files, then run:${NC}"
    echo -e "  ./scripts/debug-bug.sh test $bug_id"
}

# ========== 4. TEST (regression) ==========
generate_test() {
    local bug_id="${1:-}"
    if [ -z "$bug_id" ]; then
        echo -e "${RED}❌ Usage: debug-bug.sh test <BUG-XXX>${NC}"
        exit 1
    fi

    mkdir -p "$TESTS_DIR/regression"
    local test_file="$TESTS_DIR/regression/$bug_id.test.js"

    if [ -f "$test_file" ]; then
        echo -e "${YELLOW}⚠ Test exists: $test_file${NC}"
    else
        cat > "$test_file" <<EOF
// Regression test for $bug_id
// Generated: $(date +%Y-%m-%d)
// Issue: see BUGS.md
import { describe, test, expect } from 'vitest';

describe('$bug_id regression', () => {
    test('bug does not regress', () => {
        // TODO: arrange — preparar estado que reproduzia bug
        // TODO: act — executar ação que falhava
        // TODO: assert — confirmar comportamento corrigido
        expect(true).toBe(true);
    });
});
EOF
        echo -e "${GREEN}✓ Generated: $test_file${NC}"
    fi

    # Roda teste
    echo -e "\n${CYAN}Running regression suite...${NC}"
    npx vitest run "tests/regression" 2>&1 | tail -10
}

# ========== 5. AUTO (série) ==========
test_series() {
    echo -e "${CYAN}🔁 Running tests in series...${NC}"
    local files
    files=$(find "$TESTS_DIR" -name "*.test.js" | sort)
    local total=0
    local passed=0
    local failed=0
    local failed_files=()

    for f in $files; do
        total=$((total + 1))
        local rel="${f#$PROJECT_DIR/}"
        printf "${BLUE}[%2d] %-60s${NC} " "$total" "$rel"
        if npx vitest run "$f" --reporter=dot >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
            passed=$((passed + 1))
        else
            echo -e "${RED}✗${NC}"
            failed=$((failed + 1))
            failed_files+=("$rel")
        fi
    done

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "Total:  $total"
    echo -e "${GREEN}Passed: $passed${NC}"
    echo -e "${RED}Failed: $failed${NC}"
    if [ $failed -gt 0 ]; then
        echo -e "\n${RED}Failed files:${NC}"
        for f in "${failed_files[@]}"; do
            echo "  - $f"
        done
        exit 1
    fi
    exit 0
}

# ========== WATCH ==========
test_watch() {
    echo -e "${CYAN}👀 Watching tests (Ctrl+C to stop)${NC}"
    npx vitest
}

# ========== FULL workflow ==========
full_workflow() {
    local title="${1:-}"
    if [ -z "$title" ]; then
        echo -e "${RED}❌ Usage: debug-bug.sh full \"<title>\"${NC}"
        exit 1
    fi
    echo -e "${CYAN}🚀 Full workflow starting...${NC}\n"

    # Step 1
    echo -e "${BLUE}STEP 1/4: Searching for related code${NC}"
    search_bug "$title" || true

    # Step 2
    echo -e "\n${BLUE}STEP 2/4: Creating ticket${NC}"
    create_ticket "$title"
    local bug_id
    bug_id=$(grep -oE "BUG-[0-9]+" "$BUGS_FILE" | sort -V | tail -1)

    # Step 3
    echo -e "\n${BLUE}STEP 3/4: Creating fix branch${NC}"
    create_fix_branch "$bug_id"

    # Step 4
    echo -e "\n${BLUE}STEP 4/4: Generating regression test${NC}"
    generate_test "$bug_id"

    echo -e "\n${GREEN}✅ Workflow complete for $bug_id${NC}"
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "  1. Edit code to fix bug"
    echo -e "  2. Edit tests/regression/$bug_id.test.js"
    echo -e "  3. ./scripts/debug-bug.sh series  (roda tudo)"
    echo -e "  4. git commit + gh pr create"
}

# ========== HELP ==========
show_help() {
    cat <<EOF
${CYAN}debug-bug.sh — Akita Bug Workflow${NC}

Commands:
  ${GREEN}search <term>${NC}    Procura bug em source/tests/specs/commits/issues
  ${GREEN}ticket "title"${NC}   Cria GitHub Issue + entry em BUGS.md
  ${GREEN}fix <BUG-XXX>${NC}    Cria branch bug/BUG-XXX
  ${GREEN}test <BUG-XXX>${NC}   Gera tests/regression/BUG-XXX.test.js + roda
  ${GREEN}full "title"${NC}     Workflow completo (search→ticket→fix→test)
  ${GREEN}series${NC}           Roda tests em série (1 por arquivo)
  ${GREEN}watch${NC}            Tests watch mode

Examples:
  ./scripts/debug-bug.sh search "MatchEngine"
  ./scripts/debug-bug.sh ticket "Crash quando salário < 0"
  ./scripts/debug-bug.sh full "Lesão duplica weeks"
  ./scripts/debug-bug.sh series
EOF
}

# ========== Dispatch ==========
case "$cmd" in
    search)  search_bug "$@" ;;
    ticket)  create_ticket "$@" ;;
    fix)     create_fix_branch "$@" ;;
    test)    generate_test "$@" ;;
    full)    full_workflow "$@" ;;
    series)  test_series ;;
    watch)   test_watch ;;
    help|*)  show_help ;;
esac
