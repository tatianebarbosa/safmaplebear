export interface TeamMember {
  username: string;
  fullName: string;
  role: 'agente' | 'coordenadora';
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    username: 'tatiane.barbosa',
    fullName: 'Tatiane Barbosa dos Santos Xavier',
    role: 'agente'
  },
  {
    username: 'rafhael.nazeazeno',
    fullName: 'Rafhael Nazeazeno Pereira',
    role: 'agente'
  },
  {
    username: 'ingrid.vania',
    fullName: 'Ingrid Vania Mazzei de Oliveira',
    role: 'agente'
  },
  {
    username: 'joao.felipe',
    fullName: 'Joao Felipe Gutierrez de Freitas',
    role: 'agente'
  },
  {
    username: 'jaqueline.floriano',
    fullName: 'Jaqueline Floriano da Silva',
    role: 'agente'
  },
  {
    username: 'jessika.queiroz',
    fullName: 'Jessika Queiroz',
    role: 'agente'
  },
  {
    username: 'fernanda.louise',
    fullName: 'Fernanda Louise de Almeida Inacio',
    role: 'agente'
  },
  {
    username: 'ana.paula',
    fullName: 'ANA PAULA OLIVEIRA DE ANDRADE',
    role: 'coordenadora'
  }
];

// Função para buscar membros da equipe por nome
export const searchTeamMembers = (query: string): TeamMember[] => {
  if (!query.trim()) return TEAM_MEMBERS;
  
  const searchTerm = query.toLowerCase();
  return TEAM_MEMBERS.filter(member => 
    member.fullName.toLowerCase().includes(searchTerm) ||
    member.username.toLowerCase().includes(searchTerm)
  );
};

// Função para obter membro por username
export const getTeamMemberByUsername = (username: string): TeamMember | undefined => {
  return TEAM_MEMBERS.find(member => member.username === username);
};

// Função para obter membro por nome completo
export const getTeamMemberByFullName = (fullName: string): TeamMember | undefined => {
  return TEAM_MEMBERS.find(member => member.fullName === fullName);
};

