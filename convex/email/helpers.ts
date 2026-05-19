export function getEmailTemplate(purpose: string, otpString: string) {
    if (purpose === "password_reset") {
        return {
            subject: "Reset Your Litloop Password",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #111827;">
                    <h2 style="color: #DC2626;">Password Reset Request</h2>
                    <p>We received a request to reset the password for your Litloop account.</p>
                    <p>Use the code below to set a new password:</p>
                    <div style="background-color: #FEF2F2; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px solid #FECACA;">
                        <h1 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #991B1B;">${otpString}</h1>
                    </div>
                    <p style="color: #6B7280; font-size: 14px;">This code will expire in 10 minutes.</p>
                    <p style="color: #6B7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                </div>
            `,
        };
    }

    // Default: signup verification
    return {
        subject: "Your Litloop Verification Code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #111827;">
                <h2 style="color: #4F46E5;">Welcome to Litloop!</h2>
                <p>You recently requested a one-time passcode to sign up or verify your account.</p>
                <p>Your verification code is:</p>
                <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                    <h1 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #1F2937;">${otpString}</h1>
                </div>
                <p style="color: #6B7280; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please safely ignore this email.</p>
            </div>
        `,
    };
}
