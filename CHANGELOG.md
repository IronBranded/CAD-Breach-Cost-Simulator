# Changelog

## Model v2026.11 — calibration, ranges and decision features

Numbers change in this version; shared links made with v2026.10 still open, are migrated, and show a notice that the model has changed.

### Model fixes

- **Severity is relative to the organisation.** It is now the net exposure as a share of annual revenue, with the Canadian average breach cost shown as a secondary reference. A micro business losing several times its revenue was previously rated "Medium".
- **Downtime losses are tied to revenue.** Operations loss = revenue ÷ 365 × days of disruption × share of operations affected × industry revenue at risk × 1.25. It used to be a fixed amount per day per bracket that reached 1.8–4.7× the revenue a micro business would earn during the outage.
- **Public bodies use public-sector law.** New "Organisation type" input (pre-filled from the industry). Public bodies resolve to Quebec's public-sector act, Ontario FIPPA / MFIPPA, Alberta POPA, BC FIPPA or the federal Privacy Act, with notices describing their breach duties; no monetary penalty is modelled for them. Government and Education previously got PIPEDA.
- **Exact revenue and optional headcount** replace the four revenue brackets. Effort, counsel, remediation and ransom amounts are interpolated between size anchors, so an $11M and a $99M company no longer produce identical results.
- **Variable X is no longer plotted in dollars.** The old projection (revenue × 3–20% per year) dwarfed the known costs by up to 200× while the page called it unquantifiable. The timeline now shows an open-ended zone without a scale, and the brand card gives the value of 1% of revenue for scale.
- **Consistency:** one notification rate for every exposure scenario (the old $12–22 table applied only to double extortion); class-action **defence costs** added; Healthcare switches PHI on; the lifecycle box shows the modelled disruption next to the cited benchmark.

### Calibrated against sources

| Parameter | v2026.10 | v2026.11 | Source |
| :--- | :--- | :--- | :--- |
| Ransomware disruption | 21 days | 10 days at 70% of operations | Sophos 2025: 53% fully recovered within a week |
| Ransom at $50M revenue | $1.2M | $400K | Sophos 2025: median demand < US$350K for revenue ≤ US$250M |
| Settlement per affected person | $15 (+$30 PHI, +$10 finance) | $5 (+$5 PHI, +$15 finance), range down to LifeLabs | Desjardins ≈ $21, LifeLabs ≈ $1 per affected person |
| Lifecycle text | "Avg. 24 days", "241 days" (uncited) | Sophos 2025, IBM 2025 global | linked in the panel |
| Threat landscape | uncited ransom figure, FR/EN differed | NCTA 2025–26 key findings, IBM 2025 Canada, Sophos 2025 | linked |

17 external sources are now registered in the model, 12 of them linked. Parameters still tagged "Author estimate" are listed in amber in the assumptions panel.

### New features

- **Range of outcomes:** 5,000 simulated incidents per scenario (seeded, so a shared link reproduces the same range), P10 / P50 / P90 / P99 / mean and a loss exceedance curve. Fines and class actions are drawn as events.
- **Security posture:** security AI & automation, immutable backups, IR retainer, tested IR plan, encryption & data minimisation. A "What would reduce this" card ranks the saving of each and can apply or remove it in place.
- **Ransom decision** (pay / don't pay, interacting with backups) and **BEC fast reporting** (share of funds recovered).
- **Insurance terms:** current premium, ransomware sublimit, coinsurance, business-interruption waiting period, insurer panel rates.
- **Scenario comparison:** pin up to three scenarios and compare them side by side.
- **Methodology page** with formulas, calibration notes, every parameter and linked sources.
- **Open Graph tags and preview image** for link sharing.
- **Related scenarios** in the Microsoft Cloud Attack & Abuse Matrix for each incident type.

### Engineering

- `// @ts-check` with shared JSDoc types; `node scripts/typecheck.mjs` runs TypeScript with no build step.
- Cache busting without a build: `?v=<version>` on every asset and module import, stamped by `node scripts/release.mjs`, enforced by `validate.mjs`.
- Accessibility: axe-core reports no violations on the form, results (EN/FR) and methodology pages.
- Tests: golden point estimates and simulated ranges for 20 scenarios, plus invariants (operations loss never exceeds revenue earned during the outage, controls never increase cost, insurance never pushes net above gross, simulated event frequencies match the model).

## Model v2026.10 — modular rewrite

The single 1,668-line `index.html` is now a static site with no build step: markup, CSS, ES modules, `data/model.json` and EN/FR translation files. The calculation was extracted first and checked against the old page before any number changed: identical results for all 138,240 English input combinations.

### Calculation fixes (each is its own commit, with updated golden tests)

| Fix | Before | After (example) |
| :--- | :--- | :--- |
| Breach costs (notification, credit monitoring, privacy fines, class action) only apply when personal information is exposed | DDoS, QC, Large, "50k+": **$10.11M** | **$1.39M** |
| Ransomware without exfiltration no longer pays for notifying and monitoring every record | Ontario, Retail, Small: $1.41M | $1.03M |
| One count of affected individuals per records bucket (was different for notification vs settlement) | Data breach, BC, Tech, Mid, "50k+": $9.90M | $7.55M |
| Insurance: net exposure can no longer exceed gross when the loss is below the deductible or the deductible exceeds the limit; premium increase only after a paid claim | BEC $112K loss, $500K deductible: net **$536K** | net $112K |
| Industry multipliers live once in the model (French had Healthcare at 2.8 vs 3.0 in English) | FR and EN totals differed | identical |

### Display and content fixes

- Double-extortion surcharge was included in the total but never shown; every row that feeds a total is now listed, and each card shows its total.
- The 3-year premium increase moved from the Legal card (where it was not part of that card's total) to the insurance summary.
- Timeline "+ Variable X" label never appeared (a missing element threw an error on every render).
- The print report was half English in French, fired the print dialog twice, and printed before fonts loaded. It is now part of the page (`#printReport` + `print.css`), fully translated, and Ctrl/Cmd+P prints it too.
- Severity band, regime labels and chart labels are translated.
- PHIPA notice: $500,000 is the administrative-penalty cap; offence fines for organizations go up to $1,000,000.
- Loi 25 notice: the CAI and affected individuals must be notified *promptly* (avec diligence), not "immediately".
- French threat-intelligence alert now states the same figures as the English one; French churn text and disclaimer were missing a sentence.
- Ransom line is labelled "assumed paid"; BEC loss is labelled as a fraudulent transfer.

### Interface

- No language gate or scripted loading screens: the form loads immediately in the browser's language (`?lang=fr` / `?lang=en` override); EN/FR toggle in the top bar.
- Shareable scenarios: results update the URL fragment, and opening the link shows the same results. "Edit scenario" returns to the form with the values kept.
- Model assumptions & sources panel generated from `data/model.json`; parameters without an external citation are tagged "Author estimate".
- Accessibility: checkboxes are keyboard and screen-reader reachable, real `<form>` with Enter-to-submit, errors linked to fields with `aria-invalid`, legend lists amounts as well as percentages, `prefers-reduced-motion` respected, skip link, focus moves to the results.
- Self-hosted fonts and a Content Security Policy: the page makes no requests to other origins.
- Donut listeners no longer accumulate across runs and language switches.

### Tooling

- `node --test`: golden-scenario tests for the engine plus the validation script.
- `node scripts/validate.mjs`: EN/FR key and placeholder parity, model ↔ option ids, every model value has a known source, README cost table in sync (`--fix` regenerates it).
