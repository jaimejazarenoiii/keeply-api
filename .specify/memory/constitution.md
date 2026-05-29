<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Placeholder principles -> I. Code Quality Is Non-Negotiable
- Placeholder principles -> II. Tests Define Expected Behavior
- Placeholder principles -> III. User Experience Stays Consistent
- Placeholder principles -> IV. Performance Is A Requirement
- Placeholder principles -> V. Linting And Formatting Are Quality Gates
Added sections:
- Engineering Standards
- Development Workflow
Removed sections:
- Placeholder-only template sections
Templates requiring updates:
- .specify/templates/plan-template.md: updated
- .specify/templates/spec-template.md: updated
- .specify/templates/tasks-template.md: updated
Follow-up TODOs: none
-->

# Keeply API Constitution

## Core Principles

### I. Code Quality Is Non-Negotiable

Code MUST be clean, readable, and locally consistent with the surrounding
implementation. Prefer clear names, small modules, and simple control flow over
clever abstractions. Long lines or large blocks MUST be decoupled into smaller
expressions, helpers, or data structures when readability suffers.

All source changes MUST use two-space indentation unless a language-specific
formatter in the repository requires otherwise. New abstractions are allowed
only when they reduce real complexity, remove meaningful duplication, or match
an established project pattern.

### II. Tests Define Expected Behavior

Every behavioral change MUST include tests that prove the intended outcome and
cover important failure paths. Unit tests are required for isolated logic;
integration or contract tests are required when behavior crosses module,
service, database, or API boundaries.

Tests MUST be deterministic, readable, and scoped to user-observable behavior.
If a change cannot reasonably be automated, the plan MUST document the reason
and include a repeatable manual verification path.

### III. User Experience Stays Consistent

User-facing behavior MUST remain consistent across API responses, validation
messages, errors, naming, and workflows. New features MUST follow established
response shapes, status semantics, and interaction patterns unless the spec
explicitly justifies a change.

Specs MUST describe the user journey, edge cases, and acceptance criteria in
plain language before implementation begins. Any change that affects existing
users MUST preserve compatibility or document the migration path.

### IV. Performance Is A Requirement

Performance expectations MUST be stated for user-facing and system-facing
features before implementation. Plans MUST identify latency, throughput,
resource, or data-volume constraints relevant to the feature.

Implementations MUST avoid avoidable N+1 queries, unbounded reads, unnecessary
network calls, and repeated expensive work. Performance-sensitive changes MUST
include measurement, benchmark, or load-test evidence appropriate to the risk.

### V. Linting And Formatting Are Quality Gates

Linting and formatting MUST run as much as the repository tooling allows before
work is considered complete. New code MUST not introduce lint, type, format, or
diagnostic errors. If tooling cannot run, the final handoff MUST state why and
list any manual checks performed.

Automated fixes are preferred when they are narrow and predictable. Broad
formatting churn MUST be avoided unless the task is explicitly about formatting
or the repository already enforces it.

## Engineering Standards

Source code MUST use two-space indentation where project tooling permits it.
Lines SHOULD stay under 100 characters; when they grow longer, split arguments,
extract named values, or decouple logic into focused helpers.

Public interfaces MUST have stable, intentional names and predictable error
behavior. Data access and network operations MUST be bounded by clear filters,
pagination, limits, or documented constraints.

## Development Workflow

Plans MUST pass the Constitution Check before design work proceeds and again
after design is complete. The check MUST cover code quality, test coverage, UX
consistency, performance requirements, indentation, line length, and linting.

Tasks MUST include explicit verification work for tests, linting, formatting,
and performance where relevant. Reviews MUST block changes that violate this
constitution unless the plan documents a justified exception and simpler
alternatives considered.

## Governance

This constitution supersedes conflicting local practices for Spec Kit planning
and implementation. Amendments require an update to this file, a Sync Impact
Report, and review of dependent templates so future plans remain aligned.

Versioning follows semantic versioning. MAJOR changes remove or redefine core
principles, MINOR changes add principles or materially expand requirements, and
PATCH changes clarify wording without changing obligations.

All feature plans, tasks, and reviews MUST verify constitution compliance.
Exceptions MUST be explicit, temporary, and tied to a documented follow-up.

**Version**: 1.0.0 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
