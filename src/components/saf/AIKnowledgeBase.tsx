import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Search, Trash2, Bot, FileText, Tag, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'ativo' | 'rascunho' | 'arquivado';
  priority: 'alta' | 'media' | 'baixa';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  usageCount: number;
}

interface AIPrompt {
  id: string;
  name: string;
  prompt: string;
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

const AIKnowledgeBase = () => {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'atendimento',
    tags: '',
    priority: 'media'
  });

  const [promptData, setPromptData] = useState({
    name: '',
    prompt: '',
    category: 'atendimento',
    isActive: true
  });

  // Carregar dados do localStorage
  useEffect(() => {
    const savedKnowledge = localStorage.getItem('saf_knowledge_base');
    const savedPrompts = localStorage.getItem('saf_ai_prompts');
    
    if (savedKnowledge) {
      setKnowledgeItems(JSON.parse(savedKnowledge));
    } else {
      // Dados iniciais para demonstração
      const initialKnowledge = [
        {
          id: '1',
          title: 'Processo de criação de licenças Canva',
          content: 'Para criar uma licença Canva para uma escola, siga os seguintes passos: 1) Verifique se o email da escola usa o domínio correto (@maplebear.com.br ou afiliados), 2) Acesse o portal administrativo do Canva, 3) Crie um novo usuário com o email verificado, 4) Atribua as permissões adequadas conforme o plano da escola.',
          category: 'canva',
          tags: ['licença', 'canva', 'processo'],
          status: 'ativo' as const,
          priority: 'alta' as const,
          createdAt: new Date().toLocaleString('pt-BR'),
          updatedAt: new Date().toLocaleString('pt-BR'),
          createdBy: 'Sistema',
          usageCount: 15
        },
        {
          id: '2',
          title: 'Atendimento padrão SAF',
          content: 'Sempre inicie o atendimento com "Olá! Sou [seu nome] da equipe SAF Maple Bear. Como posso ajudá-lo hoje?". Mantenha tom educado e profissional. Sempre identifique a escola e a necessidade específica antes de prosseguir com soluções.',
          category: 'atendimento',
          tags: ['atendimento', 'padrão', 'comunicação'],
          status: 'ativo' as const,
          priority: 'alta' as const,
          createdAt: new Date().toLocaleString('pt-BR'),
          updatedAt: new Date().toLocaleString('pt-BR'),
          createdBy: 'Sistema',
          usageCount: 25
        }
      ];
      setKnowledgeItems(initialKnowledge);
    }

    if (savedPrompts) {
      setAiPrompts(JSON.parse(savedPrompts));
    } else {
      // Prompts iniciais
      const initialPrompts = [
        {
          id: '1',
          name: 'Tom Educado',
          prompt: 'Reescreva o texto a seguir mantendo o mesmo conteúdo, mas com um tom mais educado e profissional, adequado para o atendimento ao cliente Maple Bear:',
          category: 'atendimento',
          isActive: true,
          usageCount: 50,
          createdAt: new Date().toLocaleString('pt-BR')
        },
        {
          id: '2',
          name: 'Resposta Técnica Canva',
          prompt: 'Com base no conhecimento sobre licenças Canva da Maple Bear, responda a seguinte dúvida de forma clara e técnica:',
          category: 'canva',
          isActive: true,
          usageCount: 30,
          createdAt: new Date().toLocaleString('pt-BR')
        }
      ];
      setAiPrompts(initialPrompts);
    }
  }, []);

  // Salvar dados
  const saveKnowledge = (items: KnowledgeItem[]) => {
    setKnowledgeItems(items);
    localStorage.setItem('saf_knowledge_base', JSON.stringify(items));
  };

  const savePrompts = (prompts: AIPrompt[]) => {
    setAiPrompts(prompts);
    localStorage.setItem('saf_ai_prompts', JSON.stringify(prompts));
  };

  const handleSubmitKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    if (editingItem) {
      const updatedItems = knowledgeItems.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            ...formData,
            priority: formData.priority as 'alta' | 'media' | 'baixa',
            tags: tagsArray,
            updatedAt: new Date().toLocaleString('pt-BR')
          };
        }
        return item;
      });
      
      saveKnowledge(updatedItems);
      toast({ title: "Item atualizado", description: "Conhecimento foi atualizado com sucesso" });
    } else {
      const newItem: KnowledgeItem = {
        id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
        priority: formData.priority as 'alta' | 'media' | 'baixa',
        tags: tagsArray,
        status: 'ativo',
        createdAt: new Date().toLocaleString('pt-BR'),
        updatedAt: new Date().toLocaleString('pt-BR'),
        createdBy: localStorage.getItem("userEmail") || "Sistema",
        usageCount: 0
      };
      
      saveKnowledge([...knowledgeItems, newItem]);
      toast({ title: "Item criado", description: "Novo conhecimento foi adicionado" });
    }

    resetForm();
  };

  const handleSubmitPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPrompt) {
      const updatedPrompts = aiPrompts.map(prompt => {
        if (prompt.id === editingPrompt.id) {
          return { ...prompt, ...promptData };
        }
        return prompt;
      });
      
      savePrompts(updatedPrompts);
      toast({ title: "Prompt atualizado", description: "Prompt da IA foi atualizado" });
    } else {
      const newPrompt: AIPrompt = {
        id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...promptData,
        usageCount: 0,
        createdAt: new Date().toLocaleString('pt-BR')
      };
      
      savePrompts([...aiPrompts, newPrompt]);
      toast({ title: "Prompt criado", description: "Novo prompt da IA foi criado" });
    }

    resetPromptForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'atendimento',
      tags: '',
      priority: 'media'
    });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const resetPromptForm = () => {
    setPromptData({
      name: '',
      prompt: '',
      category: 'atendimento',
      isActive: true
    });
    setEditingPrompt(null);
    setIsPromptDialogOpen(false);
  };

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags.join(', '),
      priority: item.priority
    });
    setIsDialogOpen(true);
  };

  const handleEditPrompt = (prompt: AIPrompt) => {
    setEditingPrompt(prompt);
    setPromptData({
      name: prompt.name,
      prompt: prompt.prompt,
      category: prompt.category,
      isActive: prompt.isActive
    });
    setIsPromptDialogOpen(true);
  };

  const deleteItem = (id: string) => {
    const updated = knowledgeItems.filter(item => item.id !== id);
    saveKnowledge(updated);
    toast({ title: "Item removido", description: "Conhecimento foi removido da base" });
  };

  const deletePrompt = (id: string) => {
    const updated = aiPrompts.filter(prompt => prompt.id !== id);
    savePrompts(updated);
    toast({ title: "Prompt removido", description: "Prompt foi removido do sistema" });
  };

  const exportData = () => {
    const data = { knowledgeItems, aiPrompts };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saf_knowledge_base_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filtrar itens
  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(knowledgeItems.map(item => item.category)))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Base de Conhecimento IA</h1>
          <p className="text-muted-foreground">Gerencie conhecimentos e prompts da IA SAF</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="knowledge" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="knowledge">Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="prompts">Prompts da IA</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="space-y-6">
          {/* Controles da Base de Conhecimento */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na base de conhecimento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'Todas' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  resetForm();
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Conhecimento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Editar' : 'Novo'} Conhecimento</DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Atualize as informações' : 'Adicione novo conhecimento à base da IA'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitKnowledge} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Título do conhecimento"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="atendimento">Atendimento</SelectItem>
                        <SelectItem value="canva">Canva</SelectItem>
                        <SelectItem value="vouchers">Vouchers</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                        <SelectItem value="processos">Processos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="Conteúdo detalhado do conhecimento..."
                      className="min-h-32"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingItem ? 'Atualizar' : 'Criar'} Conhecimento
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Conhecimentos */}
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge variant={item.priority === 'alta' ? 'default' : 'secondary'}>
                          {item.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Usado {item.usageCount} vezes
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.content}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        {item.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Criado por {item.createdBy} em {item.createdAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-6">
          {/* Controles dos Prompts */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Prompts da IA</h2>
            <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPrompt(null);
                  resetPromptForm();
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Prompt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPrompt ? 'Editar' : 'Novo'} Prompt IA</DialogTitle>
                  <DialogDescription>
                    {editingPrompt ? 'Atualize o prompt' : 'Configure um novo prompt para a IA'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitPrompt} className="space-y-4">
                  <div>
                    <Label htmlFor="promptName">Nome do Prompt</Label>
                    <Input
                      id="promptName"
                      value={promptData.name}
                      onChange={(e) => setPromptData({...promptData, name: e.target.value})}
                      placeholder="Nome descritivo do prompt"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="promptCategory">Categoria</Label>
                    <Select value={promptData.category} onValueChange={(value) => setPromptData({...promptData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="atendimento">Atendimento</SelectItem>
                        <SelectItem value="canva">Canva</SelectItem>
                        <SelectItem value="vouchers">Vouchers</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="promptContent">Prompt</Label>
                    <Textarea
                      id="promptContent"
                      value={promptData.prompt}
                      onChange={(e) => setPromptData({...promptData, prompt: e.target.value})}
                      placeholder="Digite o prompt que a IA deve usar..."
                      className="min-h-32"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={promptData.isActive}
                      onChange={(e) => setPromptData({...promptData, isActive: e.target.checked})}
                    />
                    <Label htmlFor="isActive">Prompt ativo</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingPrompt ? 'Atualizar' : 'Criar'} Prompt
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Prompts */}
          <div className="grid gap-4">
            {aiPrompts.map((prompt) => (
              <Card key={prompt.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4" />
                        <h3 className="font-semibold">{prompt.name}</h3>
                        <Badge variant="outline">{prompt.category}</Badge>
                        <Badge variant={prompt.isActive ? 'default' : 'secondary'}>
                          {prompt.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Usado {prompt.usageCount} vezes
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {prompt.prompt}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Criado em {prompt.createdAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditPrompt(prompt)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deletePrompt(prompt.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIKnowledgeBase;