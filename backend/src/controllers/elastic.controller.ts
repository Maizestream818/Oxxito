import { Request, Response } from 'express';
import { verifyElasticsearchConnection } from '../config/elasticClient.js';

/**
 * Controlador encargado de verificar la conexión del backend con Elasticsearch.
 */
export async function getElasticHealth(_req: Request, res: Response): Promise<void> {
  const result = await verifyElasticsearchConnection();

  if (!result.connected) {
    res.status(503).json({
      status: 'error',
      message: 'No se pudo conectar con Elasticsearch',
      detail: result.error
    });

    return;
  }

  res.status(200).json({
    status: 'ok',
    message: 'Backend conectado correctamente con Elasticsearch',
    elasticsearch: {
      clusterName: result.clusterName,
      nodeName: result.nodeName,
      version: result.version
    }
  });
}
