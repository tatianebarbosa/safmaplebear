# 🔗 Guia de Integração - Novos Utilitários

## Introdução

Este guia explica como usar os novos utilitários criados durante a revisão de código.

---

## 1️⃣ Cliente HTTP Centralizado (`apiClient.ts`)

### Importar

```typescript
import { apiGet, apiPost, apiPut, apiDelete, apiCall } from "@/lib/apiClient";
```

### GET Request

```typescript
// Simples
const response = await apiGet("/api/users");
if (response.ok) {
  console.log(response.data);
} else {
  console.error(response.error);
}

// Com type
interface User {
  id: string;
  name: string;
}
const response = await apiGet<User>("/api/users/123");
```

### POST Request

```typescript
// Simples
const response = await apiPost("/api/users", {
  name: "João",
  email: "joao@example.com",
});

// Com retry e timeout
const response = await apiPost("/api/users", userData, {
  retries: 3, // Tentar 3 vezes
  timeout: 15000, // 15 segundos
});

// Com tipo de resposta
interface CreateUserResponse {
  id: string;
  created: boolean;
}
const response = await apiPost<CreateUserResponse>("/api/users", userData);
```

### PUT Request

```typescript
const response = await apiPut("/api/users/123", {
  name: "João Silva",
});
```

### DELETE Request

```typescript
const response = await apiDelete("/api/users/123");
```

### Tratamento de Erro Completo

```typescript
try {
  const response = await apiPost("/api/login", credentials, {
    retries: 2,
    timeout: 10000,
  });

  if (!response.ok) {
    // Erro HTTP
    console.error(`Erro ${response.status}: ${response.error}`);
    return null;
  }

  // Sucesso
  return response.data;
} catch (error) {
  // Erro de rede/timeout
  const message = error instanceof Error ? error.message : "Erro desconhecido";
  console.error(message);
  throw error;
}
```

---

## 2️⃣ Constantes de Delay (`constants.ts`)

### Importar

```typescript
import {
  DELAY_API_SIMULATION,
  DELAY_ANIMATION,
  DELAY_PROFILE_UPDATE,
  DELAY_AI_SIMULATION,
  HTTP_TIMEOUT_DEFAULT,
  HTTP_TIMEOUT_LONG,
  AUTO_REFRESH_INTERVAL,
  TIMER_UPDATE_INTERVAL,
} from "@/lib/constants";
```

### Usar em Simulações

```typescript
// Simular delay de API
async function updateProfile() {
  setLoading(true);
  await new Promise((resolve) => setTimeout(resolve, DELAY_PROFILE_UPDATE));
  // Seu código aqui
}

// Simular IA
async function improveText(text) {
  setLoading(true);
  await new Promise((resolve) => setTimeout(resolve, DELAY_AI_SIMULATION));
  // Seu código aqui
}
```

### Usar em Timeouts HTTP

```typescript
const response = await apiPost("/api/data", data, {
  timeout: HTTP_TIMEOUT_LONG, // 30 segundos
});
```

### Usar em Intervals

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    refreshData();
  }, AUTO_REFRESH_INTERVAL); // 30 segundos

  return () => clearInterval(interval);
}, []);
```

---

## 3️⃣ Type-Safe Error Handling

### Padrão Recomendado

```typescript
try {
  const response = await apiGet("/api/data");
  if (!response.ok) {
    throw new Error(response.error);
  }
  return response.data;
} catch (error) {
  // ✅ Type-safe
  const message = error instanceof Error ? error.message : "Erro desconhecido";

  toast.error(message);
  return null;
}
```

### Em Componentes React

```typescript
const MyComponent = () => {
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    try {
      const response = await apiGet("/api/data");
      if (!response.ok) {
        setError(response.error ?? "Erro desconhecido");
        return;
      }
      // Sucesso
      setError(null);
      // ... usar response.data
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      setError(msg);
    }
  };

  return (
    <div>
      {error && <Alert>{error}</Alert>}
      {/* resto do componente */}
    </div>
  );
};
```

---

## 🔄 Migração de Código Antigo

### De `fetch` para `apiClient`

**Antes:**

```typescript
const response = await fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});

if (!response.ok) {
  throw new Error("Erro na requisição");
}

const result = await response.json();
```

**Depois:**

```typescript
import { apiPost } from "@/lib/apiClient";

