import Joi from "joi";

export type SignInFormState = {
  email: string;
  password: string;
};

export const signInSchema = Joi.object<SignInFormState>({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    "string.empty": "Email is required.",
    "string.email": "Enter a valid email address.",
  }),
  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required.",
    "string.min": "Password must be at least 8 characters.",
  }),
});
