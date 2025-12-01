import React from 'react';
import { cn } from '@/lib/utils';

interface MascotProps {
  src: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

/**
 * Componente Mascot
 * 
 * Exibe os mascotes da Maple Bear com tamanhos padronizados e animaes opcionais.
 * 
 * @example
 * import { Mascot } from '@/components/ui/mascot';
 * import { BearWaving } from '@/assets/maplebear';
 * 
 * <Mascot src={BearWaving} size="lg" animated />
 */
export const Mascot: React.FC<MascotProps> = ({
  src,
  alt = 'Maple Bear Mascot',
  size = 'md',
  className,
  animated = false,
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          sizeClasses[size],
          'object-contain',
          animated && 'animate-bounce'
        )}
      />
    </div>
  );
};

export default Mascot;
