import Link from "next/link";

export default function Home() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-4">Bem-vindo ao seu Clone do Monday</h1>
      <p className="text-slate-500 mb-8">
        Para ver o sistema funcionando, acesse o painel principal do quadro.
      </p>
      
      <Link 
        href="/boards/1" 
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Acessar Meu Quadro (Board)
      </Link>
    </div>
  );
}
