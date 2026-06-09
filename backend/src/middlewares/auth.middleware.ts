import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser, JwtPayload } from '../types/auth.types.js';

function unauthorized(res: Response, message: string): void {
  res.status(401).json({
    status: 'error',
    message
  });
}

function forbidden(res: Response, message: string): void {
  res.status(403).json({
    status: 'error',
    message
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidJwtPayload(value: unknown): value is JwtPayload & { nombre?: string } {
  return (
    isRecord(value) &&
    typeof value.usuario_id === 'string' &&
    typeof value.username === 'string' &&
    typeof value.rol === 'string' &&
    typeof value.sucursal_id === 'string' &&
    (value.nombre === undefined || typeof value.nombre === 'string')
  );
}

function toAuthenticatedUser(payload: JwtPayload & { nombre?: string }): AuthenticatedUser {
  return {
    usuario_id: payload.usuario_id,
    nombre: payload.nombre ?? '',
    username: payload.username,
    rol: payload.rol,
    sucursal_id: payload.sucursal_id
  };
}

/**
 * Valida el token JWT enviado en Authorization: Bearer <token>.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.header('Authorization');

  if (!authorization) {
    unauthorized(res, 'Token requerido');
    return;
  }

  const [type, token, extra] = authorization.split(' ');

  if (type !== 'Bearer' || !token || extra) {
    unauthorized(res, 'Token inválido o expirado');
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'oxxito_secret_desarrollo';
    const decoded = jwt.verify(token, secret);

    if (!isValidJwtPayload(decoded)) {
      unauthorized(res, 'Token inválido o expirado');
      return;
    }

    req.user = toAuthenticatedUser(decoded);
    next();
  } catch (_error: unknown) {
    unauthorized(res, 'Token inválido o expirado');
  }
}

/**
 * Restringe el acceso a usuarios con alguno de los roles permitidos.
 */
export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res, 'Token requerido');
      return;
    }

    if (!allowedRoles.includes(req.user.rol)) {
      forbidden(res, 'Rol no autorizado');
      return;
    }

    next();
  };
}

/**
 * Permite acceso a una sucursal solo al admin o al usuario de la misma sucursal.
 */
export function requireSucursalAccess(req: Request, res: Response, next: NextFunction): void {
  const requestedSucursalId = req.params.sucursalId ?? req.params.sucursal_id;

  if (!requestedSucursalId) {
    res.status(400).json({
      status: 'error',
      message: 'Sucursal requerida'
    });

    return;
  }

  if (!req.user) {
    unauthorized(res, 'Token requerido');
    return;
  }

  if (req.user.rol === 'admin' || req.user.sucursal_id === requestedSucursalId) {
    next();
    return;
  }

  forbidden(res, 'Acceso restringido a la sucursal');
}
