/**
 * Script de Web Scraping do Canva
 * 
 * Este script faz login no Canva e coleta o número de pessoas (usuários ativos)
 * Deve ser executado periodicamente (ex: a cada hora) via cron job ou scheduler
 * 
 * Uso: node scripts/canva-scraper.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configurações
const CANVA_EMAIL = process.env.CANVA_EMAIL || 'tatianebarbosa20166@gmail.com';
const CANVA_PASSWORD = process.env.CANVA_PASSWORD || 'Tati2025@';
const CANVA_URL = 'https://www.canva.com/settings/people';
const DATA_FILE = path.join(__dirname, '../data/canva-data.json');

// Garante que o diretório de dados existe
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Lê os dados anteriores do arquivo
 */
function lerDadosAnteriores() {
  if (fs.existsSync(DATA_FILE)) {
    const conteudo = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(conteudo);
  }
  return null;
}

/**
 * Salva os dados no arquivo
 */
function salvarDados(dados) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2));
}

/**
 * Formata a data e hora atual
 */
function obterDataHora() {
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR');
  const timestamp = agora.getTime();
  return { data, hora, timestamp };
}

/**
 * Faz o scraping do Canva
 */
async function fazerScraping() {
  let browser;
  try {
    console.log('Iniciando navegador...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Define o user agent para evitar bloqueios
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    console.log('Navegando para a página de login...');
    await page.goto('https://www.canva.com/login', { waitUntil: 'networkidle2' });

    // Aguarda o campo de email
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    console.log('Preenchendo email...');
    await page.type('input[type="email"]', CANVA_EMAIL);

    console.log('Preenchendo senha...');
    await page.type('input[type="password"]', CANVA_PASSWORD);

    console.log('Clicando no botão de login...');
    await page.click('button[type="submit"]');

    // Aguarda a navegação após o login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
      console.log('Navegação não completada, pode ser necessário 2FA');
    });

    console.log('Navegando para a página de pessoas...');
    await page.goto(CANVA_URL, { waitUntil: 'networkidle2' });

    // Aguarda o elemento que contém o número de pessoas
    // Tenta vários seletores possíveis
    let totalPessoas = null;
    
    try {
      // Tenta encontrar o número no texto "Pessoas (836)"
      const texto = await page.evaluate(() => {
        const elementos = document.querySelectorAll('h1, h2, h3, div');
        for (let el of elementos) {
          if (el.textContent.includes('Pessoas')) {
            const match = el.textContent.match(/Pessoas\s*\((\d+)\)/);
            if (match) {
              return parseInt(match[1]);
            }
          }
        }
        return null;
      });

      if (texto) {
        totalPessoas = texto;
      }
    } catch (e) {
      console.log('Erro ao extrair número de pessoas:', e.message);
    }

    if (!totalPessoas) {
      throw new Error('Não foi possível extrair o número de pessoas');
    }

    console.log(`Total de pessoas encontrado: ${totalPessoas}`);

    // Obtém os dados anteriores
    const dadosAnteriores = lerDadosAnteriores();
    const { data, hora, timestamp } = obterDataHora();

    // Calcula a mudança
    let mudanca = 0;
    if (dadosAnteriores && dadosAnteriores.totalPessoas) {
      mudanca = totalPessoas - dadosAnteriores.totalPessoas;
    }

    // Prepara os novos dados
    const novosDados = {
      totalPessoas,
      dataAtualizacao: data,
      horaAtualizacao: hora,
      timestamp,
      mudanca,
      ultimaAtualizacao: new Date().toISOString(),
    };

    // Salva os dados
    salvarDados(novosDados);

    console.log('Dados salvos com sucesso!');
    console.log(JSON.stringify(novosDados, null, 2));

    return novosDados;
  } catch (error) {
    console.error('Erro durante o scraping:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Executa o scraping
fazerScraping()
  .then(() => {
    console.log('Scraping concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Scraping falhou:', error);
    process.exit(1);
  });
