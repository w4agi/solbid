import { z } from "zod";

const nameSchema = z
  .string({ message: "Name is required" })
  .min(2, { message: "Name must be at least 2 characters" })
  .max(50, { message: "Name must be less than 50 characters" })
  .regex(/^[a-zA-Z ]+$/, { message: "Name can only contain letters and spaces" });

const emailSchema = z
  .string({ message: "Email is required" })
  .email({ message: "Invalid email" });


const passwordSchema = z
  .string({ message: "Password is required" })
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",});

export const signupSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
});