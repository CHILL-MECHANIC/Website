import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  phone: string;
  authMethod: 'phone' | 'email';
  isProfileComplete: boolean;
}

export function signToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign(
    payload as object,
    secret,
    { expiresIn: '7d' } as jwt.SignOptions
  );
}

export function verifyToken(token: string): JWTPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not configured');
    return null;
  }
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    return null;
  }
}
