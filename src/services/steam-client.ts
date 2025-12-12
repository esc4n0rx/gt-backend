import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import {
  SteamAppDetails,
  SteamGameForThread,
  SteamAppListItem,
} from '../types/external-api.types';
import { contentCacheRepository } from '../repositories/content-cache-repository';

export class SteamClient {
  private client: AxiosInstance;
  private appList: SteamAppListItem[] = [];
  private appListLoaded = false;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://store.steampowered.com/api',
    });
  }

  /**
   * Carregar lista de apps do Steam do arquivo local
   */
  private loadAppList(): void {
    if (this.appListLoaded) return;

    try {
      const appidPath = path.join(process.cwd(), 'data', 'appid.json');
      const data = fs.readFileSync(appidPath, 'utf-8');
      const parsed = JSON.parse(data);

      // Assumindo que o arquivo tem formato: { applist: { apps: [...] } }
      if (parsed.applist && parsed.applist.apps) {
        this.appList = parsed.applist.apps;
      } else if (Array.isArray(parsed)) {
        this.appList = parsed;
      } else {
        throw new Error('Formato de appid.json não reconhecido');
      }

      this.appListLoaded = true;
      console.log(`✅ Lista de ${this.appList.length} apps Steam carregada`);
    } catch (error) {
      console.error('❌ Erro ao carregar appid.json:', error);
      throw new Error('Não foi possível carregar lista de jogos Steam');
    }
  }

  /**
   * Calcular distância de Levenshtein entre duas strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    const len1 = s1.length;
    const len2 = s2.length;

    // Criar matriz de distâncias
    const matrix: number[][] = [];

    // Inicializar primeira coluna e linha
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Preencher matriz
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // Deleção
          matrix[i][j - 1] + 1,      // Inserção
          matrix[i - 1][j - 1] + cost // Substituição
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Calcular similaridade (0-1) baseada em Levenshtein
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  /**
   * Buscar melhor correspondência de jogo na lista local
   */
  private findBestMatch(query: string): SteamAppListItem | null {
    this.loadAppList();

    if (this.appList.length === 0) {
      throw new Error('Lista de jogos Steam vazia');
    }

    let bestMatch: SteamAppListItem | null = null;
    let bestSimilarity = 0;

    // Filtrar apenas jogos (type: 'game') se o campo existir
    const candidates = this.appList;

    for (const app of candidates) {
      const similarity = this.calculateSimilarity(query, app.name);

      // Considerar correspondência exata ou similaridade > 70%
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = app;
      }

      // Se encontrar correspondência exata, pode parar
      if (similarity === 1.0) {
        break;
      }
    }

    // Só retornar se similaridade for razoável (> 60%)
    if (bestMatch && bestSimilarity > 0.6) {
      console.log(`🎮 Match encontrado: "${bestMatch.name}" (similaridade: ${(bestSimilarity * 100).toFixed(1)}%)`);
      return bestMatch;
    }

    return null;
  }

  /**
   * Buscar detalhes de um jogo na API Steam
   */
  async getGameDetails(appId: number): Promise<SteamAppDetails> {
    try {
      const { data } = await this.client.get(`/appdetails`, {
        params: {
          appids: appId,
          l: 'brazilian', // Linguagem português brasileiro
        },
      });

      const appData = data[appId.toString()];

      if (!appData || !appData.success) {
        throw new Error(`Jogo com App ID ${appId} não encontrado na Steam`);
      }

      return appData;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit da Steam atingido. Tente novamente em alguns segundos.');
      }
      throw error;
    }
  }

  /**
   * Buscar jogo por nome (com cache)
   */
  async searchGame(query: string): Promise<SteamGameForThread> {
    // Encontrar melhor correspondência
    const match = this.findBestMatch(query);

    if (!match) {
      throw new Error(`Nenhum jogo encontrado para "${query}"`);
    }

    const appId = match.appid;

    // Verificar cache
    const cached = await contentCacheRepository.findBySourceAndId('steam', appId.toString());
    if (cached) {
      console.log(`✅ Cache hit para Steam App ID ${appId}`);
      return cached.content_data as SteamGameForThread;
    }

    console.log(`🔍 Cache miss para Steam App ID ${appId}. Buscando na API...`);

    // Buscar detalhes completos
    const details = await this.getGameDetails(appId);

    // Formatar para thread
    const formatted = this.formatForThread(details);

    // Salvar no cache
    await contentCacheRepository.create({
      source: 'steam',
      externalId: appId.toString(),
      searchQuery: query,
      contentData: formatted,
      expiresInDays: 30,
    });

    return formatted;
  }

  /**
   * Buscar por ID direto (com cache)
   */
  async getGameById(appId: number): Promise<SteamGameForThread> {
    // Verificar cache
    const cached = await contentCacheRepository.findBySourceAndId('steam', appId.toString());
    if (cached) {
      console.log(`✅ Cache hit para Steam App ID ${appId}`);
      return cached.content_data as SteamGameForThread;
    }

    console.log(`🔍 Cache miss para Steam App ID ${appId}. Buscando na API...`);

    // Buscar detalhes
    const details = await this.getGameDetails(appId);

    // Formatar para thread
    const formatted = this.formatForThread(details);

    // Salvar no cache
    await contentCacheRepository.create({
      source: 'steam',
      externalId: appId.toString(),
      searchQuery: formatted.nome,
      contentData: formatted,
      expiresInDays: 30,
    });

    return formatted;
  }

  /**
   * Formatar dados da Steam para formato de thread
   */
  private formatForThread(details: SteamAppDetails): SteamGameForThread {
    if (!details.data) {
      throw new Error('Dados do jogo não disponíveis');
    }

    const game = details.data;

    // Extrair gêneros
    const generos = game.genres ? game.genres.map((g) => g.description) : [];

    // Extrair plataformas
    const plataformas: string[] = [];
    if (game.platforms?.windows) plataformas.push('Windows');
    if (game.platforms?.mac) plataformas.push('Mac');
    if (game.platforms?.linux) plataformas.push('Linux');

    // Extrair ano de lançamento
    let ano: number | null = null;
    if (game.release_date?.date) {
      const yearMatch = game.release_date.date.match(/\d{4}/);
      if (yearMatch) {
        ano = parseInt(yearMatch[0]);
      }
    }

    // Extrair specs (remover HTML tags)
    const stripHtml = (html: string): string => {
      return html.replace(/<[^>]*>/g, '').trim();
    };

    const specsMinimas = game.pc_requirements?.minimum
      ? stripHtml(game.pc_requirements.minimum)
      : null;

    const specsRecomendadas = game.pc_requirements?.recommended
      ? stripHtml(game.pc_requirements.recommended)
      : null;

    // Desenvolvedor e Publisher (pegar primeiro da lista)
    const desenvolvedor = game.developers && game.developers.length > 0
      ? game.developers[0]
      : null;

    const publisher = game.publishers && game.publishers.length > 0
      ? game.publishers[0]
      : null;

    return {
      steam_appid: game.steam_appid.toString(),
      nome: game.name,
      estilo: generos,
      poster_url: game.header_image || null,
      ano,
      sistema_operacional: plataformas,
      descricao: game.short_description || 'Sem descrição disponível',
      specs_minimas: specsMinimas,
      specs_recomendadas: specsRecomendadas,
      desenvolvedor,
      publisher,
    };
  }
}

export const steamClient = new SteamClient();
