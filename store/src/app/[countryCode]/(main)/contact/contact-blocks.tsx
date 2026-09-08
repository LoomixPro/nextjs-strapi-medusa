"use client"

import React from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@modules/common/components/shadcn/card"
import { Badge } from "@modules/common/components/shadcn/badge"
import { Button } from "@modules/common/components/shadcn/button"
import { Input } from "@modules/common/components/shadcn/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@modules/common/components/shadcn/select"
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createContactFormSchema,
  type ContactFormData,
} from "@lib/validations/contact-form-schema"
import { submitContactForm } from "@lib/data/contact"
import { useTranslations } from "next-intl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Helper function to get icon component
const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Mail,
    Phone,
    MapPin,
    Clock,
    MessageSquare,
  }
  return icons[iconName] || Mail
}

export default function ContactBlocks({ blocks }: { blocks: any[] }) {
  const t = useTranslations()
  const contactFormSchema = createContactFormSchema((key) => t(key))

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  })

  const onSubmit = async (formData: ContactFormData) => {
    try {
      const result = await submitContactForm(formData)

      if (result.success) {
        toast.success(result.message)
        reset()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error(t("Contact.toast.error"))
    }
  }

  const formSettings = blocks.find(
    (b: any) => b.__component === "contact.contact-form-settings"
  )
  const privacyText = formSettings?.privacy_text || ""
  const submitButtonText =
    formSettings?.submit_button_text || t("Contact.form.submit")

  return (
    <div className="space-y-0">
      {blocks.map((block: any, index: number) => {
        switch (block.__component) {
          case "contact.contact-hero":
            return (
              <section
                key={index}
                className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background"
              >
                <div className="container mx-auto px-4 text-center">
                  {block.badge && (
                    <Badge className="mb-4" variant="outline">
                      {block.badge}
                    </Badge>
                  )}
                  <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                    {block.title}
                  </h1>
                  {block.description && (
                    <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                      {block.description}
                    </p>
                  )}
                </div>
              </section>
            )

          case "contact.contact-info-cards":
            return (
              <section key={index} className="py-12 container mx-auto px-4">
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                  {block.cards?.map((item: any, idx: number) => {
                    const IconComponent = getIcon(item.icon_name)
                    return (
                      <Card
                        key={idx}
                        className="hover:shadow-md transition-shadow border border-border/40"
                      >
                        <CardContent className="pt-6 text-center">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <IconComponent className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="font-semibold mb-2">{item.title}</h3>
                          <p className="text-sm font-medium text-foreground">
                            {item.content}
                          </p>
                          {item.sub_content && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.sub_content}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            )

          case "contact.contact-form-info":
            return (
              <section
                key={index}
                className="py-12 md:py-16 container mx-auto px-4"
              >
                <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
                  {/* Left Side - Info */}
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                        {block.title}
                      </h2>
                      {block.description && (
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                          {block.description}
                        </p>
                      )}
                    </div>

                    {block.quick_questions_card && (
                      <Card className="border border-border/40">
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            {(() => {
                              const IconComponent = getIcon(
                                block.quick_questions_card.icon_name
                              )
                              return (
                                <IconComponent className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                              )
                            })()}
                            <div>
                              <h3 className="font-semibold mb-1">
                                {block.quick_questions_card.title}
                              </h3>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {block.quick_questions_card.description}
                              </p>
                              <LocalizedClientLink
                                href={
                                  block.quick_questions_card.button_link || "#"
                                }
                              >
                                <Button
                                  variant="link"
                                  className="px-0 mt-2 h-auto py-1"
                                >
                                  {block.quick_questions_card.button_text}
                                </Button>
                              </LocalizedClientLink>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {block.expectations_list &&
                      block.expectations_list.length > 0 && (
                        <div className="space-y-4">
                          {block.expectations_title && (
                            <h3 className="font-semibold text-lg">
                              {block.expectations_title}
                            </h3>
                          )}
                          <ul className="space-y-3">
                            {block.expectations_list.map(
                              (item: any, idx: number) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-3"
                                >
                                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {item.text}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>

                  {/* Right Side - Form */}
                  <Card className="shadow-sm border border-border/40">
                    <CardContent className="pt-6">
                      <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label
                              className="text-sm font-medium"
                              htmlFor="firstName"
                            >
                              {t("Contact.form.firstName")}
                            </label>
                            <Input
                              id="firstName"
                              placeholder={t(
                                "Contact.form.firstNamePlaceholder"
                              )}
                              {...register("first_name")}
                            />
                            {errors.first_name && (
                              <p className="text-xs text-red-500">
                                {errors.first_name.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label
                              className="text-sm font-medium"
                              htmlFor="lastName"
                            >
                              {t("Contact.form.lastName")}
                            </label>
                            <Input
                              id="lastName"
                              placeholder={t(
                                "Contact.form.lastNamePlaceholder"
                              )}
                              {...register("last_name")}
                            />
                            {errors.last_name && (
                              <p className="text-xs text-red-500">
                                {errors.last_name.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium"
                            htmlFor="email"
                          >
                            {t("Contact.form.email")}
                          </label>
                          <Input
                            id="email"
                            type="email"
                            placeholder={t("Contact.form.emailPlaceholder")}
                            {...register("email")}
                          />
                          {errors.email && (
                            <p className="text-xs text-red-500">
                              {errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium"
                            htmlFor="phone"
                          >
                            {t("Contact.form.phone")}
                          </label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder={t("Contact.form.phonePlaceholder")}
                            dir="ltr"
                            {...register("phone")}
                          />
                          {errors.phone && (
                            <p className="text-xs text-red-500">
                              {errors.phone.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium"
                            htmlFor="subject"
                          >
                            {t("Contact.form.subject")}
                          </label>
                          <Select
                            onValueChange={(value) =>
                              setValue(
                                "subject",
                                value as ContactFormData["subject"]
                              )
                            }
                            value={watch("subject")}
                          >
                            <SelectTrigger id="subject">
                              <SelectValue
                                placeholder={t(
                                  "Contact.form.subjectPlaceholder"
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="order">
                                {t("Contact.form.subjects.order")}
                              </SelectItem>
                              <SelectItem value="product">
                                {t("Contact.form.subjects.product")}
                              </SelectItem>
                              <SelectItem value="shipping">
                                {t("Contact.form.subjects.shipping")}
                              </SelectItem>
                              <SelectItem value="return">
                                {t("Contact.form.subjects.return")}
                              </SelectItem>
                              <SelectItem value="payment">
                                {t("Contact.form.subjects.payment")}
                              </SelectItem>
                              <SelectItem value="feedback">
                                {t("Contact.form.subjects.feedback")}
                              </SelectItem>
                              <SelectItem value="other">
                                {t("Contact.form.subjects.other")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.subject && (
                            <p className="text-xs text-red-500">
                              {errors.subject.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium"
                            htmlFor="orderNumber"
                          >
                            {t("Contact.form.orderNumber")}
                          </label>
                          <Input
                            id="orderNumber"
                            placeholder={t(
                              "Contact.form.orderNumberPlaceholder"
                            )}
                            {...register("order_number")}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium"
                            htmlFor="message"
                          >
                            {t("Contact.form.message")}
                          </label>
                          <textarea
                            id="message"
                            placeholder={t("Contact.form.messagePlaceholder")}
                            rows={6}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            {...register("message")}
                          />
                          {errors.message && (
                            <p className="text-xs text-red-500">
                              {errors.message.message}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className="w-full gap-2"
                          size="lg"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            t("Contact.form.sending")
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              {submitButtonText}
                            </>
                          )}
                        </Button>

                        {privacyText && (
                          <p className="text-xs text-muted-foreground text-center">
                            {privacyText}
                          </p>
                        )}
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </section>
            )

          case "contact.contact-faq-preview":
            return (
              <section key={index} className="py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                  <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                      {block.title}
                    </h2>
                    {block.description && (
                      <p className="text-base md:text-lg text-muted-foreground mb-8">
                        {block.description}
                      </p>
                    )}
                    {block.faq_items && block.faq_items.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-4 mb-8">
                        {block.faq_items.map((item: any, idx: number) => (
                          <Card
                            key={idx}
                            className="text-left hover:shadow-md transition-shadow cursor-pointer border border-border/40"
                          >
                            <CardContent className="pt-4 pb-4">
                              <p className="font-medium text-sm">
                                {item.question}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                    <LocalizedClientLink href={block.button_link || "#"}>
                      <Button className="px-8 py-4">{block.button_text}</Button>
                    </LocalizedClientLink>
                  </div>
                </div>
              </section>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