const response = await apiPost("/api/users", data);
if (!response.ok) {
  throw new Error(response.error);
}
const result = response.data;
```

### De `any` para tipos específicos

**Antes:**

```typescript
catch (error: any) {
  console.error(error.message);
  toast.error(error.message || 'Erro');
}
```

**Depois:**

```typescript
catch (error) {
  const message = error instanceof Error
    ? error.message
    : 'Erro desconhecido';
  toast.error(message);
}
```

### De magic numbers para constantes

**Antes:**

```typescript
await new Promise((resolve) => setTimeout(resolve, 1000));
await new Promise((resolve) => setTimeout(resolve, 1500));
await new Promise((resolve) => setTimeout(resolve, 5000));
```

**Depois:**

```typescript
import { DELAY_PROFILE_UPDATE, DELAY_AI_SIMULATION } from "@/lib/constants";

await new Promise((resolve) => setTimeout(resolve, DELAY_PROFILE_UPDATE));
await new Promise((resolve) => setTimeout(resolve, DELAY_AI_SIMULATION));
```

---

## ✅ Checklist de Implementação

Ao usar os novos utilitários, verifique:

- [ ] Não usar `any` em tipos de erro
- [ ] Usar `apiClient` em vez de `fetch` direto
- [ ] Usar constantes em vez de números mágicos
- [ ] Adicionar cleanup em `useEffect`
- [ ] Tratamento de erro type-safe
- [ ] Nenhum `console.log` em UI
- [ ] Timeout configurado apropriadamente

---

## 🐛 Debug & Troubleshooting

### Retry não funciona

```typescript
// Certifique-se de usar a opção corretamente
const response = await apiPost("/api/data", data, {
  retries: 3, // ✅ Correto
  timeout: 10000,
});
```

### Timeout muito agressivo

```typescript
// Aumentar timeout para operações longas
const response = await apiPost("/api/data", data, {
  retries: 2,
  timeout: HTTP_TIMEOUT_LONG, // 30 segundos
});
```

### Erro não aparece

```typescript
// Garantir que está capturando erro
try {
  const response = await apiGet("/api/data");
  if (!response.ok) {
    // ✅ Sempre checar response.ok
    console.error(response.error);
  }
} catch (error) {
  // ✅ E capturar erros de rede
  console.error(error);
}
```

---

## 📚 Exemplos Completos

### Exemplo 1: Login

```typescript
import { apiPost } from "@/lib/apiClient";

interface LoginResponse {
  token: string;
  user: { id: string; name: string };
}

const handleLogin = async (username: string, password: string) => {
  try {
    const response = await apiPost<LoginResponse>(
      "/api/auth/login",
      { username, password },
      { retries: 2, timeout: 10000 }
    );

    if (!response.ok) {
      toast.error(response.error);
      return false;
    }

    localStorage.setItem("token", response.data.token);
    navigate("/dashboard");
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    toast.error(`Erro de conexão: ${msg}`);
    return false;
  }
};
```

### Exemplo 2: Fetch com Loading

```typescript
import { apiGet } from "@/lib/apiClient";

const MyComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiGet("/api/data");
        if (!response.ok) {
          setError(response.error ?? "Erro desconhecido");
        } else {
          setData(response.data);
        }
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Erro desconhecido";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Skeleton />;
  if (error) return <Alert variant="destructive">{error}</Alert>;
  return <div>{/* usar data */}</div>;
};
```

### Exemplo 3: CRUD Completo

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";

interface User {
  id: string;
  name: string;
  email: string;
}

const UserService = {
  async getAll() {
    const response = await apiGet<User[]>("/api/users");
    return response.ok ? response.data : [];
  },

  async getById(id: string) {
    const response = await apiGet<User>(`/api/users/${id}`);
    return response.ok ? response.data : null;
  },

  async create(data: Omit<User, "id">) {
    const response = await apiPost<User>("/api/users", data);
    if (!response.ok) throw new Error(response.error);
    return response.data;
  },

  async update(id: string, data: Partial<User>) {
    const response = await apiPut<User>(`/api/users/${id}`, data);
    if (!response.ok) throw new Error(response.error);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiDelete(`/api/users/${id}`);
    if (!response.ok) throw new Error(response.error);
    return true;
  },
};
```

---

## 🎓 Recursos Adicionais

- Consulte `src/lib/apiClient.examples.ts` para mais exemplos
- Veja `GUIA_MELHORES_PRATICAS.md` para contexto das mudanças
- Leia `RESUMO_REVISAO_CODIGO.md` para lista completa de arquivos

---

**Última atualização:** 21 de novembro de 2025
