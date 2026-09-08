import { createContactFormSchema } from "./contact-form-schema"

// Simple mock translator — returns the key itself
const mockT = (key: string) => key

describe("contact-form-schema validation", () => {
  const schema = createContactFormSchema(mockT)

  describe("first_name", () => {
    it("should accept valid first name", () => {
      const data = validForm()
      expect(() => schema.parse(data)).not.toThrow()
    })

    it("should reject first name shorter than 2 characters", () => {
      const data = validForm({ first_name: "A" })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject first name longer than 50 characters", () => {
      const data = validForm({ first_name: "A".repeat(51) })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe("last_name", () => {
    it("should accept valid last name", () => {
      const data = validForm({ last_name: "Mohammadi" })
      expect(() => schema.parse(data)).not.toThrow()
    })

    it("should reject last name shorter than 2 characters", () => {
      const data = validForm({ last_name: "A" })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject last name longer than 50 characters", () => {
      const data = validForm({ last_name: "B".repeat(51) })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe("email", () => {
    it("should accept valid email", () => {
      const data = validForm({ email: "test@example.com" })
      expect(() => schema.parse(data)).not.toThrow()
    })

    it("should reject invalid email", () => {
      const data = validForm({ email: "not-an-email" })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject empty email", () => {
      const data = validForm({ email: "" })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe("phone", () => {
    it("should accept valid Iranian phone number", () => {
      const data = validForm({ phone: "09123456789" })
      expect(() => schema.parse(data)).not.toThrow()
    })

    it("should accept empty phone (optional field)", () => {
      const data = validForm({ phone: "" })
      // Empty string should pass the refine since !val is true
      expect(() => schema.parse(data)).not.toThrow()
    })

    it("should accept undefined phone (optional field)", () => {
      const data = validForm()
      delete (data as any).phone
      expect(() => schema.parse(data)).not.toThrow()
    })

    it("should reject phone with wrong format", () => {
      const data = validForm({ phone: "1234567890" })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject phone too short", () => {
      const data = validForm({ phone: "0912345" })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject phone too long", () => {
      const data = validForm({ phone: "091234567890" })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject phone not starting with 09", () => {
      const data = validForm({ phone: "08123456789" })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe("subject", () => {
    const validSubjects = [
      "order",
      "product",
      "shipping",
      "return",
      "payment",
      "feedback",
      "other",
    ]

    it.each(validSubjects)("should accept valid subject: %s", (subject) => {
      const data = validForm({ subject })
      expect(() => schema.parse(data)).not.toThrow()
    })

    it("should reject invalid subject", () => {
      const data = validForm({ subject: "invalid_subject" })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe("message", () => {
    it("should accept message with 10+ characters", () => {
      const data = validForm({ message: "This is a valid message" })
      expect(() => schema.parse(data)).not.toThrow()
    })

    it("should reject message shorter than 10 characters", () => {
      const data = validForm({ message: "Short" })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject message longer than 1000 characters", () => {
      const data = validForm({ message: "A".repeat(1001) })
      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should accept message exactly 10 characters", () => {
      const data = validForm({ message: "A".repeat(10) })
      expect(() => schema.parse(data)).not.toThrow()
    })

    it("should accept message exactly 1000 characters", () => {
      const data = validForm({ message: "A".repeat(1000) })
      expect(() => schema.parse(data)).not.toThrow()
    })
  })

  describe("order_number", () => {
    it("should accept order number when provided", () => {
      const data = validForm({ order_number: "ORD-12345" })
      expect(() => schema.parse(data)).not.toThrow()
    })

    it("should accept missing order number (optional)", () => {
      const data = validForm()
      delete (data as any).order_number
      expect(() => schema.parse(data)).not.toThrow()
    })
  })

  describe("full form validation", () => {
    it("should accept a fully valid form", () => {
      const data = validForm()
      expect(() => schema.parse(data)).not.toThrow()
    })

    it("should return parsed data matching input", () => {
      const data = validForm()
      const parsed = schema.parse(data)
      expect(parsed.first_name).toBe(data.first_name)
      expect(parsed.email).toBe(data.email)
      expect(parsed.subject).toBe(data.subject)
    })
  })
})

// Helper to create a valid form object, with optional overrides
function validForm(overrides: Record<string, any> = {}) {
  return {
    first_name: "Ali",
    last_name: "Mohammadi",
    email: "ali@example.com",
    phone: "09123456789",
    subject: "order",
    order_number: "",
    message: "Hello, I want to track my order please.",
    ...overrides,
  }
}
