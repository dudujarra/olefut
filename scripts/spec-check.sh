#!/bin/bash
# spec-check.sh — Global SDD Enforcement
# Funciona em QUALQUER projeto. Detecta specs/ automaticamente.
#
# Uso:
#   spec-check.sh "descrição do trabalho"
#   spec-check.sh --type code "fix auth bug"
#   spec-check.sh --list
#   spec-check.sh --create "nome" --type code
#   spec-check.sh --init          # inicializa SDD num projeto novo
#
# Exit codes:
#   0 = spec encontrada e completa
#   1 = spec NÃO encontrada (BLOQUEIA)
#   2 = spec incompleta (BLOQUEIA)

set -e

# Detectar diretório de specs do projeto atual
find_specs_dir() {
    local dir="$(pwd)"
    while [ "$dir" != "/" ]; do
        if [ -d "$dir/specs" ]; then
            echo "$dir/specs"
            return 0
        fi
        # Check for .git to know we're at project root
        if [ -d "$dir/.git" ] && [ ! -d "$dir/specs" ]; then
            echo "$dir/specs"
            return 1  # Project found but no specs/ dir
        fi
        dir="$(dirname "$dir")"
    done
    echo ""
    return 1
}

# Globals
SDD_GLOBAL="$HOME/Documents/sdd-global"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# --- Init: bootstrap SDD into current project ---
init_sdd() {
    local project_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
    local specs_dir="$project_root/specs"

    if [ -d "$specs_dir" ] && [ -f "$specs_dir/SPEC-RULES.md" ]; then
        echo -e "${YELLOW}⚠ SDD já inicializado neste projeto: $specs_dir${NC}"
        return 0
    fi

    echo -e "${BLUE}Inicializando SDD em: $project_root${NC}"

    mkdir -p "$specs_dir/generators" "$specs_dir/api" "$specs_dir/pipeline"

    # Copy SPEC-RULES.md
    if [ -f "$SDD_GLOBAL/SPEC-RULES.md" ]; then
        cp "$SDD_GLOBAL/SPEC-RULES.md" "$specs_dir/SPEC-RULES.md"
    else
        cat > "$specs_dir/SPEC-RULES.md" << 'RULES'
# SPEC-RULES.md — Spec-Driven Development

**Regra absoluta**: Nada é feito sem spec escrita e aprovada.

## Ciclo universal

```
SPEC → BUILD → VALIDATE → DEPLOY
```

## Formato mínimo

```markdown
# Spec: [nome]
## O que é
## Input
## Output esperado
## Regras de validação
## Forbidden
```

## Geradores

| Tipo | Arquivo |
|------|---------|
| Código | `specs/generators/code.md` |
| Pesquisa | `specs/generators/research.md` |
| Pipeline | `specs/generators/pipeline.md` |

## Enforcement

Antes de qualquer trabalho:
```bash
spec-check.sh "descrição do trabalho"
```
RULES
    fi

    # Copy generators
    for gen in code.md research.md pipeline.md; do
        if [ -f "$SDD_GLOBAL/generators/$gen" ]; then
            cp "$SDD_GLOBAL/generators/$gen" "$specs_dir/generators/$gen"
        fi
    done

    echo -e "${GREEN}✓ SDD inicializado em: $specs_dir${NC}"
    echo -e "  - SPEC-RULES.md criado"
    echo -e "  - generators/ copiados"
    echo -e ""
    echo -e "  Próximo passo: adicionar SDD como fundamento no arquivo de regras do projeto"
    echo -e "  (CLAUDE.md, GEMINI.md, etc.)"
    return 0
}

