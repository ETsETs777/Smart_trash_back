import { AuthRole } from './auth-role.enum';

export interface JwtPayload {
  sub: string;
  role: AuthRole;
  companyId?: string;
}


