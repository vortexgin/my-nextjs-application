import Joi from "joi";

export type ForgotPasswordFormState = {
  email: string;
};

export const forgotPasswordSchema = Joi.object<ForgotPasswordFormState>({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    "string.empty": "Email is required.",
    "string.email": "Enter a valid email address.",
  }),
});
