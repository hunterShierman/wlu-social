// server/src/utils/email.ts
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Send verification email
export async function sendVerificationEmail(
  email: string, 
  token: string, 
  username: string
): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const unsubscribeUrl = `${process.env.FRONTEND_URL}/email-preferences`;
  
  const msg = {
    to: email,
    from: process.env.EMAIL_USER!, // Must be verified in SendGrid
    subject: 'Verify Your WLU Connect Account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background-color: #7c3aed; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .footer a { color: #7c3aed; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to WLU Connect!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${username}</strong>,</p>
              <p>Thank you for signing up! Please verify your email address to activate your account.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button" style="background-color: #7c3aed; color: white;">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #7c3aed;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>WLU Connect - Connecting Laurier Students</p>
              <p>Wilfrid Laurier University, 75 University Ave W, Waterloo, ON N2L 3C5</p>
              <p><a href="${unsubscribeUrl}">Email Preferences</a></p>
              <p>&copy; ${new Date().getFullYear()} WLU Connect. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to WLU Connect!

Hi ${username},

Thank you for signing up! Please verify your email address to activate your account.

Click here to verify: ${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

---
WLU Connect - Connecting Laurier Students
Wilfrid Laurier University, 75 University Ave W, Waterloo, ON N2L 3C5

Email Preferences: ${unsubscribeUrl}
© ${new Date().getFullYear()} WLU Connect. All rights reserved.
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('SendGrid error:', error);
    throw new Error('Failed to send verification email');
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string, 
  token: string, 
  username: string
): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const unsubscribeUrl = `${process.env.FRONTEND_URL}/email-preferences`;
  
  const msg = {
    to: email,
    from: process.env.EMAIL_USER!,
    subject: 'Reset Your WLU Connect Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background-color: #7c3aed; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .footer a { color: #7c3aed; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${username}</strong>,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button" style="background-color: #7c3aed; color: white;">Reset Password</a>
              </p>
              <p>Or copy and paste this link:</p>
              <p style="word-break: break-all; color: #7c3aed;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>WLU Connect - Connecting Laurier Students</p>
              <p>Wilfrid Laurier University, 75 University Ave W, Waterloo, ON N2L 3C5</p>
              <p><a href="${unsubscribeUrl}">Email Preferences</a></p>
              <p>&copy; ${new Date().getFullYear()} WLU Connect. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Password Reset Request

Hi ${username},

We received a request to reset your password. Click the link below to create a new password:

Reset your password: ${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

---
WLU Connect - Connecting Laurier Students
Wilfrid Laurier University, 75 University Ave W, Waterloo, ON N2L 3C5

Email Preferences: ${unsubscribeUrl}
© ${new Date().getFullYear()} WLU Connect. All rights reserved.
    `,
  };

  await sgMail.send(msg);
}