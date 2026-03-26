import { useEffect, useState } from 'react'
import CardJuris from '../components/CardJuris.jsx'
import { exportarPDF } from '../utils/pdf.js'

export default function Resultados({ busca, onVoltar }) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    setDados(null)

    const params = new URLSearchParams({ q: busca.q, pagina })

    fetch(`/api/buscar?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.erro) throw new Error(data.erro)
        setDados(data)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [busca, pagina])

  const resultados = dados?.resultados || []
  const total = dados?.total || 0

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#0D1B2A] px-8 py-6 flex items-center gap-6">
        <button
          onClick={onVoltar}
          className="text-white/60 hover:text-white text-sm flex items-center gap-2 transition"
        >
          ← Voltar
        </button>
        <div className="flex-1">
          <p className="text-[#C9A84C] text-xs font-mono tracking-widest uppercase mb-1">Resultados da busca · STF</p>
          <h2 className="text-white font-serif text-2xl">"{busca.q}"</h2>
        </div>
        {resultados.length > 0 && (
          <button
            onClick={() => exportarPDF(resultados, busca.q)}
            className="text-[#C9A84C] border border-[#C9A84C]/40 rounded-lg px-4 py-2 text-sm hover:bg-[#C9A84C]/10 transition"
          >
            Exportar PDF
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Carregando */}
        {carregando && (
          <div className="flex flex-col items-center justify-center py-24 text-[#5A6478]">
            <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm">Consultando STF...</p>
          </div>
        )}

        {/* Erro */}
        {!carregando && erro && (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">⚠</p>
            <p className="text-[#1A1A2E] font-semibold mb-2">Erro na consulta</p>
            <p className="text-[#5A6478] text-sm">{erro}</p>
          </div>
        )}

        {/* Sem resultados */}
        {!carregando && !erro && resultados.length === 0 && (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-[#1A1A2E] font-semibold mb-2">Nenhuma jurisprudência encontrada</p>
            <p className="text-[#5A6478] text-sm">Tente outros termos de busca.</p>
          </div>
        )}

        {/* Resultados */}
        {!carregando && !erro && resultados.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-[#5A6478]">
                <span className="font-semibold text-[#1A1A2E]">{total.toLocaleString()}</span> resultados encontrados
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {resultados.map((juris) => (
                <CardJuris key={juris.id} juris={juris} />
              ))}
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-4 py-2 rounded-lg border border-[#D6D0C4] text-sm text-[#1A1A2E] hover:bg-white transition disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-[#5A6478]">Página {pagina}</span>
              <button
                onClick={() => setPagina((p) => p + 1)}
                disabled={resultados.length < 10}
                className="px-4 py-2 rounded-lg border border-[#D6D0C4] text-sm text-[#1A1A2E] hover:bg-white transition disabled:opacity-40"
              >
                Próxima →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
