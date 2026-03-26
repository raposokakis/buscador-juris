import { useState } from 'react'

export default function Home({ onPesquisar }) {
  const [q, setQ] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (q.trim().length < 2) return
    onPesquisar(q.trim())
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-[#0D1B2A] px-8 py-16 flex flex-col items-center text-center">
        <p className="text-[#C9A84C] text-xs tracking-widest uppercase font-mono mb-4">
          Buscador de Jurisprudências
        </p>
        <h1 className="font-serif text-white text-5xl mb-3 leading-tight">
          Decisões judiciais<br />
          <em className="text-[#E8C97A]">em segundos</em>
        </h1>
        <p className="text-white/50 text-base font-light max-w-md mt-2">
          Busque jurisprudências do STF por palavras-chave.
        </p>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-start justify-center px-4 pt-12">
        <div className="w-full max-w-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Ex: "dano moral" ou "habeas corpus"'
              className="w-full border border-[#D6D0C4] rounded-xl px-5 py-4 text-[#1A1A2E] bg-white text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent placeholder:text-[#5A6478]/60"
            />
            <button
              type="submit"
              disabled={q.trim().length < 2}
              className="bg-[#0D1B2A] text-white rounded-xl py-4 font-medium text-sm tracking-wide hover:bg-[#1A2E42] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Buscar no STF
            </button>
          </form>

          <p className="text-center text-xs text-[#5A6478] mt-6">
            Dados via API pública · Supremo Tribunal Federal
          </p>
        </div>
      </div>
    </div>
  )
}
