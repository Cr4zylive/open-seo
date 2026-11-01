import { z } from "zod";
import {
  HOSTED_PASSWORD_MAX_LENGTH,
  HOSTED_PASSWORD_MIN_LENGTH,
} from "@/lib/auth-options";

export const passwordSchema = z
  .string()
  .min(
    HOSTED_PASSWORD_MIN_LENGTH,
    `密码至少需要 ${HOSTED_PASSWORD_MIN_LENGTH} 个字符。`,
  )
  .max(
    HOSTED_PASSWORD_MAX_LENGTH,
    `密码最多 ${HOSTED_PASSWORD_MAX_LENGTH} 个字符。`,
  );
