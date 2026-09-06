import { z } from "zod";
export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  org: z.string().trim().min(2, "Enter your organization.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  challenge: z
    .string()
    .trim()
    .min(20, "Describe the challenge in at least 20 characters.")
    .max(2000),
});
