# SPEC-178: Inline style ESLint enforcement

## Problema

Mandamento Brutal #4: "Zero inline-style em código novo". Brutal audit detectou **1157 ocorrências** de `style={{...}}`. SPEC-170/172/173/175 cobriram views principais, mas não impedem código novo de regredir. LineageView (#128 SPEC-166) escapou com 57 inline antes do audit pegá-la.

## Solução

ESLint rule `no-restricted-syntax` com selector `JSXAttribute[name.name='style']` em level `warn`.

```js
'no-restricted-syntax': ['warn', {
  selector: "JSXAttribute[name.name='style']",
  message: 'Mandamento Brutal #4: inline style proibido...'
}]
```

### Por que warn (não error)?

Débito existente: 1157 ocorrências. Promover pra error quebraria CI. Como warn:
- Reviewer vê warnings novos no diff vs baseline
- CI permanece verde
- Path documentado pra promover quando débito < 200

### Exceção pattern

```jsx
/* eslint-disable-next-line no-restricted-syntax */
<div style={{ color: dynamicColor }} />
```

Para per-instance dynamic (color, animation, computed values).

## Follow-ups (SPEC-179+)

Sweep CSS classes pra UI primitives consumidos por muitas views:
- EfBanner, EfModal, EfInput, EfClubBadge (5-10 inline cada)
- App.jsx header (12 inline)

Volume top por view:
- DashboardView 155
- AutoPlayView 102
- MatchView 100
- PlayerDashboardView 90
- SquadView 89

Cada sweep documentado como SPEC separada.

## Harness

`tests/specs/SPEC-178-inline-style-enforcement.test.js`:
- Verify rule presente no eslint.config.js
- Verify selector pattern correto
- Verify level=warn
- Verify mensagem informativa