# --- List ---
list_specs() {
    local specs_dir
    specs_dir=$(find_specs_dir 2>/dev/null) || true

    if [ -z "$specs_dir" ] || [ ! -d "$specs_dir" ]; then
        echo -e "${RED}❌ Nenhum diretório specs/ encontrado neste projeto.${NC}"
        echo -e "  Rodar: spec-check.sh --init"
        return 1
    fi

    echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  SPECS — $(basename "$(dirname "$specs_dir")")${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
    echo ""

    local count=0
    while IFS= read -r spec; do
        if [[ "$spec" == *"SPEC-TEMPLATE"* ]] || [[ "$spec" == *"SPEC-RULES"* ]] || [[ "$spec" == *"generators/"* ]]; then
            continue
        fi
        local name=$(head -5 "$spec" | grep "^# Spec:" | sed 's/^# Spec: //')
        if [ -z "$name" ]; then
            name=$(basename "$spec" .md)
        fi
        local relpath="${spec#$specs_dir/}"

        # Check completion
        if check_spec_complete "$spec" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $relpath — $name"
        else
            echo -e "  ${YELLOW}⚠${NC} $relpath — $name ${YELLOW}(incompleta)${NC}"
        fi
        count=$((count + 1))
    done < <(find "$specs_dir" -name "*.md" -not -name "SPEC-RULES.md" -not -name "SPEC-TEMPLATE.md" -not -path "*/generators/*" 2>/dev/null | sort)

    echo ""
    echo -e "  Total: ${count} specs"
    return 0
}

# --- Search ---
search_spec() {
    local query="$1"
    local specs_dir="$2"
    local query_lower=$(echo "$query" | tr '[:upper:]' '[:lower:]')

    # Split query into individual words for multi-keyword matching
    local words=()
    for word in $query_lower; do
        # Skip very short words
        if [ ${#word} -ge 3 ]; then
            words+=("$word")
        fi
    done

    local best_match=""
    local best_score=0

    while IFS= read -r spec; do
        if [[ "$spec" == *"SPEC-TEMPLATE"* ]] || [[ "$spec" == *"SPEC-RULES"* ]] || [[ "$spec" == *"generators/"* ]]; then
            continue
        fi

        local content_lower=$(cat "$spec" | tr '[:upper:]' '[:lower:]')
        local filename_lower=$(basename "$spec" .md | tr '[:upper:]' '[:lower:]' | tr '-' ' ')
        local searchable="$content_lower $filename_lower"
        local score=0

        # Score by matching words (content + filename)
        for word in "${words[@]}"; do
            if echo "$searchable" | grep -q "$word"; then
                score=$((score + 1))
            fi
        done

        # Also try the full query as exact phrase
        if echo "$searchable" | grep -q "$query_lower"; then
            score=$((score + 10))
        fi

        if [ $score -gt $best_score ]; then
            best_score=$score
            best_match="$spec"
        fi
    done < <(find "$specs_dir" -name "*.md" 2>/dev/null | sort)

    # Require at least 1 word match
    if [ $best_score -ge 1 ]; then
        echo "$best_match"
    fi
}

# --- Check completeness ---
check_spec_complete() {
    local spec_file="$1"
    local missing=""

    grep -q "## O que é\|## What it is" "$spec_file" 2>/dev/null || missing="$missing O-que-é"
    grep -q "## Input" "$spec_file" 2>/dev/null || missing="$missing Input"
    grep -q "## Output\|## Expected output\|## Output esperado" "$spec_file" 2>/dev/null || missing="$missing Output"
    grep -q "## Regras de validação\|## Validation" "$spec_file" 2>/dev/null || missing="$missing Validação"
    grep -q "## Forbidden" "$spec_file" 2>/dev/null || missing="$missing Forbidden"

    # Check for unfilled placeholders
    if grep -q "(descrever\|1-2 frases\|o que entra\|o que sai\|como verificar\|o que NÃO)" "$spec_file" 2>/dev/null; then
        missing="$missing PLACEHOLDER-NÃO-PREENCHIDO"
    fi

    if [ -n "$missing" ]; then
        echo "$missing"
        return 1
    fi
    return 0
}

# --- Suggest generator ---
suggest_generator() {
    local work_type="$1"
    local specs_dir="$2"
    case "$work_type" in
        code|feature|bug|fix|refactor|script) echo "$specs_dir/generators/code.md" ;;
        research|pesquisa|dr|analysis|análise) echo "$specs_dir/generators/research.md" ;;
        pipeline|ingest*|migrat*|export|generat*) echo "$specs_dir/generators/pipeline.md" ;;
        decision|decisão|decisao|architecture|escolha) echo "$specs_dir/generators/decision.md" ;;
        vtx|cluster|lexicon) echo "$specs_dir/generators/SPEC-TEMPLATE.md" ;;
        *) echo "" ;;
    esac
}

# --- Create spec ---
create_spec() {
    local name="$1"
    local work_type="${2:-code}"
    local specs_dir="$3"
    local slug=$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')

    local target_dir="$specs_dir"
    case "$work_type" in
        vtx|cluster) target_dir="$specs_dir/vtx" ;;
        api|route) target_dir="$specs_dir/api" ;;
        pipeline) target_dir="$specs_dir/pipeline" ;;
        research) target_dir="$specs_dir/research" ;;
    esac

    mkdir -p "$target_dir"
    local target_file="$target_dir/$slug.md"

    if [ -f "$target_file" ]; then
        echo -e "${YELLOW}⚠ Spec já existe: $target_file${NC}"
        return 0
    fi

    cat > "$target_file" << TEMPLATE
