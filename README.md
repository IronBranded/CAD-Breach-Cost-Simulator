# (CAD) Breach-Cost-Simulator

> **Visualizing the financial and operational gravity of a cyber incident through a Canadian lens.**

<h3 align="center">
  <a href="https://ironbranded.github.io/CAD-Breach-Cost-Simulator/" target="_blank" rel="noopener noreferrer">
    🟢 LAUNCH THE SIMULATOR 🟢
  </a>
</h3>

---

### ⚠️ DISCLAIMER
> *This simulator is a financial modeling tool intended for **educational and risk-awareness purposes only!***
>
> Estimated figures are based on **2025-2026 Canadian industry benchmarks**.
> Please note that actual incident costs can vary significantly depending on factors including, but not limited to, insurance coverage, regulatory fines, response time, the nature of the affected data, and applicable service rates.
---

## Executive Overview

In the current threat landscape, a "breach" is more than just downtime; it is a multi-level financial event.

> **Why this tool?**
> As a Tactical DFIR Hunter in training, I came to realize that DFIR is not just about the "bits and bytes", it's also about understanding the potential business impact. This tool helps bridge the gap between technical and executive risk management.

### Key Calculation Vectors

* **Incident Scenarios:** Ransomware (paid or not, with or without double extortion), BEC (with or without fast bank reporting), Data Exfiltration, Insider Threat and DDoS.
* **Organisation size:** exact annual revenue and, optionally, headcount. Response effort, remediation and ransom amounts scale smoothly between size anchors.
* **Data exposure:** notification, credit monitoring, privacy fines and class-action costs only apply when personal information is actually exposed (always for data breaches and insiders, for ransomware only with exfiltration, for BEC only when mailbox data was accessed, never for DDoS).
* **Jurisdictional Intelligence:** private-sector logic for Quebec (Loi 25), Ontario (PHIPA), Alberta and BC (PIPA) and federal entities (PIPEDA / OSFI B-13); public bodies are assessed under public-sector law (Quebec's public-sector act, Ontario FIPPA / MFIPPA, Alberta POPA, BC FIPPA, the federal Privacy Act).
* **Class Action Risk:** settlement reserves and defence costs, calibrated against the Desjardins (2022) and LifeLabs (2023) settlements.
* **Operational Loss:** tied to revenue — days of disruption × share of operations affected × industry revenue at risk. Ransomware disruption is calibrated to Sophos 2025.
* **Security posture:** five controls (security AI & automation, immutable backups, IR retainer, tested IR plan, encryption & minimisation) with the saving of each shown in the results.
* **Range of outcomes:** 5,000 simulated incidents per scenario give P10 / P50 / P90 / P99 and a loss exceedance curve, alongside the point estimate.
* **Insurance:** limit, deductible, current premium, ransomware sublimit, coinsurance, business-interruption waiting period and insurer panel rates.
* **Investigate it:** each incident links to matching scenarios in the [Microsoft Cloud Attack & Abuse Matrix](https://ironbranded.github.io/Microsoft-CAA-matrix/) (forensic artifacts, KQL, IR runbooks).

---

### Logic & The Formula Approach

The simulation logic is informed by industry reports (IBM, Sophos, CCCS), Canadian settlements and current Canadian legal fee schedules. It calculates Gross Exposure, then applies insurance parameters to determine Net Exposure (Loss). The full method, every parameter and its source are on the [methodology page](https://ironbranded.github.io/CAD-Breach-Cost-Simulator/methodology.html).

$$
\text{Gross} = (\text{Technical Response}) + (\text{Legal / Regulatory / Settlements}) + (\text{Business Operational Impact})
$$

$$
\text{Covered} = \max\big(0,\ \min(\text{Gross} - \text{BI waiting period},\ \text{Limit or ransomware sublimit}) - \text{Deductible}\big) \times (1 - \text{Coinsurance})
$$

$$
\text{Net Exposure} = \text{Gross} - \text{Covered} + \text{Premium Increase}
$$

The headline is a **point estimate**: most likely value of every driver, with fines and class actions counted as expected values (amount × probability). The **simulated range** draws every driver at random and treats each fine or class action as an event that happens or not. **Severity** compares the net exposure with annual revenue. Variable X (brand & reputation) is described but deliberately not given a dollar value.

### Cost Vectors

<!-- model-table:start -->
_Generated from `data/model.json` (model v2026.11) by `node scripts/validate.mjs --fix`. The in-app “Model assumptions & sources” panel lists every parameter._

| Vector | Rate / Logic |
| :--- | :--- |
| **Incident Response** | $375/hr |
| **Digital Forensics** | $430/hr (0.45 forensic hours per IR hour) |
| **IT Recovery & Hardening** | $175/hr (2 IT hours per IR hour) |
| **Breach Counsel** | $700/hr |
| **Notification** | $12 per individual; +50% surcharge for double extortion |
| **Credit & ID Monitoring** | $35 per individual ($65 with PHI) |
| **Class-Action Reserve** | $5 per individual (+$5 PHI, +$15 finance) × probability, plus defence costs ($150,000 / $300,000 / $600,000 by bucket) × probability |
| **Individuals per bucket** | Low 800 · Medium 5,000 · High 30,000 · Critical 100,000 |
| **Operations Disruption** | Revenue ÷ 365 × days × share of operations affected × industry revenue at risk × 1.25 |
| **Ransomware** | 10 days at 70% of operations; ransom $40,000 / $150,000 / $400,000 / $1,400,000 at the size anchors |
| **Simulation** | 5,000 runs per scenario; fines and class actions drawn as events |
<!-- model-table:end -->

### Insurance Logic & Parameters

The tool allows the input of specific policy parameters to model a realistic recovery scenario:
* **Coverage Limit:** The maximum aggregate amount the insurer will pay. The deductible sits inside the limit.
* **Deductible (Retention):** The out-of-pocket amount the organization must pay before insurance triggers.
* **Current Premium (optional):** Used for the post-claim increase; otherwise 3% of the limit is assumed.
* **Premium Increase:** Models 3 years of increased premiums following a paid claim.
* **Advanced terms:** ransomware sublimit, ransomware coinsurance and the business-interruption waiting period (12 hours by default). Panel rates for IR, forensics and counsel apply automatically when a policy is in place.

---

## Data Privacy

This tool is built as a static, client-side web page.

* **Local Execution:** All drill-down logic and financial calculations occur exclusively within the user's browser.
* **No Transmission:** No information is transmitted to external servers, databases, or APIs. Fonts are self-hosted, and a Content Security Policy blocks requests to other origins.
* **No Tracking:** No cookies, local storage or tracking. A shared scenario lives in the URL fragment (`#…`), which browsers never send to the server. Links record the model version and warn when the model has changed since they were shared.
* **Bilingual (EN/FR):** Supporting both English and French-Canadian regulatory terminology.

---

## Project Structure

No build step: GitHub Pages serves the files as they are.

```
index.html               simulator markup (text is keyed for translation)
methodology.html         formulas, calibration notes, every parameter and source
css/                     tokens · base · form · dashboard · timeline · insights · assumptions · print
js/main.js               entry point: loads data, wires the UI, syncs the URL
js/engine/               pure calculation, no DOM:
                           calculate.js  (inputs, model[, draw]) → result
                           simulate.js   Monte Carlo range, seeded per scenario
                           savings.js    what each control / the ransom decision changes
                           scale.js, controls.js, technical.js, legal.js, business.js, insurance.js, projection.js
js/ui/                   form, dashboard, insights (range, savings, comparison, related), donut,
                         timeline chart, severity, assumptions, print
js/types.js              JSDoc types shared by the engine and UI
data/model.json          every rate, multiplier and bucket, each tagged with its sources
data/related.json        links to the Microsoft Cloud Attack & Abuse Matrix
i18n/en.json, fr.json    all user-facing text
assets/                  self-hosted fonts (SIL OFL), favicon, Open Graph image
tests/                   golden scenarios (point estimate + simulated range) and invariants
scripts/                 validate.mjs · release.mjs · typecheck.mjs · og-image.html
```

**To change a number,** edit `data/model.json`; the page, the print report and the in-app assumptions panel all read from it.
**To change wording,** edit `i18n/en.json` and `i18n/fr.json` (keep the same keys in both).

## Run Locally

The page loads its JSON with `fetch`, which browsers block for `file://`, so serve the folder:

```
python -m http.server 8000
```

Then open http://localhost:8000.

## Checks (Node 20+, no dependencies)

```
node --test                         # engine golden tests + invariants + validate.mjs
node scripts/validate.mjs           # EN/FR parity, model structure, sources, README table, asset versions
node scripts/validate.mjs --fix     # regenerate the README cost table after editing the model
node scripts/typecheck.mjs          # TypeScript over the JSDoc types (downloads TypeScript via npx)
node tests/update-golden.mjs        # only when a change to the numbers is intended
npx @axe-core/cli http://localhost:8000   # accessibility audit (needs Chrome)
```

## Releasing a Change

GitHub Pages caches files for about 10 minutes. Every CSS/JS URL and module import carries `?v=<version>` so a visitor never mixes old and new files. When you change any CSS or JS, bump the version before pushing:

```
node scripts/release.mjs 2026.11.1
```

`validate.mjs` fails if a file was missed. Model changes are versioned separately in `data/model.json` (`version`), which shared links record.

See [CHANGELOG.md](CHANGELOG.md) for what changed in each version.

---

### Author
**(IronBranded)**
