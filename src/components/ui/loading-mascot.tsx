import React from 'react';
import { Mascot } from './mascot';
import { MascotUsage } from '@/assets/maplebear';
import { cn } from '@/lib/utils';

interface LoadingMascotProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Componente LoadingMascot
 * 
 * Exibe o mascote da Maple Bear com animação de loading.
 * Ideal para telas de carregamento e processamento.
 * 
 * @example
 * import { LoadingMascot } from '@/components/ui/loading-mascot';
 * 
 * <LoadingMascot message="Carregando dados..." size="lg" />
 */
export const LoadingMascot: React.FC<LoadingMascotProps> = ({
  message = 'Carregando...',
  size = 'lg',
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="animate-bounce">
        <Mascot
          src={MascotUsage.loading}
          size={size}
          alt="Carregando..."
        />
      </div>
      
      {message && (
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">{message}</p>
          <div className="flex gap-1 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingMascot;
