# Changelog

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
