/**
 * Script de Web Scraping do Canva - Versão Expandida
 * 
 * Este script faz login no Canva e coleta métricas detalhadas:
 * - Número de pessoas (usuários ativos)
 * - Designs criados
 * - Membros ativos
 * - Total publicado
 * - Total compartilhado
 * - Kits de marca
 * - Membros por função (Administradores, Alunos, Professores)
 * 
 * Deve ser executado periodicamente (ex: a cada hora) via cron job ou scheduler
 * Uso: node scripts/canva-scraper.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configurações
const CANVA_EMAIL = process.env.CANVA_EMAIL || 'tatianebarbosa20166@gmail.com';
const CANVA_PASSWORD = process.env.CANVA_PASSWORD || 'Tati2025@';
const CANVA_REPORTS_URL = 'https://www.canva.com/settings/team-reports';
const CANVA_PEOPLE_URL = 'https://www.canva.com/settings/people';
const CANVA_BRAND_KITS_URL = 'https://www.canva.com/settings/brand-kits';
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
 * Coleta dados do Relatório de Uso
 */
async function coletarRelatorioUso(page) {
  console.log('Navegando para Relatório de Uso...');
  await page.goto(CANVA_REPORTS_URL, { waitUntil: 'networkidle2' });

  const relatorioData = await page.evaluate(() => {
    const dados = {};
    
    // Extrai Designs Criados
    const designsElements = document.querySelectorAll('h2, h3, div');
    for (let el of designsElements) {
      if (el.textContent.includes('Designs criados')) {
        const parent = el.closest('div');
        if (parent) {
          const numbers = parent.textContent.match(/(\d+(?:\.\d+)?)/g);
          if (numbers) {
            dados.designsCriados = parseInt(numbers[0].replace(/\./g, ''));
            // Extrai a porcentagem de crescimento
            const percentMatch = parent.textContent.match(/↑\s*(\d+)%/);
            if (percentMatch) {
              dados.designsCriadosCrescimento = parseInt(percentMatch[1]);
            }
          }
        }
      }
      
      if (el.textContent.includes('Membros ativos')) {
        const parent = el.closest('div');
        if (parent) {
          const numbers = parent.textContent.match(/(\d+(?:\.\d+)?)/g);
          if (numbers) {
            dados.membrosAtivos = parseInt(numbers[0].replace(/\./g, ''));
            // Extrai a porcentagem de crescimento
            const percentMatch = parent.textContent.match(/↑\s*(\d+)%/);
            if (percentMatch) {
              dados.membrosAtivosCrescimento = parseInt(percentMatch[1]);
            }
          }
        }
      }
    }
    
    // Extrai Total Publicado e Total Compartilhado
    const tabelaElements = document.querySelectorAll('div, span');
    for (let el of tabelaElements) {
      if (el.textContent.includes('Total publicado')) {
        const parent = el.closest('div');
        if (parent) {
          const match = parent.textContent.match(/Total publicado\s*(\d+(?:\.\d+)?)/);
          if (match) {
            dados.totalPublicado = parseInt(match[1].replace(/\./g, ''));
          }
        }
      }
      
      if (el.textContent.includes('Total compartilhado')) {
        const parent = el.closest('div');
        if (parent) {
          const match = parent.textContent.match(/Total compartilhado\s*(\d+(?:\.\d+)?)/);
          if (match) {
            dados.totalCompartilhado = parseInt(match[1].replace(/\./g, ''));
          }
        }
      }
    }
    
    // Extrai Administradores, Alunos, Professores
    const funcoeElements = document.querySelectorAll('div, span');
    for (let el of funcoeElements) {
      if (el.textContent.includes('Administradores')) {
        const match = el.textContent.match(/Administradores\s*(\d+)/);
        if (match) {
          dados.administradores = parseInt(match[1]);
        }
      }
      if (el.textContent.includes('Alunos')) {
        const match = el.textContent.match(/Alunos\s*(\d+)/);
        if (match) {
          dados.alunos = parseInt(match[1]);
        }
      }
      if (el.textContent.includes('Professores')) {
        const match = el.textContent.match(/Professores\s*(\d+)/);
        if (match) {
          dados.professores = parseInt(match[1]);
        }
      }
    }
    
    return dados;
  });

  return relatorioData;
}

