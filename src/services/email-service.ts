import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Serviço de envio de emails
 */
class EmailService {
  /**
   * Envia código de verificação para alteração de email
   */
  async sendEmailChangeCode(
    email: string,
    username: string,
    code: string
  ): Promise<void> {
    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Código de Verificação - Alteração de Email',
        html: this.getEmailChangeTemplate(username, code),
      });
    } catch (error) {
      console.error('Erro ao enviar email de verificação:', error);
      throw new Error('Falha ao enviar email de verificação');
    }
  }

  /**
   * Envia código de verificação para alteração de senha
   */
  async sendPasswordChangeCode(
    email: string,
    username: string,
    code: string
  ): Promise<void> {
    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Código de Verificação - Alteração de Senha',
        html: this.getPasswordChangeTemplate(username, code),
      });
    } catch (error) {
      console.error('Erro ao enviar email de verificação:', error);
      throw new Error('Falha ao enviar email de verificação');
    }
  }

  /**
   * Template HTML para alteração de email
   */
  private getEmailChangeTemplate(username: string, code: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Gtracker Forum</h1>
              <p>Alteração de Email</p>
            </div>
            <div class="content">
              <p>Olá, <strong>${username}</strong>!</p>
              <p>Você solicitou a alteração do seu email. Use o código abaixo para confirmar:</p>
              <div class="code">${code}</div>
              <div class="warning">
                <strong>Atenção:</strong> Este código expira em 15 minutos e só pode ser usado uma vez.
              </div>
              <p>Se você não solicitou esta alteração, ignore este email. Sua conta permanecerá segura.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Gtracker Forum. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Template HTML para alteração de senha
   */
  private getPasswordChangeTemplate(username: string, code: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { background: white; border: 2px dashed #f5576c; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f5576c; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Gtracker Forum</h1>
              <p>Alteração de Senha</p>
            </div>
            <div class="content">
              <p>Olá, <strong>${username}</strong>!</p>
              <p>Você solicitou a alteração da sua senha. Use o código abaixo para confirmar:</p>
              <div class="code">${code}</div>
              <div class="warning">
                <strong>Atenção:</strong> Este código expira em 15 minutos e só pode ser usado uma vez.
              </div>
              <p>Se você não solicitou esta alteração, <strong>entre em contato com o suporte imediatamente</strong>. Sua conta pode estar comprometida.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Gtracker Forum. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
