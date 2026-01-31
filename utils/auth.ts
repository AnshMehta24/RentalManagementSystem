import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is not defined in production environment");
}

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: "VENDOR" | "CUSTOMER";
}


export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  try {
    const token = await new SignJWT(payload as any)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    return token;
  } catch (error) {
    console.error("Error signing token:", error);
    throw new Error("Failed to sign authentication token");
  }
}


export async function verifyAuthToken(
  token: string
): Promise<AuthTokenPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as unknown as AuthTokenPayload;
  } catch (error) {
    return null;
  }
}