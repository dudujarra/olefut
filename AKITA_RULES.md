# MODO AKITA - Constituição do Projeto Elifoot

> **⚠️ AVISO PARA A INTELIGÊNCIA ARTIFICIAL:** 
> Antes de executar qualquer alteração neste repositório, você **deve** ativar o Modo Akita. 
> O descumprimento destas regras caracteriza "Vibe Coding" e é estritamente proibido.

## 1. Zero Vibe Coding
Não adivinhe o estado do projeto nem empurre código genérico para "ver se funciona". Se você não entender perfeitamente o fluxo de dados, a arquitetura e os efeitos colaterais de uma função, **NÃO ESCREVA CÓDIGO**. Pare, pesquise, use ferramentas de mock e tenha certeza matemática da sua alteração.

## 2. Isolamento Estrito da Engine (Separation of Concerns)
O Motor de Simulação (`src/engine/`) e a Interface Visual (`React`) são dimensões paralelas. 
- O código do `Engine` **não** pode ter chamadas para o DOM, não pode ter dependências de `useState` ou `useEffect`.
- A Interface Visual **não** pode possuir lógica matemática de jogo ou cálculo de tabelas. Ela existe única e exclusivamente para **ler** os dados da Engine e desenhá-los.

## 3. Testabilidade Sem Tela
Toda mecânica nova de jogo (mercado, lesões, copas, transferências) deve ser construída de tal forma que possa ser completamente simulada, do começo ao fim da temporada, rodando apenas no terminal do Node.js (ex: `npx tsx src/engine/simulate_season.js`), **sem abrir o navegador**.

## 4. Estrutura Orientada a Objetos (OOP) Limpa
O uso desenfreado de Arrays soltos é proibido na lógica do Motor. Entidades complexas (como Ligas e Copas Nacionais) devem ser instâncias de classes abstratas (ex: `Tournament`) para garantir polimorfismo e simplificar o "Main Loop" de orquestração temporal do calendário.

## 5. Padronização Estrutural de Dados
Para evitar que o motor de torneios crashe ao sortear times ímpares ou montar chaves defeituosas:
- A quantia de Ligas Nacionais pode ser flexível.
- A quantidade de times por Divisão dentro de qualquer país **nunca pode ser menor que 10**. Se houver menos times disponíveis, crie times artificiais para fechar o número. Sempre priorize quantias pares.

## 6. Build Validation Obrigatória
Nenhuma sessão de trabalho pode ser considerada "completa" sem rodar `npx vite build` e confirmar **0 erros**. Se o build quebrar, o agente deve parar tudo e corrigir antes de prosseguir. Entregar código que não compila é proibido.

## 7. SDD (Software Design Document) Vivo
Toda mecânica nova deve ser registrada no SDD com:
- Nome da mecânica
- Arquivo e método onde foi implementada
- Status (✅ / ⚠️ / ❌)
- Riscos e débitos técnicos identificados

O SDD é o contrato de verdade do projeto. Se não está no SDD, não existe.

---

*Assinado: O Arquiteto (Modo Akita Ativado).*
