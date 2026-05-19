import { v } from "convex/values";
import { Resend } from "resend";
import { internalAction } from "../_generated/server";
import { getEmailTemplate } from "./helpers";

export const sendOTP = internalAction({
    args: {
        email: v.string(),
        otpProvider: v.string(),
        otpString: v.string(),
        purpose: v.optional(v.string()), // "signup" | "password_reset"
    },
    handler: async (ctx, args) => {
        const { email, otpString } = args;
        const purpose = args.purpose ?? "signup";

        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            if (process.env.USE_DEV_OTP === "true") {
                console.warn(`[OTP System] RESEND_API_KEY is not set. Dev OTP mode is enabled for ${email}.`);
                return {
                    status: "mock_delivered",
                    message: "API Key not found, dev OTP mode is enabled.",
                };
            }

            console.error("[OTP System] RESEND_API_KEY is not set. Refusing to deliver OTP.");
            throw new Error("Email delivery is not configured.");
        }

        if (args.otpProvider !== "resend") {
            throw new Error("Unsupported OTP provider.");
        }

        if (!["signup", "password_reset"].includes(purpose)) {
            throw new Error("Unsupported OTP purpose.");
        }

        if (!/^\d{6}$/.test(otpString)) {
            throw new Error("Invalid OTP format.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error("Invalid email address.");
        }

        const template = getEmailTemplate(purpose, otpString);
        const resend = new Resend(apiKey);

        try {
            const data = await resend.emails.send({
                from: "Litloop <noreply@litloop.in>",
                to: [email],
                subject: template.subject,
                html: template.html,
            });
            return {
                status: "delivered",
                message: "Email sent successfully",
                providerId: data.data?.id,
            };
        } catch (error: any) {
            console.error("[OTP System] Failed to send email via Resend:", error);
            throw new Error(`Failed to send verification email: ${error.message}`);
        }
    },
});
