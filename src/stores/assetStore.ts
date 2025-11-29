import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AssetContactRecord, SafAsset } from "@/types/assets";

interface AssetStore {
  assets: SafAsset[];
  contacts: AssetContactRecord[];

  addAsset: (
    data: Pick<SafAsset, "name" | "description" | "channel" | "requesterTeam" | "assetType">
  ) => SafAsset;
  updateAsset: (id: string, updates: Partial<SafAsset>) => void;

  addContact: (record: Omit<AssetContactRecord, "id">) => AssetContactRecord;
  updateContact: (id: string, updates: Partial<AssetContactRecord>) => void;

  getContactsByAsset: (assetId: string) => AssetContactRecord[];
  getContactsByAssetAndSchool: (assetId: string, schoolId: string) => AssetContactRecord[];
}

const buildId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      assets: [],
      contacts: [],

      addAsset: (data) => {
        const newAsset: SafAsset = {
          id: buildId("asset"),
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          createdAt: new Date().toISOString(),
          requesterTeam: data.requesterTeam,
          channel: data.channel,
          assetType: data.assetType?.trim() || undefined,
        };

        set((state) => ({
          assets: [...state.assets, newAsset],
        }));

        return newAsset;
      },

      updateAsset: (id, updates) => {
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === id ? { ...asset, ...updates } : asset
          ),
        }));
      },

      addContact: (record) => {
        const asset = get().assets.find((item) => item.id === record.assetId);
        const newRecord: AssetContactRecord = {
          ...record,
          id: buildId("contact"),
          assetName: record.assetName || asset?.name || "Ativo",
          contactAt: record.contactAt || new Date().toISOString(),
        };

        set((state) => ({
          contacts: [newRecord, ...state.contacts],
        }));

        return newRecord;
      },

      updateContact: (id, updates) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id ? { ...contact, ...updates } : contact
          ),
        }));
      },

      getContactsByAsset: (assetId) => {
        return get().contacts.filter((contact) => contact.assetId === assetId);
      },

      getContactsByAssetAndSchool: (assetId, schoolId) => {
        return get().contacts.filter(
          (contact) =>
            contact.assetId === assetId && contact.schoolId === schoolId
        );
      },
    }),
    {
      name: "saf-asset-store",
    }
  )
);
