# Breach-Cost-Simulator (CAD)

> **Visualizing the financial gravity of a compromise through a Canadian lens.**

[🟢 **LAUNCH THE SIMULATOR** 🟢](#) 
*((https://ironbranded.github.io/CAD-Breach-Cost-Simulator/)*

---

### ⚠️ DISCLAIMER
> *This simulator is a financial modeling tool intended for **educational and risk-awareness purposes only!***
>
> Estimated figures are based on **2025-2026 Canadian industry benchmarks**. Actual incident costs may significantly vary based on insurance coverage, technical response speed, data type, and service rates.

---

## Executive Overview

In the current threat landscape, a "breach" is more than just downtime; it is a multi-level financial event. As an IR Analyst, I developed this simulator to help organizations visualize the hidden costs of a compromise.

### Key Calculation Vectors

* **Incident Scenarios:** Ransomware (Double Extortion), BEC, Data Leaks, and Insider Threats.
* **Industry Multipliers:** Specialized weighting for High-Risk sectors (Healthcare, Finance, Energy).
* **Regulatory Impact:** Built-in logic for Law 25 (Quebec) fine risks and PIPEDA-compliant notification costs.
* **Operational Loss:** Real-world downtime estimates based on 2025 Canadian benchmarks.

---

## Logic

The simulation logic is informed by a combination of industry-standard reports (IBM, Sophos, Coveware, CSE).

### The Formula Approach

The simulator uses a weighted impact matrix:

$$
\text{Total Cost} = (\text{Tech Response}) + (\text{Legal / Regulatory}) + (\text{Business Impact})
$$

### Cost Vectors

| Vector | Rate / Logic |
| :--- | :--- |
| **Technical IR** | Calculated at a standard Canadian IR rate of **$300/hr**. |
| **Legal Counsel** | Privacy Coach / Breach Counsel rates at **$500/hr**. |
| **Fraud / Extortion** | Scaled based on annual revenue brackets and data volume. |

---

## Data Privacy

This tool is built as a static, client-side web page.

* 🔒 **Local Execution:** All drill-down logic and financial calculations occur exclusively within the user's browser.
* 🚫 **No Transmission:** No information is transmitted to external servers, databases, or APIs.
* 🍪 **No Tracking:** No cookies or persistent tracking mechanisms are utilized.

---

### Author
**M.Decayette (IronBranded)**
