import { Request, Response } from 'express';
import { AuthServiceError, login } from '../services/auth.service.js';
import { LoginRequestBody } from '../types/auth.types.js';

/**
 * Controlador para autenticar usuarios del indice usuarios en Elasticsearch.
 */
export async function postLogin(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as LoginRequestBody;
    const result = await login(username ?? '', password ?? '');

    res.status(200).json({
      status: 'ok',
      message: 'Login correcto',
      ...result
    });
  } catch (error: unknown) {
    if (error instanceof AuthServiceError) {
      if (error.code === 'MISSING_CREDENTIALS') {
        res.status(400).json({
          message: 'Username y password son obligatorios'
        });

        return;
      }

      if (error.code === 'INACTIVE_USER') {
        res.status(403).json({
          message: 'Usuario inactivo'
        });

        return;
      }

      res.status(401).json({
        message: 'Credenciales inválidas'
      });

      return;
    }

    res.status(500).json({
      message: 'Error inesperado al iniciar sesión'
    });
  }
}

/**
 * Devuelve el usuario autenticado a partir del token validado por middleware.
 */
export function getCurrentUser(req: Request, res: Response): void {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Token requerido'
    });

    return;
  }

  res.status(200).json({
    status: 'ok',
    user: req.user
  });
}
