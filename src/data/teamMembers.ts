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
    username: 'yasmin.martins',
    fullName: 'Yasmin Martins',
    role: 'agente'
  },
  {
    username: 'fernanda.louise',
    fullName: 'Fernanda Louise de Almeida Inacio',
    role: 'agente'
  },
  {
    username: 'ana.paula',
    fullName: 'Ana Paula Oliveira de Andrade',
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

const normalizeKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s._-]+/g, '')
    .toLowerCase()
    .trim();

const AGENT_ALIASES: Record<string, string> = {
  joao: 'joao.felipe',
  ingrid: 'ingrid.vania',
  rafha: 'rafhael.nazeazeno',
  rafhael: 'rafhael.nazeazeno',
  tati: 'tatiane.barbosa',
  tatiane: 'tatiane.barbosa',
  jaque: 'jaqueline.floriano',
  jaqueline: 'jaqueline.floriano',
  jessika: 'jessika.queiroz',
  fernanda: 'fernanda.louise',
  ana: 'ana.paula',
  anapaula: 'ana.paula',
};

export const getAgentDisplayName = (agent: string): string => {
  const normalized = normalizeKey(agent);
  const username = AGENT_ALIASES[normalized] ?? agent;
  const normalizedUsername = normalizeKey(username);

  const member =
    TEAM_MEMBERS.find(
      (m) => normalizeKey(m.username) === normalizedUsername || normalizeKey(m.fullName) === normalized
    ) ||
    TEAM_MEMBERS.find((m) => normalizeKey(m.username) === normalized);

  return member?.fullName || agent;
};

export const findTeamMemberForAgent = (agent: string): TeamMember | undefined => {
  const normalized = normalizeKey(agent);
  const username = AGENT_ALIASES[normalized] ?? agent;

  const byUsername = TEAM_MEMBERS.find(
    (member) => normalizeKey(member.username) === normalizeKey(username)
  );
  if (byUsername) return byUsername;

  return TEAM_MEMBERS.find(
    (member) => normalizeKey(member.username) === normalized || normalizeKey(member.fullName) === normalized
  );
};

export const getCoordinatorMember = (): TeamMember | undefined =>
  TEAM_MEMBERS.find((member) => member.role === 'coordenadora');

