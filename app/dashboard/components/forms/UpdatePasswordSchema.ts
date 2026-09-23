import Joi from "joi";

export type UpdatePasswordFormState = {
  password: string;
  passwordConfirmation: string;
};

export const updatePasswordSchema = Joi.object<UpdatePasswordFormState>({
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required.",
    "string.min": "Password must be at least 6 characters.",
  }),
  passwordConfirmation: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match.",
    "string.empty": "Password confirmation is required.",
  }),
});