# Spec: $name

## O que é
(descrever em 1-2 frases)

## Input
(o que entra — tipo, formato, origem)

## Output esperado
(o que sai — tipo, formato, exemplo concreto)

## Regras de validação
- [ ] (como verificar que o output está correto)

## Forbidden
- (o que NÃO pode acontecer)
TEMPLATE

    echo -e "${GREEN}✓ Spec criada: $target_file${NC}"
    local gen=$(suggest_generator "$work_type" "$specs_dir")
    if [ -n "$gen" ] && [ -f "$gen" ]; then
        echo -e "  Gerador: $gen"
    fi
    return 0
}

# --- Main ---
TYPE=""
ACTION=""
QUERY=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --type|-t) TYPE="$2"; shift 2 ;;
        --list|-l) ACTION="list"; shift ;;
        --create|-c) ACTION="create"; shift ;;
        --init|-i) ACTION="init"; shift ;;
        *) QUERY="$1"; shift ;;
    esac
done

# Init
if [ "$ACTION" = "init" ]; then
    init_sdd
    exit 0
fi

# Find specs dir
SPECS_DIR=$(find_specs_dir 2>/dev/null) || true

if [ -z "$SPECS_DIR" ] || [ ! -d "$SPECS_DIR" ]; then
    if [ "$ACTION" = "list" ] || [ "$ACTION" = "create" ] || [ -n "$QUERY" ]; then
        echo -e "${RED}╔══════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ❌ SDD NÃO INICIALIZADO NESTE PROJETO           ║${NC}"
        echo -e "${RED}╚══════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "  Nenhum diretório specs/ encontrado."
        echo -e "  ${BLUE}Inicializar: spec-check.sh --init${NC}"
        exit 1
    fi
fi

# List
if [ "$ACTION" = "list" ]; then
    list_specs
    exit 0
fi

# Create
if [ "$ACTION" = "create" ]; then
    if [ -z "$QUERY" ]; then
        echo -e "${RED}❌ Nome da spec obrigatório.${NC}"
        exit 1
    fi
    create_spec "$QUERY" "$TYPE" "$SPECS_DIR"
    exit 0
fi

# Search
if [ -z "$QUERY" ]; then
    echo -e "${RED}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ BLOQUEADO: Descrição do trabalho obrigatória ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Uso: spec-check.sh \"descrição do trabalho\""
    exit 1
fi

echo -e "${BLUE}🔍 Buscando spec para: \"$QUERY\"${NC}"

FOUND=$(search_spec "$QUERY" "$SPECS_DIR")

if [ -n "$FOUND" ]; then
    MISSING=$(check_spec_complete "$FOUND" 2>&1) || true

    if [ -z "$MISSING" ]; then
        echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✓ SPEC ENCONTRADA E COMPLETA                   ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "  Arquivo: ${FOUND#$SPECS_DIR/}"
        echo -e "  ${GREEN}→ TRABALHO LIBERADO. Seguir a spec.${NC}"
        exit 0
    else
        echo -e "${YELLOW}╔══════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║  ⚠ SPEC ENCONTRADA MAS INCOMPLETA               ║${NC}"
        echo -e "${YELLOW}╚══════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "  Arquivo: ${FOUND#$SPECS_DIR/}"
        echo -e "  Faltando:${RED}$MISSING${NC}"
        echo -e "  ${YELLOW}→ COMPLETAR SPEC ANTES DE TRABALHAR.${NC}"
        exit 2
    fi
else
    GENERATOR=$(suggest_generator "$TYPE" "$SPECS_DIR")

    echo -e "${RED}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ BLOQUEADO: SPEC NÃO ENCONTRADA               ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Trabalho: \"$QUERY\""
    echo -e "  ${RED}→ PROIBIDO iniciar sem spec.${NC}"
    echo ""
    echo -e "  ${BLUE}Próximos passos:${NC}"
    echo -e "  1. Criar: spec-check.sh --create \"$QUERY\" --type ${TYPE:-code}"
    if [ -n "$GENERATOR" ] && [ -f "$GENERATOR" ]; then
        echo -e "  2. Gerador: $GENERATOR"
    fi
    echo -e "  3. Preencher spec"
    echo -e "  4. Aprovação do Dudu"
    echo -e "  5. spec-check.sh novamente"
    exit 1
fi
