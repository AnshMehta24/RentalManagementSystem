import { UserRole } from "@/generated/prisma";
import { z } from "zod";

export const inviteUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email format"),
  role: z.nativeEnum(UserRole),
});
