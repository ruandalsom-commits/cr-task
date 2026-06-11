import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Usa a chave Service Role (que tem poder de admin) para conseguir ler todas as tarefas de todos os workspaces
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANTE: Precisa configurar no .env.local
);

export async function GET(request: Request) {
  try {
    // Busca todos os usuários
    const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('*');
    if (profilesError) throw profilesError;

    // Busca todas as tarefas
    const { data: tasks, error: tasksError } = await supabaseAdmin.from('tasks').select('*, boards(name)');
    if (tasksError) throw tasksError;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const results = [];

    // Para cada usuário, filtra as tarefas dele
    for (const profile of profiles) {
      if (!profile.email) continue;

      const userTasks = tasks.filter((t: any) => 
        t.assignee_email && 
        t.assignee_email.includes(profile.email) && 
        t.status !== 'Feito' && 
        t.status !== 'Concluído'
      );
      
      if (userTasks.length === 0) continue;

      const overdueTasks = userTasks.filter((t: any) => {
        if (!t.due_date) return false;
        return new Date(t.due_date) < new Date(new Date().setHours(0,0,0,0));
      });

      const todayTasks = userTasks.filter((t: any) => {
        if (!t.due_date) return false;
        return new Date(t.due_date).toDateString() === new Date().toDateString();
      });

      // Se não tiver nada atrasado ou pra hoje, nem manda e-mail para não encher a caixa
      if (overdueTasks.length === 0 && todayTasks.length === 0) continue;

      const html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #0073ea; margin-bottom: 5px;">Seu Resumo Diário</h2>
          <p style="margin-top: 0; color: #666;">Olá! Aqui está o resumo das suas tarefas no Master Delivery Express.</p>
          
          ${overdueTasks.length > 0 ? `
            <div style="background-color: #ffe6e6; padding: 15px; border-left: 4px solid #ff3333; border-radius: 4px; margin-bottom: 20px;">
              <h3 style="color: #cc0000; margin-top: 0;">🔴 Tarefas Atrasadas (${overdueTasks.length})</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                ${overdueTasks.map((t: any) => `<li><b>${t.title}</b> (Quadro: ${t.boards?.name || 'Desconhecido'})</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${todayTasks.length > 0 ? `
            <div style="background-color: #e6f7ff; padding: 15px; border-left: 4px solid #0073ea; border-radius: 4px; margin-bottom: 20px;">
              <h3 style="color: #0073ea; margin-top: 0;">🔵 Vencem Hoje (${todayTasks.length})</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                ${todayTasks.map((t: any) => `<li><b>${t.title}</b> (Quadro: ${t.boards?.name || 'Desconhecido'})</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <p style="margin-top: 30px; font-size: 12px; color: #999;">
            Este é um e-mail automático enviado pelo seu sistema de gestão.
          </p>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: `"Master Delivery" <${process.env.SMTP_EMAIL}>`,
          to: profile.email,
          subject: `Resumo Diário - Você tem ${overdueTasks.length + todayTasks.length} tarefas precisando de atenção`,
          html,
        });
        results.push({ email: profile.email, status: 'sent' });
      } catch (err) {
        console.error('Erro ao enviar para', profile.email, err);
        results.push({ email: profile.email, status: 'error' });
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error('CRON Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
