import { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

interface AvatarUploadProps {
  playerId: string;
  hasAvatar: boolean;
  onUpload: (base64: string) => void;
  nickname: string;
  username: string;
}

export default function AvatarUpload({ playerId, hasAvatar, onUpload, nickname, username }: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (hasAvatar) {
      api.getAvatar(playerId).then(setPreview);
    }
  }, [hasAvatar, playerId]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.8));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }
    
    try {
      const base64 = await compressImage(file);
      setPreview(base64);
      onUpload(base64);
    } catch {
      toast.error('Erro ao processar imagem.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => fileRef.current?.click()}
        className="relative group bg-transparent border-none cursor-pointer p-0 active:translate-y-1 active:translate-x-1 transition-transform"
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            className="w-32 h-32 object-cover border-4 border-brutal-black shadow-brutal transition-all group-active:shadow-none"
          />
        ) : (
          <div className="w-32 h-32 border-4 border-brutal-black bg-brutal-green flex items-center justify-center text-brutal-black text-5xl font-black shadow-brutal transition-all group-hover:bg-brutal-yellow group-active:shadow-none">
            {(nickname || username)[0]?.toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-brutal-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2 text-brutal-white">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className="text-brutal-white font-black text-xs uppercase tracking-widest">Alterar foto</span>
        </div>
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <p className="text-xs font-bold text-brutal-black uppercase tracking-widest bg-brutal-white border-2 border-brutal-black px-2 py-1 shadow-brutal-sm mt-2">Clique na foto</p>
    </div>
  );
}
