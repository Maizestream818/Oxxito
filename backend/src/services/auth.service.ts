import { createHash } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { elasticClient } from '../config/elasticClient.js';
import { AuthenticatedUser, JwtPayload, LoginResponse } from '../types/auth.types.js';

type InternalUser = AuthenticatedUser & {
  password_hash: string;
  activo: boolean;
  created_at: string;
};

type AuthErrorCode = 'MISSING_CREDENTIALS' | 'INVALID_CREDENTIALS' | 'INACTIVE_USER';

export class AuthServiceError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

/**
 * Genera el hash SHA-256 usado por los usuarios de prueba cargados en Elasticsearch.
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Busca un usuario activo o inactivo por username exacto en el indice usuarios.
 */
export async function findUserByUsername(username: string): Promise<InternalUser | null> {
  const response = await elasticClient.search<InternalUser>({
    index: 'usuarios',
    size: 1,
    query: {
      term: {
        username
      }
    }
  });

  const hit = response.hits.hits[0];

  return hit?._source ?? null;
}

function toAuthenticatedUser(user: InternalUser): AuthenticatedUser {
  return {
    usuario_id: user.usuario_id,
    nombre: user.nombre,
    username: user.username,
    rol: user.rol,
    sucursal_id: user.sucursal_id
  };
}

function createJwt(user: AuthenticatedUser): string {
  const payload: JwtPayload = {
    usuario_id: user.usuario_id,
    nombre: user.nombre,
    username: user.username,
    rol: user.rol,
    sucursal_id: user.sucursal_id
  };
  // Fallback solo para desarrollo local; configurar JWT_SECRET en entornos compartidos o productivos.
  const secret = process.env.JWT_SECRET || 'oxxito_secret_desarrollo';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '8h') as SignOptions['expiresIn'];

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Valida credenciales contra Elasticsearch y genera un JWT basico para el usuario autenticado.
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const normalizedUsername = username.trim();

  if (!normalizedUsername || !password) {
    throw new AuthServiceError('MISSING_CREDENTIALS', 'Username y password son obligatorios');
  }

  const user = await findUserByUsername(normalizedUsername);

  if (!user) {
    throw new AuthServiceError('INVALID_CREDENTIALS', 'Credenciales inválidas');
  }

  if (!user.activo) {
    throw new AuthServiceError('INACTIVE_USER', 'Usuario inactivo');
  }

  if (hashPassword(password) !== user.password_hash) {
    throw new AuthServiceError('INVALID_CREDENTIALS', 'Credenciales inválidas');
  }

  const publicUser = toAuthenticatedUser(user);

  return {
    token: createJwt(publicUser),
    user: publicUser
  };
}
