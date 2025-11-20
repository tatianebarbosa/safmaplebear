import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Search, Trash2, Bot, Download, Paperclip, FileText, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { KnowledgeItem, AIPrompt } from "@/types/knowledge";
import { getStoredKnowledgeItems, persistKnowledgeItems, seedKnowledgeBase } from "@/lib/knowledgeBase";

const generateKnowledgeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `kb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

const AIKnowledgeBase = () => {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [initializing, setInitializing] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadCategory, setUploadCategory] = useState("documentos");
  const [uploadPriority, setUploadPriority] = useState<"alta" | "media" | "baixa">("media");
  const [isUploading, setIsUploading] = useState(false);
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
    const loadData = async () => {
      const storedKnowledge = getStoredKnowledgeItems();
      if (storedKnowledge.length) {
        setKnowledgeItems(storedKnowledge);
      } else {
        const seeded = await seedKnowledgeBase();
        if (seeded.length) {
          setKnowledgeItems(seeded);
          toast({
            title: "Base inicial carregada",
            description: "Adicionamos o contexto oficial do site para a IA usar imediatamente.",
          });
        }
      }

      const savedPrompts = localStorage.getItem('saf_ai_prompts');
      if (savedPrompts) {
        setAiPrompts(JSON.parse(savedPrompts));
      } else {
        const initialPrompts = [
          {
            id: '1',
            name: 'Tom Educado',
            prompt: 'Reescreva o texto a seguir mantendo o mesmo conteÃºdo, mas com um tom mais educado e profissional, adequado para o atendimento ao cliente Maple Bear:',
            category: 'atendimento',
            isActive: true,
            usageCount: 50,
            createdAt: new Date().toLocaleString('pt-BR')
          },
          {
            id: '2',
            name: 'Resposta TÃ©cnica Canva',
            prompt: 'Com base no conhecimento sobre licenÃ§as Canva da Maple Bear, responda a seguinte dÃºvida de forma clara e tÃ©cnica:',
            category: 'canva',
            isActive: true,
            usageCount: 30,
            createdAt: new Date().toLocaleString('pt-BR')
          }
        ];
        setAiPrompts(initialPrompts);
      }

      setInitializing(false);
    };

    loadData();
  }, [toast]);

  // Salvar dados
  const saveKnowledge = (items: KnowledgeItem[]) => {
    setKnowledgeItems(items);
    persistKnowledgeItems(items);
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
        id: generateKnowledgeId(),
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

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;

    setIsUploading(true);
    const userEmail = localStorage.getItem("userEmail") || "Upload";

    try {
      const uploads: KnowledgeItem[] = [];

      for (const file of Array.from(fileList)) {
        const rawText = await file.text();
        const trimmed = rawText.trim();

        if (!trimmed) {
          continue;
        }

        uploads.push({
          id: generateKnowledgeId(),
          title: file.name.replace(/\.[^/.]+$/, ""),
          content: trimmed.slice(0, 8000),
          category: uploadCategory || "documentos",
          tags: [file.type || "documento", "upload"],
          status: "ativo",
          priority: uploadPriority,
          createdAt: new Date().toLocaleString("pt-BR"),
          updatedAt: new Date().toLocaleString("pt-BR"),
          createdBy: userEmail,
          usageCount: 0,
          sourceFileName: file.name,
        });
      }

      if (!uploads.length) {
        toast({
          title: "Nenhum conteÃºdo encontrado",
          description: "Os arquivos enviados estÃ£o vazios ou nÃ£o puderam ser lidos.",
          variant: "destructive",
        });
        return;
      }

      saveKnowledge([...uploads, ...knowledgeItems]);
      toast({
        title: "Documentos anexados",
        description: `${uploads.length} arquivo(s) foram convertidos em artigos da base.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao anexar documentos",
        description: "Tente novamente ou utilize arquivos .txt, .md, .csv ou .json.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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

  if (initializing) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <div>
            <p className="font-medium">Carregando base de conhecimento...</p>
            <p className="text-sm text-muted-foreground">
              Preparando documentos do site para alimentar o assistente.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

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

  const handleDeleteItem = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete);
      setItemToDelete(null);
    }
  };

  const handleDeletePrompt = () => {
    if (promptToDelete) {
      deletePrompt(promptToDelete);
      setPromptToDelete(null);
    }
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
      {/* AlertDialog para deletar item de conhecimento */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja remover este item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta aÃ§Ã£o Ã© irreversÃ­vel. O item de conhecimento serÃ¡ permanentemente removido da base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para deletar prompt */}
      <AlertDialog open={!!promptToDelete} onOpenChange={(open) => !open && setPromptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja remover este prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta aÃ§Ã£o Ã© irreversÃ­vel. O prompt serÃ¡ permanentemente removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePrompt} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                    {editingItem ? 'Atualize as informaÃ§Ãµes' : 'Adicione novo conhecimento Ã  base da IA'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitKnowledge} className="space-y-4">
                  <div>
                    <Label htmlFor="title">TÃ­tulo</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="TÃ­tulo do conhecimento"
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
                        <SelectItem value="tecnico">TÃ©cnico</SelectItem>
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
                        <SelectItem value="media">MÃ©dia</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (separadas por vÃ­rgula)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">ConteÃºdo</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="ConteÃºdo detalhado do conhecimento..."
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

          <Card className="border-dashed border-primary/30 bg-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="h-4 w-4" />
                Anexar documentos e textos
              </CardTitle>
              <CardDescription>
                Converta PDFs exportados para texto e faÃ§a upload dos arquivos .txt, .md, .csv ou .json. Cada arquivo Ã© transformado em um artigo e fica disponÃ­vel imediatamente para a IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Categoria padrÃ£o</Label>
                  <Select value={uploadCategory} onValueChange={(value) => setUploadCategory(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="documentos">Documentos</SelectItem>
                      <SelectItem value="canva">Canva</SelectItem>
                      <SelectItem value="vouchers">Vouchers</SelectItem>
                      <SelectItem value="tickets">Tickets</SelectItem>
                      <SelectItem value="monitoria">Monitoria</SelectItem>
                      <SelectItem value="insights">Insights</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={uploadPriority} onValueChange={(value) => setUploadPriority(value as 'alta' | 'media' | 'baixa')}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">MÃ©dia</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border rounded-lg p-3 text-sm bg-background">
                  <p className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Dica
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Gere sumÃ¡rios curtos (atÃ© 8k caracteres). Arquivos maiores serÃ£o automaticamente truncados.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept=".txt,.md,.csv,.json,.log"
                  multiple
                  ref={fileInputRef}
                  disabled={isUploading}
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <p className="text-xs text-muted-foreground">
                  Arraste e solte arquivos de texto exportados dos sistemas (limite prÃ¡tico ~8.000 caracteres por item).
                </p>
              </div>
            </CardContent>
          </Card>

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
                      {item.sourceFileName && (
                        <div className="text-xs text-muted-foreground">
                          Fonte: {item.sourceFileName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => setItemToDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
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
                        <SelectItem value="tecnico">TÃ©cnico</SelectItem>
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
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => setPromptToDelete(prompt.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
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
