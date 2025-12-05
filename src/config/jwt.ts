import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from './env';

export interface TokenPayload extends JwtPayload {
  userId: string;
  username: string;
}

export const generateToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};