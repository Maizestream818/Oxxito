import { Request, Response } from 'express';

/**
 * Controlador encargado de responder el estado general del backend.
 * Se utiliza para validar que la API está levantada correctamente.
 */
export function getHealthStatus(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    message: 'Backend Oxxito funcionando',
    service: 'oxxito-backend',
    timestamp: new Date().toISOString()
  });
}
