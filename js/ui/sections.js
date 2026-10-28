// @ts-check
// Translates an engine result into labelled cost sections.
// Shared by the dashboard and the print report so both always list the same rows,
// and every row that feeds a total is shown.
import { t } from '../i18n.js?v=2026.11.0';

/** @param {any} r engine result */
export function costSections(r) {
  const inc = r.inputs.incident;
  const L = r.legal;
  const rows = key => t(`cards.rows.${key}`);
  const isPublic = r.inputs.sector === 'public';

  const legalRows = [{ label: rows('counsel'), value: L.counsel }];
  if (r.dataExposed) {
    if (L.fines > 0) legalRows.push({ label: rows('fines'), value: L.fines });
    if (L.settlement > 0) legalRows.push({ label: rows('settlement'), value: L.settlement, tag: 'risk' });
    if (L.defence > 0) legalRows.push({ label: rows('defence'), value: L.defence, tag: 'risk' });
    legalRows.push({ label: rows('notification'), value: L.notification });
    if (L.doubleExtortionSurcharge > 0) {
      legalRows.push({ label: rows('doubleExtortionSurcharge'), value: L.doubleExtortionSurcharge, tag: 'dx' });
    }
    legalRows.push(r.inputs.phi
      ? { label: rows('creditPhi'), value: L.credit, tag: 'phi' }
      : { label: rows('credit'), value: L.credit });
  }
  const legalNotes = [];
  if (!r.dataExposed) legalNotes.push(t('cards.noExposure'));
  else if (isPublic) legalNotes.push(t('cards.noFinePublic'));

  const bizRows = [
    { label: rows('operations'), value: r.business.operations },
    { label: rows('remediation'), value: r.business.remediation },
  ];
  if (r.business.extortion > 0) bizRows.push({ label: t(`cards.rows.extortion.${inc}`), value: r.business.extortion });
  const bizNotes = [];
  if (r.ransomUnpaid) bizNotes.push(t('cards.ransomNotPaid'));
  if (r.inputs.fraudReportedFast && r.business.extortion > 0) bizNotes.push(t('cards.fraudRecovered'));

  return [
    {
      key: 'tech', title: t('cards.tech'), total: r.tech.total, notes: [],
      rows: [
        { label: rows('ir'), value: r.tech.ir },
        { label: rows('forensics'), value: r.tech.forensics },
        { label: rows('it'), value: r.tech.it },
      ],
    },
    {
      key: 'legal', title: t('cards.legal'), total: L.total,
      notice: t(`regimes.notices.${L.regime}`),
      notes: legalNotes,
      rows: legalRows,
    },
    { key: 'biz', title: t('cards.biz'), total: r.business.total, notes: bizNotes, rows: bizRows },
  ];
}

/** @param {any} r */
export function shares(r) {
  const g = r.grossTotal || 1;
  return { tech: r.tech.total / g, legal: r.legal.total / g, biz: r.business.total / g };
}

export function optionLabel(group, id) {
  return id ? t(`options.${group}.${id}`) : '—';
}

/** @param {any} inputs */
export function enabledControls(inputs) {
  return Object.entries(inputs.controls || {}).filter(([, on]) => on).map(([id]) => id);
}
