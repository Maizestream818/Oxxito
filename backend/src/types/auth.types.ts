export type AuthenticatedUser = {
  usuario_id: string;
  nombre: string;
  username: string;
  rol: string;
  sucursal_id: string;
};

export type LoginRequestBody = {
  username?: string;
  password?: string;
};

export type LoginResponse = {
  token: string;
  user: AuthenticatedUser;
};

export type JwtPayload = {
  usuario_id: string;
  nombre: string;
  username: string;
  rol: string;
  sucursal_id: string;
};
