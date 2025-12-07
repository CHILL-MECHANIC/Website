import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface JWTPayload {
  userId: string;
  phone: string;
  authMethod: 'phone' | 'email';
  isProfileComplete: boolean;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(
    payload as object,
    JWT_SECRET,
    { expiresIn: '7d' } as jwt.SignOptions
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
