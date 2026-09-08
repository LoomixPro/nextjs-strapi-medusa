import { z } from "zod"

// Persian phone number regex: 09xxxxxxxxx (11 digits starting with 09)
const persianPhoneRegex = /^09\d{9}$/

export const createContactFormSchema = (t: (key: string) => string) => {
  return z.object({
    first_name: z
      .string()
      .min(2, t("Contact.validation.firstNameMin"))
      .max(50, t("Contact.validation.firstNameMax")),

    last_name: z
      .string()
      .min(2, t("Contact.validation.lastNameMin"))
      .max(50, t("Contact.validation.lastNameMax")),

    email: z.string().email(t("Contact.validation.emailInvalid")),

    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || persianPhoneRegex.test(val),
        t("Contact.validation.phoneInvalid")
      ),

    subject: z.enum(
      [
        "order",
        "product",
        "shipping",
        "return",
        "payment",
        "feedback",
        "other",
      ],
      {
        message: t("Contact.validation.subjectRequired"),
      }
    ),

    order_number: z.string().optional(),

    message: z
      .string()
      .min(10, t("Contact.validation.messageMin"))
      .max(1000, t("Contact.validation.messageMax")),
  })
}

export type ContactFormData = z.infer<
  ReturnType<typeof createContactFormSchema>
>
