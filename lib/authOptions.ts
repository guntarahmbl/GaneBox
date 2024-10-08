import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import Email from "next-auth/providers/email";
import { z } from "zod";
import { createTransport } from "nodemailer";
import { randomInt } from "crypto";

const prisma = new PrismaClient();
const emailSchema = z.string().email({ message: 'Invalid email format' }) .refine((email) => email.endsWith('@mahasiswa.itb.ac.id'), { message: 'Email must end with @mahasiswa.itb.ac.id',});

export const authOptions:NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
      Email({
        server: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        },
        from: process.env.SMTP_FROM,
        maxAge: 6 * 60, // 6 minutes
        async generateVerificationToken() {
          return gernerateOTP().toString()
        },
        async sendVerificationRequest({
          identifier: email,
          token,
          url,
          provider: { server, from },
        }) {
          const { host } = new URL(url)
          const transport = createTransport(server)
          await transport.sendMail({
            to: email,
            from,
            subject: `Sign in to ${host}`,
            text: text({ token, host }),
            html: html({ token, host }),
          })
        }
      }),
    ],
    pages: {
      signIn : "/"
    },
    callbacks: {
      async signIn({ user }) {
        try {
          await emailSchema.parseAsync(user.email);
          return true;
        } catch (error) {
          return false
        }
      },
    },
      // pages: {
    //   signIn: "api/auth/signin", // Use the custom sign-in page path
    // }
}

function gernerateOTP() {
  return randomInt(100000, 999999);
};

function html(params: { token: string; host: string; }) {
  const { token, host } = params

  const escapedHost = host.replace(/\./g, "&#8203;.")

  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
  }

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Sign in to <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center"><strong>Sign in code:</strong> ${token}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Keep in mind that this code will expire after <strong><em>3 minutes</em></strong>. If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
  `;
}

function text(params: { token: string, host: string }) {
  return `
  Sign in to ${params.host}
  
  Sign in code: ${params.token}
  
  Keep in mind that this code will expire after 6 minutes. If you did not request this email you can safely ignore it.
  `;
}