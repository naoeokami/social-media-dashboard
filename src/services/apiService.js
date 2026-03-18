import { mockMetrics } from '../data/mockData';

/**
 * SERVIÇO DE INTEGRAÇÃO COM REDES SOCIAIS (META / LINKEDIN)
 * 
 * Para obter dados reais, você precisa:
 * 1. Meta (Facebook/Instagram): 
 *    - Criar um app no Meta for Developers
 *    - Adicionar o produto "Instagram Graph API"
 *    - Gerar um Token de Acesso Permanente
 * 
 * 2. LinkedIn:
 *    - Criar um app no LinkedIn Developer Portal
 *    - Solicitar acesso a "Share on LinkedIn" ou "Sign In with LinkedIn"
 *    - Gerar um Token Pessoal ou de Empresa
 */

const getApiKeys = () => {
  try {
    const keys = localStorage.getItem('socialhub_api_keys');
    return keys ? JSON.parse(keys) : {};
  } catch {
    return {};
  }
};

const getMetaTokens = () => {
  const keys = getApiKeys();
  return {
    token: keys.metaToken || import.meta.env.VITE_META_ACCESS_TOKEN,
    igAccountId: keys.igAccountId || import.meta.env.VITE_META_IG_ACCOUNT_ID,
  };
};

export const fetchInstagramMetrics = async () => {
  const { token, igAccountId } = getMetaTokens();
  
  if (!token || !igAccountId) {
    console.warn("Métricas Reais do Instagram não configuradas. Usando mock.");
    return mockMetrics.instagram;
  }

  try {
    // Documentação oficial: https://developers.facebook.com/docs/instagram-api/reference/ig-user
    const url = `https://graph.facebook.com/v19.0/${igAccountId}?fields=followers_count,media_count&access_token=${token}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    return {
      ...mockMetrics.instagram, // Reaproveita crescimento/cor etc caso não venha da API
      followers: data.followers_count || mockMetrics.instagram.followers,
      reach: data.media_count * 123, // Exemplo de cálculo ou buscar métrica específica (insights)
    };
  } catch (error) {
    console.error("Erro ao buscar API Meta:", error);
    return mockMetrics.instagram;
  }
};

export const fetchFacebookMetrics = async () => {
  const { token } = getMetaTokens();
  // ... implementação parecida para a página do Facebook
  return mockMetrics.facebook;
};

export const fetchLinkedInMetrics = async () => {
  const keys = getApiKeys();
  const token = keys.linkedinToken || import.meta.env.VITE_LINKEDIN_ACCESS_TOKEN;
  // ... implementação parecida para a página da Empresa no LinkedIn
  return mockMetrics.linkedin;
};

export const fetchAllMetrics = async () => {
  const [instagram, facebook, linkedin] = await Promise.all([
    fetchInstagramMetrics(),
    fetchFacebookMetrics(),
    fetchLinkedInMetrics()
  ]);

  return { instagram, facebook, linkedin };
};
