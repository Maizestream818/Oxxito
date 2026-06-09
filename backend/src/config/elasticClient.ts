import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const elasticsearchNode = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

/**
 * Cliente oficial de Elasticsearch.
 * Centraliza la conexión del backend con el cluster distribuido de Oxxito.
 */
export const elasticClient = new Client({
  node: elasticsearchNode
});

/**
 * Verifica la conexión con Elasticsearch consultando la información general del cluster.
 */
export async function verifyElasticsearchConnection(): Promise<{
  connected: boolean;
  clusterName?: string;
  nodeName?: string;
  version?: string;
  error?: string;
}> {
  try {
    const info = await elasticClient.info();

    return {
      connected: true,
      clusterName: info.cluster_name,
      nodeName: info.name,
      version: info.version.number
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido al conectar con Elasticsearch';

    return {
      connected: false,
      error: message
    };
  }
}
