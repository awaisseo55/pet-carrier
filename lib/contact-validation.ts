/**
 * Pure validation for the contact form, kept separate from the route
 * handler so it's easy to unit test without mocking Next's Request/Response.
 */

export interface ContactValidationResult {
  valid: boolean;
  error?: string;
  data?: { name: string; email: string; message: string };
}

const NAME_MAX = 100;
const EMAIL_MAX = 200;
const MESSAGE_MAX = 5000;
const MESSAGE_MIN = 10;

export function validateContactForm(input: { name?: unknown; email?: unknown; message?: unknown }): ContactValidationResult {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!name || !email || !message) {
    return { valid: false, error: "Please fill in every field." };
  }
  if (name.length > NAME_MAX) {
    return { valid: false, error: "Your name is too long." };
  }
  if (email.length > EMAIL_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: "Please provide a valid email address." };
  }
  if (message.length < MESSAGE_MIN) {
    return { valid: false, error: "Please provide a few more details in your message." };
  }
  if (message.length > MESSAGE_MAX) {
    return { valid: false, error: "Your message is too long." };
  }

  return { valid: true, data: { name, email: email.toLowerCase(), message } };
}
