# Test Report Detail Monitor Redesign

Date: 2026-03-25
Status: Proposed and user-validated
Scope: `apps/web-antdv-next/src/plugins/api_testing/views/testreport/detail.vue`

## Goal

Refactor the test report detail page into a more effective diagnostics view that feels like a professional monitoring console instead of a form-style detail page.

The redesign must improve two things at the same time:

- Visual hierarchy: important execution signals should be readable in one scan.
- Debug workflow: users should reach failed steps, request data, response data, and assertion outcomes faster.

## Non-goals

- No backend API changes.
- No new report generation format.
- No unrelated refactor of the report list page.
- No attempt to normalize or redesign server-side report payloads.

## Current problems

The existing page has these issues:

- Summary data is present, but hierarchy is weak. The page does not strongly prioritize overall result, failure count, or time cost.
- The "basic information" section reads like a flat form instead of an execution dashboard.
- Execution steps are rendered as repeated blocks with poor scanability.
- Failed steps do not stand out enough.
- Request, response, and assertion content are stacked in a way that makes long reports tiring to inspect.
- Long JSON payloads can dominate the page and reduce usability.

## Chosen direction

Use a hybrid monitoring-console layout:

- Top section: strong execution summary and report status.
- Bottom section: step timeline plus expandable diagnostic cards.

This keeps the overview readable while making step-level debugging faster.

## Information architecture

The page will be reorganized into four sections.

### 1. Top action bar

Purpose: anchor the page and expose high-frequency actions.

Content:

- Back button
- Report name
- Overall execution status badge
- Secondary summary line with:
  - test case name
  - start time
  - end time
  - total duration
- Refresh action
- Export report action

### 2. Monitoring summary area

Purpose: provide a one-screen overview of report health.

Layout:

- First row: four summary cards
  - execution result
  - success rate
  - total steps and failed steps
  - total duration
- Second row: a wider execution health panel
  - success vs failure ratio
  - compact supporting counts

Design intent:

- This is the main visual entry point.
- Failure count and success rate must be immediately legible.
- The styling should remain restrained and operational, not decorative.

### 3. Report metadata panel

Purpose: expose context without reading like a data form.

Content candidates:

- report id
- report name
- test case name
- execution result
- start time
- end time
- execution window
- total steps
- success steps
- failed steps
- failure ratio

Rendering rules:

- Use compact stat rows or grouped info blocks.
- Keep this panel secondary to the summary area.
- Avoid large empty spacing and avoid label-heavy form styling.

### 4. Step execution area

Purpose: support detailed analysis of step-level results.

Structure:

- A vertical step timeline or stacked status list
- Each step rendered as a stateful card
- Card header shows:
  - step name
  - success or failure status
  - duration
  - HTTP status code if available

Expanded content is split into logical sections:

- Overview
- Request
- Response
- Assertions
- Error summary when available

## Interaction design

### Default expansion behavior

- Failed steps are expanded by default.
- Successful steps are collapsed by default.

Reasoning:

- The user usually opens the report to inspect problems first.
- The page should spend attention budget on failures, not routine success rows.

### Step card interactions

- Clicking a step header toggles expand/collapse.
- The header must contain enough information for fast scanning without expanding.
- Status styling must make failed steps visibly different while remaining restrained.

### Batch controls

Add lightweight controls above the step list:

- Expand all
- Show failed steps only / expand failed steps only

These controls improve usability for long reports without adding complex state management.

### Section rendering rules

- Do not render empty shells for missing data.
- If request or response details are absent, omit that section entirely.
- If assertion data exists, show pass/fail results clearly before any raw payload.
- If an error message or failure summary exists, place it near the top of the expanded area.

### Long content handling

For request bodies, response bodies, and headers:

- render inside bounded code containers
- cap visible height
- allow internal scroll
- preserve formatting for JSON and text payloads

This prevents one long block from dominating the whole report.

### Empty states

If there are no execution steps:

- show a distinct empty state
- explain that the report exists but has no step detail to display

Do not use a generic table-style "no data" presentation.

## Visual language

The approved visual direction is "professional monitoring console".

Principles:

- Neutral or slightly cool base tones
- Limited, functional use of status colors
- Strong spacing and grouping instead of decorative effects
- Clear emphasis on state and metrics
- Low-noise typography with compact operational density

Status color intent:

- success: restrained green
- failure: restrained alert red
- neutral metadata: gray / slate tones
- avoid bright or playful color treatment

The page should feel analytical and reliable, not marketing-oriented.

## Component boundaries

Implementation may stay in one Vue file initially, but the internal structure should follow these boundaries:

- `SummaryCard`
- `ExecutionHealthPanel`
- `MetaPanel`
- `StepTimeline`
- `StepCard`
- `StepDetailSection`

This is a logical decomposition requirement even if extraction happens incrementally.

## Data handling and compatibility

The redesign must work against the existing `getTestReportDetailApi` response only.

Expected variability:

- `details.steps` may be absent
- `assertions` may be absent
- `response.headers` may be absent
- `response.json` may be absent
- `response.text` may be absent
- some step timing or request fields may be partial

Requirements:

- The page must degrade cleanly.
- Missing fields must not create broken sections or placeholder noise.
- Where multiple field shapes exist, prefer the most structured source first and fall back safely.

## Accessibility and responsiveness

The redesign should remain usable on both desktop and smaller widths.

Requirements:

- top summary cards should wrap cleanly
- long labels should truncate or wrap without breaking layout
- code blocks should scroll horizontally/vertically as needed
- interactive headers should preserve clear click targets

## Testing and verification

Implementation verification must include:

- typecheck for `@vben/web-antdv-next`
- manual validation of:
  - successful report
  - failed report
  - report with no step details
  - report with long request or response payloads

Manual review checklist:

- Can the user identify the overall result within one glance?
- Can the user find failed steps without scrolling through noise?
- Are request and response details readable without overwhelming the page?
- Does the layout still hold when optional fields are missing?

## Implementation notes

Likely local changes:

- `apps/web-antdv-next/src/plugins/api_testing/views/testreport/detail.vue`

Optional supporting extraction if the file becomes too large:

- `apps/web-antdv-next/src/plugins/api_testing/views/testreport/components/*`

## Decision summary

Approved design decisions:

- Use a hybrid summary + step-analysis layout
- Target a professional monitoring-console tone
- Upgrade interaction as part of the redesign
- Default-expand failed steps
- Add step-level grouping for overview, request, response, assertions, and error context
