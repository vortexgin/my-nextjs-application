import Joi from "joi";

export type UpdateProfileFormState = {
  name: string;
  email: string;
  phone_number: string;
};

export const updateProfileSchema = Joi.object<UpdateProfileFormState>({
  name: Joi.string().trim().min(2).required().messages({
    "string.empty": "Name is required.",
    "string.min": "Name must be at least 2 characters.",
  }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    "string.empty": "Email is required.",
    "string.email": "Enter a valid email address.",
  }),
  phone_number: Joi.string().trim().min(6).required().messages({
    "string.empty": "Phone number is required.",
    "string.min": "Phone number must be at least 6 characters.",
  }),
});
