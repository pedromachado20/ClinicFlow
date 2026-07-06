export async function enviarEmail(opts: { to: string; subject: string; html: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Erro Resend ${res.status}`);
  }

  return res.json();
}

export function emailTrialAcabando(nomeClinica: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #1a56db;">Seu teste grátis do ClinicFlow acaba amanhã</h2>
      <p>Olá, ${nomeClinica}!</p>
      <p>Seu período de teste gratuito do ClinicFlow termina <strong>amanhã</strong>. Depois disso, o acesso à clínica fica bloqueado até a assinatura ser ativada.</p>
      <p>Para continuar usando a agenda, prontuários, financeiro e demais módulos sem interrupção, acesse a página de Assinatura e assine o plano.</p>
      <p style="margin-top: 24px;">
        <a href="https://clinicflow.nexusteck.com.br/assinatura" style="background:#1a56db;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Assinar agora</a>
      </p>
      <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">Seus dados continuam guardados mesmo se a assinatura ficar em atraso.</p>
    </div>
  `;
}
