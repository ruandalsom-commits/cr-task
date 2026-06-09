'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LogOut, Upload, User, Image as ImageIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';

export function UserProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', () => setIsOpen(false));
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, []);

  const handleOpen = () => {
    if (buttonRef.current) {
      setRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para o upload.');
      }

      const file = event.target.files[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload na storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Pegar URL pública
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Atualizar profile
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, email: user.email, avatar_url: avatarUrl },
          { onConflict: 'id' }
        );

      if (updateError) {
        throw updateError;
      }

      setProfile({ ...profile, avatar_url: avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['workspace_users'] });
    } catch (error: any) {
      alert(error.message || 'Erro ao fazer upload do avatar!');
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = profile?.avatar_url || (email ? `https://api.dicebear.com/7.x/notionists/svg?seed=${email}` : null);
  const firstLetter = email ? email.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={handleOpen}
        className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold border border-white/20 overflow-hidden hover:ring-2 ring-blue-400 transition-all cursor-pointer relative"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          firstLetter
        )}
      </button>

      {isOpen && rect && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] w-[260px] bg-white rounded-xl shadow-xl border border-slate-200 p-2 text-left animate-in fade-in zoom-in duration-150"
          style={{ bottom: window.innerHeight - rect.bottom - 10, left: rect.right + 16 }}
        >
          <div className="p-3 border-b border-slate-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{email.split('@')[0]}</p>
              <p className="text-xs text-slate-500 truncate">{email}</p>
            </div>
          </div>

          <div className="p-2 flex flex-col gap-1">
            <label className="flex items-center gap-3 w-full p-2 hover:bg-slate-50 rounded-lg text-sm text-slate-700 transition-colors cursor-pointer">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              <span>{uploading ? 'Enviando...' : 'Alterar foto de perfil'}</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={uploadAvatar} 
                disabled={uploading}
                className="hidden" 
              />
            </label>
            
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-sm text-slate-700 transition-colors mt-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
