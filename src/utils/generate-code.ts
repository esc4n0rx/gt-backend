/**
 * Gera um código numérico aleatório
 * @param length Tamanho do código (padrão: 6)
 * @returns Código numérico como string
 */
export const generateCode = (length: number = 6): string => {
  const digits = '0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    code += digits[randomIndex];
  }

  return code;
};

export const generateInviteCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return code;
};

export const generateUniqueInviteCode = async (
  existsCheck: (code: string) => Promise<boolean>
): Promise<string> => {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateInviteCode();
    const exists = await existsCheck(code);
    
    if (!exists) {
      return code;
    }
    
    attempts++;
  } while (attempts < maxAttempts);

  return generateInviteCode() + Date.now().toString(36).slice(-2).toUpperCase();
};