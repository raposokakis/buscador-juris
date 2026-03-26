export default function CardJuris({ juris }) {
  const data = juris.dataJulgamento
    ? new Date(juris.dataJulgamento).toLocaleDateString('pt-BR')
    : '—'

  const ementaResumida = juris.ementa?.length > 320
    ? juris.ementa.slice(0, 320) + '...'
    : juris.ementa

  return (
    <div className="bg-white border border-[#D6D0C4] rounded-xl p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-medium px-2 py-1 rounded border bg-blue-100 text-blue-800 border-blue-200">
            STF
          </span>
          {juris.classe && juris.classe !== '—' && (
            <span className="text-xs text-[#5A6478] bg-[#F7F4EE] px-2 py-1 rounded border border-[#D6D0C4]">
              {juris.classe}
            </span>
          )}
        </div>
        <span className="text-xs text-[#5A6478] whitespace-nowrap">{data}</span>
      </div>

      <p className="text-xs font-mono text-[#5A6478] mb-2">Nº {juris.numero}</p>

      <p className="text-sm text-[#1A1A2E] leading-relaxed mb-3">{ementaResumida}</p>

      {juris.relator && juris.relator !== '—' && (
        <p className="text-xs text-[#5A6478] mb-4">
          <span className="text-[#1A1A2E] font-medium">Relator:</span> {juris.relator}
        </p>
      )}

      {juris.link ? (
        <a
          href={juris.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-medium text-[#0D1B2A] border border-[#0D1B2A]/20 rounded-lg px-4 py-2 hover:bg-[#0D1B2A] hover:text-white transition"
        >
          Ver acórdão completo →
        </a>
      ) : (
        <span className="text-xs text-[#5A6478] italic">Link não disponível</span>
      )}
    </div>
  )
}
