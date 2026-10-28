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

* **Incident Scenarios:** Ransomware (with or without double extortion), BEC, Data Exfiltration, Insider Threat and DDoS.
* **Data exposure:** notification, credit monitoring, privacy fines and class-action reserves only apply when personal information is actually exposed (always for data breaches and insiders, for ransomware only with exfiltration, for BEC only when mailbox data was accessed, never for DDoS).
* **Jurisdictional Intelligence:** Built-in logic for Quebec (Loi 25), Ontario (PHIPA), Alberta and BC (PIPA), and Federal (PIPEDA/OSFI B-13) frameworks.
* **Class Action Risk:** Models "Settlement Reserves" based on Canadian precedents for the Tort of Intrusion upon Seclusion.
* **Operational Loss:** Real-world downtime estimates and revenue contraction metrics based on 2025-2026 benchmarks.

---

### Logic & The Formula Approach

The simulation logic is informed by a combination of industry-standard reports (IBM, Sophos, CCCS) and current Canadian legal fee schedules and uses a weighted impact matrix to calculate Gross Exposure, then applies insurance parameters to determine Net Exposure (Loss):

$$
\text{Gross} = (\text{Technical Response}) + (\text{Legal / Regulatory / Settlements}) + (\text{Business Operational Impact})
$$

$$
\text{Covered} = \max\big(0,\ \min(\text{Gross},\ \text{Limit}) - \text{Deductible}\big)
$$

$$
\text{Net Exposure} = \text{Gross} - \text{Covered} + \text{Premium Increase}
$$

Regulatory fines and settlements are expected values (amount × probability). Variable X (brand & reputation) is shown separately and never added to the total.

### Cost Vectors

<!-- model-table:start -->
_Generated from `data/model.json` (model v2026.10) by `node scripts/validate.mjs --fix`. The in-app “Model assumptions & sources” panel lists every parameter._

| Vector | Rate / Logic |
| :--- | :--- |
| **Incident Response** | $375/hr |
| **Digital Forensics** | $430/hr (0.45 forensic hours per IR hour) |
| **IT Recovery & Hardening** | $175/hr (2 IT hours per IR hour) |
| **Breach Counsel** | $700/hr |
| **Notification** | $12 per individual; with double extortion $12 / $12 / $18 / $22 by bucket, plus a 50% surcharge |
| **Credit & ID Monitoring** | $35 per individual ($65 with PHI) |
| **Class-Action Reserve** | $15 per individual (+$30 PHI, +$10 finance) × probability |
| **Individuals per bucket** | Low 800 · Medium 5,000 · High 30,000 · Critical 100,000 |
<!-- model-table:end -->

### Insurance Logic & Parameters

The tool allows the input of specific policy parameters to model a realistic recovery scenario:
* **Coverage Limit:** The maximum aggregate amount the insurer will pay. The deductible sits inside the limit.
* **Deductible (Retention):** The out-of-pocket amount the organization must pay before insurance triggers.
* **Premium Increase:** Models 3 years of increased premiums following a paid claim.

---

## Data Privacy

This tool is built as a static, client-side web page.

* **Local Execution:** All drill-down logic and financial calculations occur exclusively within the user's browser.
* **No Transmission:** No information is transmitted to external servers, databases, or APIs. Fonts are self-hosted, and a Content Security Policy blocks requests to other origins.
* **No Tracking:** No cookies, local storage or tracking. A shared scenario lives in the URL fragment (`#…`), which browsers never send to the server.
* **Bilingual (EN/FR):** Supporting both English and French-Canadian regulatory terminology.

---

## Project Structure

No build step: GitHub Pages serves the files as they are.

```
index.html               page markup only (text is keyed for translation)
css/                     tokens · base · form · dashboard · timeline · assumptions · print
js/main.js               entry point: loads data, wires the UI, syncs the URL
js/engine/               pure calculation: calculate(inputs, model) → result (no DOM)
js/ui/                   form, dashboard, donut, timeline chart, severity, assumptions, print
data/model.json          every rate, multiplier and bucket, each tagged with its sources
i18n/en.json, fr.json    all user-facing text
assets/fonts/            self-hosted IBM Plex + Syne (SIL OFL)
tests/                   golden-scenario tests for the engine
scripts/validate.mjs     data / translation / README consistency checks
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
node --test                         # engine golden tests
node scripts/validate.mjs           # EN/FR parity, model sources and ids, README table
node scripts/validate.mjs --fix     # regenerate the README cost table after editing the model
node tests/update-golden.mjs        # only when a change to the numbers is intended
```

See [CHANGELOG.md](CHANGELOG.md) for what changed in the modular rewrite.

---

### Author
**(IronBranded)**
