# Upstream Paseo Skills Reference

This file summarizes which upstream Paseo skills are worth consulting from this self-hosted workspace. The canonical upstream skill files remain under `paseo-0.1.61/skills/`.

Do not copy these workflows into ordinary product work by default. Use them only when the task actually involves Paseo CLI/daemon agent coordination.

## Available Upstream Skills

- `paseo-0.1.61/skills/paseo/SKILL.md`: CLI reference for managing agents, loops, schedules, chat rooms, terminals, permissions, waits, and structured output.
- `paseo-0.1.61/skills/paseo-chat/SKILL.md`: persistent chat rooms for asynchronous multi-agent coordination.
- `paseo-0.1.61/skills/paseo-handoff/SKILL.md`: hand off the current task to a fresh agent with full context.
- `paseo-0.1.61/skills/paseo-loop/SKILL.md`: repeat worker/verifier cycles until a prompt or shell-check exit condition passes.
- `paseo-0.1.61/skills/paseo-committee/SKILL.md`: ask two high-reasoning agents for root-cause analysis and planning when stuck.
- `paseo-0.1.61/skills/paseo-orchestrate/SKILL.md`: full multi-agent implementation workflow with planning, implementation, review, QA, and cleanup.

## When To Use

- Use `paseo` when you need exact CLI syntax for `paseo run`, `paseo wait`, `paseo logs`, `paseo chat`, `paseo loop`, `paseo schedule`, or `paseo terminal`.
- Use `paseo-chat` when multiple agents need a shared room for status, blockers, handoffs, or review findings.
- Use `paseo-handoff` when the user wants another agent to take over or continue with a self-contained briefing.
- Use `paseo-loop` when the user asks to keep trying until tests pass, watch a condition, babysit CI, or repeat worker/verifier checks.
- Use `paseo-committee` when the current approach is stuck and the user wants fresh root-cause analysis before implementation.
- Use `paseo-orchestrate` only for large tasks where the user explicitly wants a team-of-agents workflow. It is heavy and should not replace straightforward local implementation.

## Self-Hosted Project Guardrails

- Do not let upstream orchestration rules override this repository's ownership boundaries: app work in `flutterpaseo`, backend/business/relay in `relay-service`, admin work in `relay-admin`, upstream compatibility in `paseo-0.1.61`.
- When an upstream skill says to use worktrees, agents, or CLI commands, first confirm the local Paseo CLI/daemon is available in the current environment.
- Do not restart the main Paseo daemon casually. It may be managing active coding agents.
- If using handoff/orchestration, include this workspace's self-hosted constraints in every agent prompt: preserve relay compatibility, keep business logic outside encrypted relay frames, avoid generated artifacts, and update `AGENTS.md`/skills when durable facts change.
- Prefer bounded reads and targeted checks. Broad upstream test suites are heavy; run specific files or surface-specific validations unless explicitly asked otherwise.

## Prompt Checklist For Paseo-Managed Agents

When launching a Paseo-managed agent for this workspace, include:

- The exact task and whether edits are allowed.
- Relevant files across `flutterpaseo`, `relay-service`, `relay-admin`, or `paseo-0.1.61`.
- Current state, decisions made, and what has already been tried.
- Acceptance criteria and validation commands.
- Boundaries: which directories may be changed, which generated or upstream files to avoid, and whether protocol compatibility is in scope.
- A reminder to update project context docs if the task changes durable architecture or workflow facts.
