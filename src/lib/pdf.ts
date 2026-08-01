/**
 * Carrega o gerador de PDF sob demanda.
 *
 * jspdf + jspdf-autotable somam ~440 KB. Importados no topo das telas, entravam
 * no pacote inicial e eram baixados por todo mundo — inclusive por quem nunca
 * exporta nada. Aqui eles são buscados só quando a pessoa clica em exportar.
 */
export async function carregarPdf() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  return { jsPDF, autoTable };
}

/** Tipo do documento com o campo que o autotable adiciona. */
export type DocPdf = import('jspdf').jsPDF & {
  lastAutoTable?: { finalY: number };
};
