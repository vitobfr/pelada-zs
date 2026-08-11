import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface AvatarProps {
  id: string;
  className?: string;
  fallback?: string;
}

export function Avatar({ id, className = '', fallback = '?' }: AvatarProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.getAvatar(id).then(base64 => {
      if (active && base64) setSrc(base64);
    });
    return () => { active = false; };
  }, [id]);

  if (src) {
    return <img src={src} alt="" className={`object-cover ${className}`} />;
  }

  return (
    <div className={`flex items-center justify-center font-black uppercase flex-shrink-0 bg-brutal-green text-brutal-black ${className}`}>
      {fallback}
    </div>
  );
}
