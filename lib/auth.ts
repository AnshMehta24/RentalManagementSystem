import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface AuthPayload {
  userId: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
}

export async function signAuthToken(payload: AuthPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as AuthPayload;
}
