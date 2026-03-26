const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function testar() {
  console.log('Testando API do STF sem token WAF...');
  try {
    const resp = await axios.post(
      'https://jurisprudencia.stf.jus.br/api/search/search',
      {
        query: {
          bool: {
            filter: [{
              query_string: {
                default_operator: 'AND',
                fields: ['ementa_texto.plural^5', 'titulo.plural^3'],
                query: 'dano moral',
                type: 'best_fields',
                analyzer: 'legal_search_analyzer',
                quote_analyzer: 'legal_index_analyzer',
              },
            }],
            must: [],
            should: [],
          },
        },
        post_filter: { bool: { must: [{ term: { base: 'acordaos' } }] } },
        from: 0,
        size: 3,
        sort: [{ julgamento_data: { order: 'desc' } }],
        track_total_hits: true,
        _source: ['id', 'titulo', 'ementa_texto', 'julgamento_data'],
      },
      {
        httpsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Referer': 'https://jurisprudencia.stf.jus.br/pages/search',
          'Origin': 'https://jurisprudencia.stf.jus.br',
        },
        validateStatus: null,
      }
    );

    console.log('Status HTTP:', resp.status);
    const total = resp.data?.result?.hits?.total?.value;
    const hits = resp.data?.result?.hits?.hits || [];
    console.log('Total resultados:', total);
    console.log('Hits retornados:', hits.length);
    if (hits.length > 0) {
      console.log('\nPrimeiro resultado:');
      console.log('Título:', hits[0]._source?.titulo);
      console.log('Data:', hits[0]._source?.julgamento_data);
      console.log('\n✅ FUNCIONA SEM TOKEN WAF!');
    } else {
      console.log('\n❌ Sem resultados — WAF pode estar bloqueando');
      console.log('Resposta raw:', JSON.stringify(resp.data).slice(0, 500));
    }
  } catch (e) {
    console.log('❌ Erro de rede:', e.message);
  }
}

testar();
