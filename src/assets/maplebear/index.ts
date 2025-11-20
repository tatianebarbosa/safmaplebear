/**
 * Mascotes e Logos Institucionais da Maple Bear
 * 
 * Este arquivo centraliza a exportação de todos os recursos visuais
 * da marca Maple Bear para uso no sistema SafMaplebear.
 */

// Mascotes - Diferentes expressões e ações
import BearWaving from './mascots/bear_waving.png';
import BearLeaning from './mascots/bear_leaning.png';
import BearThinking from './mascots/bear_thinking.png';
import BearInvestigating from './mascots/bear_investigating.png';
import BearIdea from './mascots/bear_idea.png';
import BearWriting from './mascots/bear_writing.png';
import BearReading from './mascots/bear_reading.png';
import BearPeeking from './mascots/bear_peeking.png';
import BearPulling from './mascots/bear_pulling.png';
import BearHappy from './mascots/bear_happy.png';

// Logos Institucionais
import MapleLogos from './logos/maple_logos.png';
import MapleLogoOutline from './logos/maple_logo_outline.png';
import TripleLogo from './logos/maple_bear_triple_logo.png';

// Exportação organizada por categoria
export const Mascots = {
  // Saudações e boas-vindas
  Waving: BearWaving,
  Happy: BearHappy,
  Leaning: BearLeaning,
  
  // Pensamento e ideias
  Thinking: BearThinking,
  Idea: BearIdea,
  
  // Atividades
  Writing: BearWriting,
  Reading: BearReading,
  Investigating: BearInvestigating,
  
  // Ações especiais
  Peeking: BearPeeking,
  Pulling: BearPulling,
};

export const Logos = {
  Full: MapleLogos,
  Outline: MapleLogoOutline,
  Triple: TripleLogo,
};

// Exportações individuais para importação direta
export {
  BearWaving,
  BearLeaning,
  BearThinking,
  BearInvestigating,
  BearIdea,
  BearWriting,
  BearReading,
  BearPeeking,
  BearPulling,
  BearHappy,
  MapleLogos,
  MapleLogoOutline,
  TripleLogo,
};

// Mapeamento de uso sugerido por contexto
export const MascotUsage = {
  // Telas de feedback
  success: BearIdea,          // Sucesso - urso com ideia
  error: BearThinking,        // Erro - urso pensando
  loading: BearInvestigating, // Carregando - urso investigando
  notFound: BearPeeking,      // 404 - urso espiando
  
  // Telas de autenticação
  login: BearWaving,          // Login - urso acenando
  welcome: BearHappy,         // Boas-vindas - urso feliz
  
  // Telas de conteúdo
  reading: BearReading,       // Leitura/documentação
  writing: BearWriting,       // Formulários/edição
  working: BearPulling,       // Processamento/trabalho
};

export default {
  Mascots,
  Logos,
  MascotUsage,
};
