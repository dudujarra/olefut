#!/bin/bash
#
# Pre-commit hook — Validador de formato AKITA
#
# Valida que commits seguem formato: AKITA-XXX: Descrição
# Bloqueia commits que não seguem o padrão.
#
# Instalação:
#   cp .claude/scripts/pre-commit-hooks.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Pega mensagem do commit (do arquivo temporário que git cria)
if [ -f .git/COMMIT_EDITMSG ]; then
  COMMIT_MSG=$(cat .git/COMMIT_EDITMSG)
else
  # Fallback: último arg é a mensagem (pra scripts que usam `git commit -m "..."`)
  COMMIT_MSG="${@: -1}"
fi

# Padrão esperado: AKITA-XXX: Descrição
AKITA_PATTERN="^AKITA-[0-9]{3,4}:"

# Valida
if ! [[ "$COMMIT_MSG" =~ $AKITA_PATTERN ]]; then
  echo ""
  echo -e "${RED}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ COMMIT REJEITADO: Formato AKITA obrigatório    ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "Mensagem recebida: ${YELLOW}${COMMIT_MSG}${NC}"
  echo ""
  echo "Formato esperado:"
  echo -e "  ${GREEN}AKITA-XXX: Descrição${NC}"
  echo ""
  echo "Exemplos válidos:"
  echo -e "  ${GREEN}AKITA-001: SPEC-001 Match Engine Simulation${NC}"
  echo -e "  ${GREEN}AKITA-021: SPEC-002 Match Events Deck${NC}"
  echo -e "  ${GREEN}AKITA-100: Bug fix — player salary calculation${NC}"
  echo ""
  echo "Amende o commit com:"
  echo "  git commit --amend -m \"AKITA-XXX: Nova descrição\""
  echo ""
  exit 1
fi

# ✅ Validação passou
echo -e "${GREEN}✅ Commit format OK: ${COMMIT_MSG:0:50}...${NC}"
exit 0
