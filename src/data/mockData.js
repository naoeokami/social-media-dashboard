export const mockMetrics = {
  instagram: {
    platform: 'Instagram',
    followers: 12843,
    reach: 45200,
    engagement: 4.7,
    followersGrowth: 3.2,
    reachGrowth: 12.5,
    engagementGrowth: -0.3,
    color: '#E4405F',
    icon: 'instagram'
  },
  facebook: {
    platform: 'Facebook',
    followers: 8521,
    reach: 32100,
    engagement: 2.1,
    followersGrowth: 1.8,
    reachGrowth: 5.3,
    engagementGrowth: 0.8,
    color: '#1877F2',
    icon: 'facebook'
  },
  linkedin: {
    platform: 'LinkedIn',
    followers: 3256,
    reach: 18700,
    engagement: 5.9,
    followersGrowth: 6.1,
    reachGrowth: 22.0,
    engagementGrowth: 1.5,
    color: '#0A66C2',
    icon: 'linkedin'
  }
};

export const mockChartData = {
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
  followers: {
    instagram: [11200, 11500, 11900, 12200, 12500, 12843],
    facebook: [7800, 7950, 8100, 8250, 8400, 8521],
    linkedin: [2100, 2400, 2650, 2900, 3100, 3256],
  },
  reach: {
    instagram: [38000, 39500, 41000, 42300, 44000, 45200],
    facebook: [28000, 29000, 29500, 30200, 31000, 32100],
    linkedin: [12000, 13500, 14800, 16000, 17200, 18700],
  },
  engagement: {
    instagram: [4.2, 4.5, 4.3, 4.8, 4.6, 4.7],
    facebook: [1.8, 1.9, 2.0, 2.1, 2.0, 2.1],
    linkedin: [4.5, 5.0, 5.2, 5.5, 5.7, 5.9],
  }
};

export const quickShortcuts = [
  { id: '1', name: 'Canva', url: 'https://www.canva.com', icon: '🎨', color: '#7C3AED' },
  { id: '2', name: 'Meta Business', url: 'https://business.facebook.com', icon: '📊', color: '#1877F2' },
  { id: '3', name: 'ChatGPT', url: 'https://chat.openai.com', icon: '🤖', color: '#10a37f' },
  { id: '4', name: 'Google Drive', url: 'https://drive.google.com', icon: '📁', color: '#FBBF24' },
  { id: '5', name: 'CapCut', url: 'https://www.capcut.com', icon: '🎬', color: '#00E5FF' },
  { id: '6', name: 'Figma', url: 'https://www.figma.com', icon: '✏️', color: '#F24E1E' },
];

export const contentTypes = [
  'Reels', 'Carrossel', 'Artigo', 'Story', 'Imagem Única'
];

export const platforms = [
  { name: 'Instagram', color: '#E4405F' },
  { name: 'Facebook', color: '#1877F2' },
  { name: 'LinkedIn', color: '#0A66C2' },
];

export const funnelSegments = [
  'Topo de Funil', 'Meio de Funil', 'Fundo de Funil'
];

export const tools = [
  'CapCut', 'Photoshop', 'Figma', 'Canva', 'Premiere', 'After Effects', 'InShot', 'Outro'
];

export const postStatuses = [
  { value: 'ideia', label: 'Ideia', color: '#94a3b8' },
  { value: 'producao', label: 'Em Produção', color: '#f59e0b' },
  { value: 'aprovacao', label: 'Aguardando Aprovação', color: '#a855f7' },
  { value: 'agendado', label: 'Agendado', color: '#3b82f6' },
  { value: 'postado', label: 'Postado', color: '#10b981' },
];

export const swipeCategories = [
  'Trend', 'Áudio', 'Referência Visual', 'Copy', 'Inspiração', 'Concorrência'
];

export const initialTodos = [
  { id: '1', text: 'Criar briefing do post de segunda', done: false },
  { id: '2', text: 'Editar reels com CapCut', done: false },
  { id: '3', text: 'Responder comentários do Instagram', done: true },
  { id: '4', text: 'Agendar posts da semana', done: false },
  { id: '5', text: 'Enviar relatório mensal', done: false },
];
