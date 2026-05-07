export function parseLoginError(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { message?: string } } };
  const status = e?.response?.status;
  const msg = e?.response?.data?.message ?? '';

  if (status === 403) {
    return msg || "Obuna muddati tugagan. Iltimos, superadmin bilan bog'laning";
  }

  if (msg.includes('bloklangan') || msg.includes('inactive')) {
    return "Hisobingiz bloklangan. Administrator bilan bog'laning";
  }

  if (msg.includes("noto'g'ri") || msg.includes('credentials') || msg.includes('not found')) {
    return "Telefon raqam yoki parol noto'g'ri";
  }

  if (msg.includes('markazga kira olmaysiz')) {
    return 'Siz bu markazga kira olmaysiz';
  }

  return msg || 'Kirish jarayonida xatolik yuz berdi';
}
