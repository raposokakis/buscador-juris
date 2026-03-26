import { useState } from 'react'
import Home from './pages/Home.jsx'
import Resultados from './pages/Resultados.jsx'

export default function App() {
  const [pagina, setPagina] = useState('home')
  const [busca, setBusca] = useState({ q: '' })

  function pesquisar(q) {
    setBusca({ q })
    setPagina('resultados')
  }

  function voltar() {
    setPagina('home')
  }

  return (
    <>
      {pagina === 'home' && <Home onPesquisar={pesquisar} />}
      {pagina === 'resultados' && <Resultados busca={busca} onVoltar={voltar} />}
    </>
  )
}
