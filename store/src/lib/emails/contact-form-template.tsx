import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from "@react-email/components"
import * as React from "react"
import { ContactFormData } from "@lib/validations/contact-form-schema"

interface ContactFormEmailProps {
  data: ContactFormData
  translations?: Record<string, string>
}

export const ContactFormEmail = ({
  data,
  translations = {},
}: ContactFormEmailProps) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    subject,
    order_number,
    message,
  } = data

  return (
    <Html>
      <Head />
      <Preview>{translations.preview || `New message: ${subject}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {translations.title || "New Contact Form Message"}
          </Heading>

          <Text style={text}>
            {translations.subtitle || "You have received a new message:"}
          </Text>

          <Section style={section}>
            <Text style={label}>{translations.name || "Name:"}</Text>
            <Text style={value}>
              {first_name} {last_name}
            </Text>

            <Text style={label}>{translations.email || "Email:"}</Text>
            <Text style={value}>
              <Link href={`mailto:${email}`} style={link}>
                {email}
              </Link>
            </Text>

            {phone && (
              <>
                <Text style={label}>{translations.phone || "Phone:"}</Text>
                <Text style={value}>{phone}</Text>
              </>
            )}

            <Text style={label}>{translations.subject || "Subject:"}</Text>
            <Text style={value}>{subject}</Text>

            {order_number && (
              <>
                <Text style={label}>
                  {translations.order_number || "Order Number:"}
                </Text>
                <Text style={value}>{order_number}</Text>
              </>
            )}
          </Section>

          <Section style={messageSection}>
            <Text style={label}>{translations.message || "Message:"}</Text>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            {translations.footer || "This is an automated message."}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  direction: "rtl" as const,
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 40px 40px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
  maxWidth: "600px",
  marginTop: "40px",
  marginBottom: "40px",
}

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
  textAlign: "right" as const,
}

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 20px",
  textAlign: "right" as const,
}

const section = {
  backgroundColor: "#f9fafb",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "24px",
  textAlign: "right" as const,
}

const label = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 4px",
}

const value = {
  color: "#111827",
  fontSize: "16px",
  margin: "0 0 16px",
}

const link = {
  color: "#2563eb",
  textDecoration: "none",
}

const messageSection = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "24px",
  textAlign: "right" as const,
}

const messageText = {
  color: "#111827",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
}

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
}

const footer = {
  color: "#9ca3af",
  fontSize: "14px",
  lineHeight: "24px",
  textAlign: "center" as const,
}

export default ContactFormEmail
