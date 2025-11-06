#!/bin/bash

# Script de Inicialização do Ambiente de Desenvolvimento
# MapleBear SAF - Sistema de Gestão de Licenças Canva

echo "🚀 Iniciando ambiente de desenvolvimento MapleBear SAF..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install --legacy-peer-deps
    echo ""
fi

# Verificar se o servidor já está rodando
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Servidor já está rodando na porta 3000"
    echo "   Acesse: http://localhost:3000"
    echo ""
    read -p "Deseja reiniciar o servidor? (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "🔄 Parando servidor existente..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        sleep 2
    else
        exit 0
    fi
fi

# Iniciar servidor de desenvolvimento
echo "✨ Iniciando servidor de desenvolvimento..."
echo "📍 URL: http://localhost:3000"
echo "🔥 Hot reload ativado"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
