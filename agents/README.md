# Domain Agents V1

## Purpose
- provide a minimum executable skeleton for the initial five domain agents
- keep each domain agent independently runnable against normalized Phase 2 output

## Run
```bash
node agents/run_domain_agent.mjs macroeconomy
node agents/run_domain_agent.mjs policy_politics
node agents/run_domain_agent.mjs geopolitics_security
node agents/run_domain_agent.mjs supply_chain_trade
node agents/run_domain_agent.mjs cyber_information

node agents/run_all_domain_agents.mjs
node agents/evaluate_domain_agents.mjs
```

## Outputs
- `foundation/evaluation/agents/*-agent-output.json`
- `foundation/evaluation/metrics/phase3-domain-agent-smoke.md`
- `foundation/evaluation/metrics/phase3-domain-agent-smoke.json`
- `foundation/evaluation/metrics/phase3-domain-agent-eval.md`
- `foundation/evaluation/metrics/phase3-domain-agent-eval.json`

## Current Scope
- deterministic heuristic prediction/hypothesis/evidence generation
- contract versioning + common output schema(`phase3-domain-agent-output/v1`)
- minimum 3 evidence records per domain
- domain-specific input filtering with fallback trace
- regression/evaluation runner for schema, thresholds, horizon invariants
- intended as Phase 3 bootstrap before specialforce session/AAR adapters and meta agents
