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

* **Incident Scenarios:** Ransomware (Double Extortion), BEC, Data Exfiltration, and Supply Chain Compromise.
* **Jurisdictional Intelligence:** Built-in logic for Quebec (Loi 25), Ontario (PHIPA), and Federal (PIPEDA/OSFI) frameworks.
* **Class Action Risk:** Models "Settlement Reserves" based on Canadian precedents for the Tort of Intrusion upon Seclusion.
* **Operational Loss:** Real-world downtime estimates and revenue contraction metrics based on 2025-2026 benchmarks.

---

### Logic & The Formula Approach

The simulation logic is informed by a combination of industry-standard reports (IBM, Sophos, CCCS) and current Canadian legal fee schedules and also uses a weighted impact matrix to calculate Gross Exposure, then applies insurance parameters to determine Net Exposure (Loss):



$$
\text{Total Cost} = (\text{Technical Response}) + (\text{Legal / Regulatory / Settlements}) + (\text{Business Operational Impact})
$$

$$
Net Exposure=(Gross Cost−Insurance Coverage)+Deductible+Premium Load
$$
#

### Cost Vectors

| Vector | Rate / Logic |
| :--- | :--- |
| **Technical IR** | Incident Response rates at **$325/hr**. |
| **Digital Forensics** |	Deep-dive forensic analysis, Threat Hunting and evidence handling at **$380/hr**. |
| **Legal Counsel** |	Breach Coach, Legal & Privacy Counsel rates at **$600/hr**. |
| **Notification** |	Blended Canadian logistics (Postal/Email) at **$12/record**.
| **Monitoring** |	Credit & Identity monitoring (Standard/PHI-enhanced) at **$35–$65/individuals** |.


### Insurance Logic & Parameters

The tool allows the input of specific policy parameters to model a realistic recovery scenario:
* **Coverage Limit:** The maximum aggregate amount the insurer will pay.
* **Deductible (Retention):** The out-of-pocket amount the organization must pay before insurance triggers.
* **Premium Hike:** Models the 3-year tail insurance policy of increased premiums following a major claim.


---

## Data Privacy

This tool is built as a static, client-side web page.

* **Local Execution:** All drill-down logic and financial calculations occur exclusively within the user's browser.
* **No Transmission:** No information is transmitted to external servers, databases, or APIs.
* **No Tracking:** No cookies or persistent tracking mechanisms are utilized.
* **Bilingual (EN/FR):** Supporting both English and French-Canadian regulatory terminology.

---

### Author
**(IronBranded)**
