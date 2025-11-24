import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react";

import BannerTwo from "@/assets/imgtelainicial/2descontouniforme.png";
import BannerThree from "@/assets/imgtelainicial/3descontouniforme.png";

type PromoImageState = {
  id: string;
  label: string;
  src: string;
  source: "default" | "upload";
  updatedAt: string;
  updatedBy?: string;
};

const STORAGE_KEY = "saf_home_uniform_card_v1";
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB

const defaultImages: PromoImageState[] = [
  {
    id: "desconto-2",
    label: "Banner 2a unidade",
    src: BannerTwo,
    source: "default",
    updatedAt: new Date().toISOString(),
    updatedBy: "Time SAF",
  },
  {
    id: "desconto-3",
    label: "Banner 3a unidade",
    src: BannerThree,
    source: "default",
    updatedAt: new Date().toISOString(),
    updatedBy: "Time SAF",
  },
];

const getInitialImage = (): PromoImageState => {
  if (typeof window === "undefined") {
    return defaultImages[0];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PromoImageState;
      return parsed.src ? parsed : defaultImages[0];
    }
  } catch (err) {
    console.warn("[home-card] falha ao ler imagem salva", err);
  }

  return defaultImages[0];
};

const UniformPromoCard = () => {
  const { toast } = useToast();
  const { currentUser, isAdmin, isCoordinator } = useAuthStore();
  const canEdit = isAdmin() || isCoordinator();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [promoImage, setPromoImage] = useState<PromoImageState>(
    getInitialImage
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(promoImage));
    } catch (err) {
      console.warn("[home-card] nao foi possivel salvar a imagem", err);
    }
  }, [promoImage]);

  const handleSelectDefault = (id: string) => {
    const selected =
      defaultImages.find((img) => img.id === id) || defaultImages[0];
    const actor = currentUser?.name || currentUser?.email || "Admin";
    setPromoImage({
      ...selected,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
    });
    toast({
      title: "Card atualizado",
      description: "Imagem oficial aplicada para todos.",
    });
  };

  const handleUpload = (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: "Arquivo muito grande",
        description: "Use uma imagem de ate 4MB para salvar localmente.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const actor = currentUser?.name || currentUser?.email || "Admin";
      setPromoImage({
        id: "upload",
        label: file.name,
        src: dataUrl,
        source: "upload",
        updatedAt: new Date().toISOString(),
        updatedBy: actor,
      });
      toast({
        title: "Nova imagem aplicada",
        description: "O banner foi atualizado e salvo neste navegador.",
      });
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleUpload(file);
    // Reset input so the same file can be chosen again
    event.target.value = "";
  };

  return (
    <Card className="relative overflow-hidden rounded-3xl border shadow-2xl bg-white min-h-[320px]">
      <div className="absolute inset-0">
        <img
          src={promoImage.src}
          alt={`Banner de uniforme - ${promoImage.label}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-8 text-white">
        <div className="space-y-1 drop-shadow">
          <p className="text-xs uppercase tracking-[0.2em] text-white/80">
            Banner do uniforme
          </p>
          <h3 className="text-3xl sm:text-4xl font-bold leading-tight">
            {promoImage.label}
          </h3>
        </div>

        {canEdit && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-black/30 p-2 backdrop-blur">
              {defaultImages.map((img) => (
                <Button
                  key={img.id}
                  size="sm"
                  variant={promoImage.id === img.id ? "secondary" : "ghost"}
                  className={cn(
                    "text-white border border-white/25 bg-white/10 hover:bg-white/20",
                    promoImage.id === img.id &&
                      "bg-white text-primary hover:bg-white"
                  )}
                  onClick={() => handleSelectDefault(img.id)}
                >
                  <ImageIcon className="w-4 h-4" />
                  {img.label}
                </Button>
              ))}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-4 h-4" />
                Enviar nova imagem
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default UniformPromoCard;
