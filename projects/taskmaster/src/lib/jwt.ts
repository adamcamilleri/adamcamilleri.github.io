import { SignJWT, jwtVerify } from 'jose'

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? 'missing-secret')
}

export async function signToken(payload: { userId: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as { userId: string; email: string }
}
