import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Essa função vai checar se o usuário tem cookie válido
  return await updateSession(request)
}

// Configura em quais páginas esse "guarda-costas" deve rodar
export const config = {
  matcher: [
    /*
     * Roda o middleware em todas as páginas e APIs, EXCETO:
     * - arquivos dentro de _next/static e _next/image
     * - favicon.ico e imagens estáticas
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
