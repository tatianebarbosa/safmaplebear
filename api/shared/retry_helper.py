"""
Módulo de Retry Logic com Backoff Exponencial
==============================================

Fornece decoradores e funções para retry automático de operações que podem falhar.
"""

import logging
import time
import asyncio
from functools import wraps
from typing import Callable, TypeVar, Any, Optional, Tuple, Type


T = TypeVar('T')


def retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    on_retry: Optional[Callable[[Exception, int, float], None]] = None
):
    """
    Decorator para retry com backoff exponencial (funções síncronas).
    
    Args:
        max_retries: Número máximo de tentativas
        base_delay: Delay inicial em segundos
        max_delay: Delay máximo em segundos
        exponential_base: Base para cálculo exponencial
        exceptions: Tupla de exceções que devem acionar retry
        on_retry: Callback opcional chamado em cada retry
    
    Example:
        @retry_with_backoff(max_retries=3, base_delay=1.0)
        def my_function():
            # código que pode falhar
            pass
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                
                except exceptions as e:
                    last_exception = e
                    
                    if attempt == max_retries - 1:
                        # Última tentativa, propaga a exceção
                        logging.error(
                            f"❌ Função '{func.__name__}' falhou após {max_retries} tentativas: {str(e)}"
                        )
                        raise
                    
                    # Calcula o delay com backoff exponencial
                    delay = min(base_delay * (exponential_base ** attempt), max_delay)
                    
                    logging.warning(
                        f"⚠️  Tentativa {attempt + 1}/{max_retries} da função '{func.__name__}' falhou: {str(e)}. "
                        f"Tentando novamente em {delay:.1f}s..."
                    )
                    
                    # Chama callback se fornecido
                    if on_retry:
                        on_retry(e, attempt + 1, delay)
                    
                    # Aguarda antes de tentar novamente
                    time.sleep(delay)
            
            # Não deveria chegar aqui, mas por segurança
            if last_exception:
                raise last_exception
        
        return wrapper
    return decorator


def async_retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    on_retry: Optional[Callable[[Exception, int, float], None]] = None
):
    """
    Decorator para retry com backoff exponencial (funções assíncronas).
    
    Args:
        max_retries: Número máximo de tentativas
        base_delay: Delay inicial em segundos
        max_delay: Delay máximo em segundos
        exponential_base: Base para cálculo exponencial
        exceptions: Tupla de exceções que devem acionar retry
        on_retry: Callback opcional chamado em cada retry
    
    Example:
        @async_retry_with_backoff(max_retries=3, base_delay=1.0)
        async def my_async_function():
            # código assíncrono que pode falhar
            pass
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                
                except exceptions as e:
                    last_exception = e
                    
                    if attempt == max_retries - 1:
                        # Última tentativa, propaga a exceção
                        logging.error(
                            f"❌ Função assíncrona '{func.__name__}' falhou após {max_retries} tentativas: {str(e)}"
                        )
                        raise
                    
                    # Calcula o delay com backoff exponencial
                    delay = min(base_delay * (exponential_base ** attempt), max_delay)
                    
                    logging.warning(
                        f"⚠️  Tentativa {attempt + 1}/{max_retries} da função '{func.__name__}' falhou: {str(e)}. "
                        f"Tentando novamente em {delay:.1f}s..."
                    )
                    
                    # Chama callback se fornecido
                    if on_retry:
                        on_retry(e, attempt + 1, delay)
                    
                    # Aguarda antes de tentar novamente
                    await asyncio.sleep(delay)
            
            # Não deveria chegar aqui, mas por segurança
            if last_exception:
                raise last_exception
        
        return wrapper
    return decorator


class RetryableOperation:
    """
    Classe para executar operações com retry de forma explícita.
    
    Example:
        operation = RetryableOperation(max_retries=3, base_delay=1.0)
        result = operation.execute(my_function, arg1, arg2, kwarg1=value1)
    """
    
    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        exceptions: Tuple[Type[Exception], ...] = (Exception,)
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.exceptions = exceptions
    
    def execute(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Executa a função com retry."""
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                return func(*args, **kwargs)
            
            except self.exceptions as e:
                last_exception = e
                
                if attempt == self.max_retries - 1:
                    logging.error(
                        f"❌ Operação '{func.__name__}' falhou após {self.max_retries} tentativas: {str(e)}"
                    )
                    raise
                
                delay = min(self.base_delay * (self.exponential_base ** attempt), self.max_delay)
                
                logging.warning(
                    f"⚠️  Tentativa {attempt + 1}/{self.max_retries} falhou: {str(e)}. "
                    f"Tentando novamente em {delay:.1f}s..."
                )
                
                time.sleep(delay)
        
        if last_exception:
            raise last_exception
    
    async def execute_async(self, func: Callable[..., Any], *args, **kwargs) -> Any:
        """Executa a função assíncrona com retry."""
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                return await func(*args, **kwargs)
            
            except self.exceptions as e:
                last_exception = e
                
                if attempt == self.max_retries - 1:
                    logging.error(
                        f"❌ Operação assíncrona '{func.__name__}' falhou após {self.max_retries} tentativas: {str(e)}"
                    )
                    raise
                
                delay = min(self.base_delay * (self.exponential_base ** attempt), self.max_delay)
                
                logging.warning(
                    f"⚠️  Tentativa {attempt + 1}/{self.max_retries} falhou: {str(e)}. "
                    f"Tentando novamente em {delay:.1f}s..."
                )
                
                await asyncio.sleep(delay)
        
        if last_exception:
            raise last_exception


# Exemplo de uso
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    # Exemplo 1: Decorator síncrono
    @retry_with_backoff(max_retries=3, base_delay=0.5)
    def funcao_que_pode_falhar():
        import random
        if random.random() < 0.7:  # 70% de chance de falhar
            raise ValueError("Erro simulado!")
        return "Sucesso!"
    
    try:
        resultado = funcao_que_pode_falhar()
        print(f"✅ Resultado: {resultado}")
    except Exception as e:
        print(f"❌ Falhou: {e}")
    
    # Exemplo 2: Decorator assíncrono
    @async_retry_with_backoff(max_retries=3, base_delay=0.5)
    async def funcao_async_que_pode_falhar():
        import random
        if random.random() < 0.7:
            raise ValueError("Erro assíncrono simulado!")
        return "Sucesso assíncrono!"
    
    async def teste_async():
        try:
            resultado = await funcao_async_que_pode_falhar()
            print(f"✅ Resultado assíncrono: {resultado}")
        except Exception as e:
            print(f"❌ Falhou: {e}")
    
    # asyncio.run(teste_async())
    
    # Exemplo 3: Classe RetryableOperation
    operation = RetryableOperation(max_retries=3, base_delay=0.5)
    
    def outra_funcao():
        import random
        if random.random() < 0.7:
            raise ValueError("Erro na operação!")
        return "Operação bem-sucedida!"
    
    try:
        resultado = operation.execute(outra_funcao)
        print(f"✅ Resultado da operação: {resultado}")
    except Exception as e:
        print(f"❌ Operação falhou: {e}")
