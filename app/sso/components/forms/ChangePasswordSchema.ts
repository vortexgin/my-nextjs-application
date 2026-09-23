import Joi from "joi";

export type ChangePasswordFormState = {
  oldPassword: string;
  newPassword: string;
  repeatNewPassword: string;
};

export const changePasswordSchema = Joi.object<ChangePasswordFormState>({
  oldPassword: Joi.string().required().messages({
    "string.empty": "Old password is required.",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.empty": "New password is required.",
    "string.min": "New password must be at least 6 characters.",
  }),
  repeatNewPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Passwords do not match.",
    "string.empty": "Repeat new password is required.",
  }),
});
