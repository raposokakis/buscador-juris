require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// Token WAF do STF — obtido uma vez na inicialização
let wafToken = null;
let wafExpiry = 0;

async function obterWafToken() {
  console.log('[STF] Obtendo token WAF...');

  let launchOptions;
  if (IS_PROD) {
    const chromium = require('@sparticuz/chromium');
    launchOptions = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  } else {
    launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.goto('https://jurisprudencia.stf.jus.br/pages/search', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await new Promise(r => setTimeout(r, 5000));
    const cookies = await page.cookies();
    const token = cookies.find(c => c.name === 'aws-waf-token');
    if (token) {
      wafToken = token.value;
      wafExpiry = Date.now() + 6 * 60 * 60 * 1000; // válido 6h
      console.log('[STF] Token WAF obtido com sucesso.');
    } else {
      console.warn('[STF] Token WAF não encontrado nos cookies.');
    }
  } finally {
    await browser.close();
  }
}

async function garantirToken() {
  if (!wafToken || Date.now() > wafExpiry) {
    await obterWafToken();
  }
}

async function buscarSTF(q, pagina = 1) {
  await garantirToken();

  const from = (pagina - 1) * 10;

  const body = {
    query: {
      function_score: {
        functions: [
          { exp: { julgamento_data: { origin: 'now', scale: '47450d', offset: '1095d', decay: 0.1 } } },
          { filter: { term: { 'orgao_julgador.keyword': 'Tribunal Pleno' } }, weight: 1.15 },
          { filter: { term: { is_repercussao_geral: true } }, weight: 1.1 },
        ],
        query: {
          bool: {
            filter: [{
              query_string: {
                default_operator: 'AND',
                fields: [
                  'ementa_texto.plural^5',
                  'titulo.plural^3',
                  'documental_tese_texto.plural^2',
                  'documental_indexacao_texto.plural',
                ],
                query: q,
                type: 'best_fields',
                analyzer: 'legal_search_analyzer',
                quote_analyzer: 'legal_index_analyzer',
              },
            }],
            must: [],
            should: [],
          },
        },
      },
    },
    post_filter: {
      bool: {
        must: [{ term: { base: 'acordaos' } }],
        should: [],
      },
    },
    from,
    size: 10,
    sort: [{ julgamento_data: { order: 'desc' } }],
    track_total_hits: true,
    _source: [
      'id', 'titulo', 'ementa_texto', 'julgamento_data', 'publicacao_data',
      'relator_processo_nome', 'ministro_facet', 'processo_classe_processual_unificada_extenso',
      'processo_numero', 'inteiro_teor_url', 'pesquisa_url',
    ],
  };

  let resp;
  try {
    resp = await axios.post('https://jurisprudencia.stf.jus.br/api/search/search', body, {
      httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Referer': 'https://jurisprudencia.stf.jus.br/pages/search',
        'Origin': 'https://jurisprudencia.stf.jus.br',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'Cookie': `aws-waf-token=${wafToken}`,
      },
      validateStatus: null,
    });
  } catch (e) {
    throw new Error(`Falha de rede: ${e.message}`);
  }

  if (resp.status === 202 || resp.status === 403) {
    console.log('[STF] Token expirado, renovando...');
    wafToken = null;
    await garantirToken();
    return buscarSTF(q, pagina);
  }

  if (resp.status !== 200) {
    throw new Error(`STF retornou HTTP ${resp.status}`);
  }

  const hits = resp.data?.result?.hits?.hits || [];
  const total = resp.data?.result?.hits?.total?.value || 0;

  const resultados = hits.map((h, i) => {
    const s = h._source || {};
    return {
      id: s.id || h._id || String(i),
      tribunal: 'STF',
      numero: s.titulo || s.processo_numero || '—',
      classe: s.processo_classe_processual_unificada_extenso || '—',
      ementa: s.ementa_texto || 'Ementa não disponível',
      dataJulgamento: s.julgamento_data || s.publicacao_data || null,
      relator: s.relator_processo_nome || s.ministro_facet || '—',
      link: s.inteiro_teor_url || s.pesquisa_url || null,
    };
  });

  console.log(`[STF] ${resultados.length} resultados (total: ${total})`);
  return { resultados, total };
}

// Serve frontend em produção
if (IS_PROD) {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
}

// GET /api/buscar?q=dano+moral&pagina=1
app.get('/api/buscar', async (req, res) => {
  const { q, pagina = 1 } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ erro: 'Informe ao menos 2 caracteres.' });
  }
  try {
    const { resultados, total } = await buscarSTF(q.trim(), Number(pagina));
    return res.json({ resultados, total });
  } catch (e) {
    console.error('[STF] Erro:', e.message);
    return res.status(500).json({ erro: e.message });
  }
});

// Obtém o token ao iniciar
obterWafToken().catch(e => console.error('[STF] Falha ao obter token inicial:', e.message));

// Redireciona tudo para o React em produção
if (IS_PROD) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
