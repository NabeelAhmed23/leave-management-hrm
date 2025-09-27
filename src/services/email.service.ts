import nodemailer from "nodemailer";
import handlebars from "handlebars";
import { promises as fs } from "fs";
import path from "path";
import { logger } from "@/services/logger.service";
import { AppError } from "@/utils/app-error";

// Email configuration interface
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Email template data interface
export interface EmailTemplateData {
  [key: string]: string | number | boolean | undefined;
}

// Email service class
export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor() {
    this.config = this.getEmailConfig();
    this.transporter = this.createTransporter();
  }

  /**
   * Get email configuration from environment variables
   */
  private getEmailConfig(): EmailConfig {
    const requiredEnvVars = [
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASS",
      "SMTP_FROM",
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new AppError(
          `Missing required environment variable: ${envVar}`,
          500
        );
      }
    }

    return {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT!, 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
      from: process.env.SMTP_FROM!,
    };
  }

  /**
   * Create nodemailer transporter
   */
  private createTransporter(): nodemailer.Transporter {
    const transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection configuration
    transporter.verify((error: Error | null) => {
      if (error) {
        logger.error("Email transporter verification failed:", { error });
      } else {
        logger.info("Email service is ready to send messages");
      }
    });

    return transporter;
  }

  /**
   * Load and compile email template
   */
  private async loadTemplate(
    templateName: string
  ): Promise<handlebars.TemplateDelegate> {
    try {
      const templatePath = path.join(
        process.cwd(),
        "src",
        "templates",
        "emails",
        `${templateName}.hbs`
      );

      const templateContent = await fs.readFile(templatePath, "utf-8");
      return handlebars.compile(templateContent);
    } catch (error) {
      logger.error(`Failed to load email template: ${templateName}`, {
        error: error as Error,
      });
      throw new AppError(`Email template not found: ${templateName}`, 500);
    }
  }

  /**
   * Send email using template
   */
  public async sendTemplateEmail(
    to: string,
    subject: string,
    templateName: string,
    templateData: EmailTemplateData
  ): Promise<void> {
    try {
      logger.info(
        `Preparing to send email to: ${to} using template: ${templateName}`
      );

      // Load and compile template
      const template = await this.loadTemplate(templateName);
      const htmlContent = template(templateData);

      // Email options
      const mailOptions = {
        from: this.config.from,
        to,
        subject,
        html: htmlContent,
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent successfully to ${to}`, {
        messageId: info.messageId,
        template: templateName,
      });
    } catch (error) {
      logger.error(`Failed to send email to ${to}`, {
        error: error as Error,
        template: templateName,
      });
      throw new AppError("Failed to send email", 500);
    }
  }

  /**
   * Send password reset email
   */
  public async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    firstName: string
  ): Promise<void> {
    const templateData = {
      firstName,
      resetUrl,
      appName: process.env.APP_NAME || "Leave Management System",
      supportEmail: process.env.SUPPORT_EMAIL || this.config.from,
      expiryMinutes: 30,
    };

    await this.sendTemplateEmail(
      email,
      "Reset Your Password",
      "password-reset",
      templateData
    );

    logger.info(`Password reset email sent to: ${email}`);
  }

  /**
   * Send password reset confirmation email
   */
  public async sendPasswordResetConfirmationEmail(
    email: string,
    firstName: string
  ): Promise<void> {
    const templateData = {
      firstName,
      appName: process.env.APP_NAME || "Leave Management System",
      supportEmail: process.env.SUPPORT_EMAIL || this.config.from,
      loginUrl: `${process.env.APP_URL}/login`,
    };

    await this.sendTemplateEmail(
      email,
      "Password Reset Successful",
      "password-reset-confirmation",
      templateData
    );

    logger.info(`Password reset confirmation email sent to: ${email}`);
  }

  /**
   * Test email configuration
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info("Email service connection test successful");
      return true;
    } catch (error) {
      logger.error("Email service connection test failed:", {
        error: error as Error,
      });
      return false;
    }
  }
}

// Create singleton instance
export const emailService = new EmailService();