/**
 * Coleta dados de Pessoas
 */
async function coletarPessoas(page) {
  console.log('Navegando para Pessoas...');
  await page.goto(CANVA_PEOPLE_URL, { waitUntil: 'networkidle2' });

  const pessoasData = await page.evaluate(() => {
    const dados = {};
    
    // Extrai Total de Pessoas
    const elementos = document.querySelectorAll('h1, h2, h3, div');
    for (let el of elementos) {
      if (el.textContent.includes('Pessoas')) {
        const match = el.textContent.match(/Pessoas\s*\((\d+)\)/);
        if (match) {
          dados.totalPessoas = parseInt(match[1]);
          return dados;
        }
      }
    }
    
    return dados;
  });

  return pessoasData;
}

/**
 * Coleta dados de Kits de Marca
 */
async function coletarKitsMarca(page) {
  console.log('Navegando para Kits de Marca...');
  try {
    await page.goto(CANVA_BRAND_KITS_URL, { waitUntil: 'networkidle2' });

    const kitsData = await page.evaluate(() => {
      const kits = [];
      
      // Extrai informações dos kits de marca
      const linhas = document.querySelectorAll('tr');
      for (let linha of linhas) {
        const colunas = linha.querySelectorAll('td');
        if (colunas.length > 0) {
          const kit = {
            nome: colunas[0]?.textContent?.trim() || '',
            aplicado: colunas[1]?.textContent?.trim() || '',
            criado: colunas[2]?.textContent?.trim() || '',
            ultimaAtualizacao: colunas[3]?.textContent?.trim() || '',
          };
          
          // Filtra kits vazios
          if (kit.nome) {
            kits.push(kit);
          }
        }
      }
      
      return kits;
    });

    return { kits: kitsData, totalKits: kitsData.length };
  } catch (e) {
    console.log('Erro ao coletar kits de marca:', e.message);
    return { kits: [], totalKits: 0 };
  }
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

    // Coleta dados de diferentes páginas
    console.log('Coletando dados...');
    const relatorioData = await coletarRelatorioUso(page);
    const pessoasData = await coletarPessoas(page);
    const kitsData = await coletarKitsMarca(page);

    // Obtém os dados anteriores
    const dadosAnteriores = lerDadosAnteriores();
    const { data, hora, timestamp } = obterDataHora();

    // Calcula as mudanças
    const mudancas = {};
    if (dadosAnteriores) {
      if (dadosAnteriores.totalPessoas !== undefined) {
        mudancas.totalPessoas = (pessoasData.totalPessoas || 0) - dadosAnteriores.totalPessoas;
      }
      if (dadosAnteriores.designsCriados !== undefined) {
        mudancas.designsCriados = (relatorioData.designsCriados || 0) - dadosAnteriores.designsCriados;
      }
      if (dadosAnteriores.membrosAtivos !== undefined) {
        mudancas.membrosAtivos = (relatorioData.membrosAtivos || 0) - dadosAnteriores.membrosAtivos;
      }
    }

    // Prepara os novos dados consolidados
    const novosDados = {
      // Dados de Pessoas
      totalPessoas: pessoasData.totalPessoas || 0,
      
      // Dados de Relatório de Uso
      designsCriados: relatorioData.designsCriados || 0,
      designsCriadosCrescimento: relatorioData.designsCriadosCrescimento || 0,
      membrosAtivos: relatorioData.membrosAtivos || 0,
      membrosAtivosCrescimento: relatorioData.membrosAtivosCrescimento || 0,
      totalPublicado: relatorioData.totalPublicado || 0,
      totalCompartilhado: relatorioData.totalCompartilhado || 0,
      administradores: relatorioData.administradores || 0,
      alunos: relatorioData.alunos || 0,
      professores: relatorioData.professores || 0,
      
      // Dados de Kits de Marca
      totalKits: kitsData.totalKits || 0,
      kits: kitsData.kits || [],
      
      // Metadados
      dataAtualizacao: data,
      horaAtualizacao: hora,
      timestamp,
      mudancas,
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
