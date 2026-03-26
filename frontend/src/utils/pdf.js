import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportarPDF(resultados, termoBusca) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Cabeçalho
  doc.setFillColor(13, 27, 42)
  doc.rect(0, 0, 210, 30, 'F')

  doc.setTextColor(201, 168, 76)
  doc.setFontSize(8)
  doc.text('BUSCADOR DE JURISPRUDÊNCIAS', 14, 10)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.text(`Busca: "${termoBusca}"`, 14, 20)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} · ${resultados.length} resultado(s)`, 14, 27)

  // Tabela
  const linhas = resultados.map((j) => [
    j.tribunal,
    j.numero,
    j.relator !== '—' ? j.relator : '',
    j.dataJulgamento ? new Date(j.dataJulgamento).toLocaleDateString('pt-BR') : '—',
    j.ementa?.slice(0, 200) || '',
  ])

  autoTable(doc, {
    startY: 36,
    head: [['Tribunal', 'Processo', 'Relator', 'Data', 'Ementa']],
    body: linhas,
    headStyles: { fillColor: [13, 27, 42], textColor: [201, 168, 76], fontSize: 8 },
    bodyStyles: { fontSize: 7, textColor: [26, 26, 46] },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 28 },
      2: { cellWidth: 30 },
      3: { cellWidth: 18 },
      4: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [247, 244, 238] },
    margin: { left: 14, right: 14 },
  })

  doc.save(`jurisprudencias-${termoBusca.replace(/\s+/g, '-')}.pdf`)
}
