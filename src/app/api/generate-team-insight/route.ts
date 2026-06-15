import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { userStats, totalTasks, completedTasks, pendingTasks } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Chave da API do Gemini não configurada' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `Você é um assistente sênior de gestão de equipe em um sistema estilo Monday.com. 
    O gestor pediu um resumo analítico do desempenho da equipe.
    
    Aqui estão os dados gerais:
    - Total de tarefas: ${totalTasks}
    - Concluídas: ${completedTasks}
    - Pendentes: ${pendingTasks}

    Estatísticas por colaborador (Top 10):
    ${JSON.stringify(userStats, null, 2)}

    Escreva um resumo executivo de 2 parágrafos.
    No primeiro parágrafo, dê um panorama geral da saúde do projeto baseado na proporção de feitas/pendentes e cite quem são os destaques positivos (quem mais concluiu).
    No segundo parágrafo, aponte os possíveis gargalos (quem tem muitas tarefas pendentes e pode estar sobrecarregado) e sugira uma ação para o gestor.
    Seja claro, profissional e vá direto ao ponto.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Salvar no banco
    const { data, error } = await supabase.from('ai_insights').insert([
      { summary_text: responseText, type: 'team_summary' }
    ]).select();

    if (error) {
      console.error('Erro ao salvar no supabase:', error);
      throw error;
    }

    return NextResponse.json({ success: true, insight: data[0] });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
