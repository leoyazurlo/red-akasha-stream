import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type EditarPerfilFormData = {
  display_name: string;
  bio: string;
  avatar_url: string;
  pais: string;
  provincia: string;
  ciudad: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  whatsapp: string;
  telefono: string;
  email: string;
  profile_type: string;
  additional_profile_types: string[];
};

export type EditarPerfilDraft = {
  formData: EditarPerfilFormData;
  newImages: File[];
  updatedAt: number;
};

type ProfileEditDraftContextValue = {
  getDraft: (userId: string) => EditarPerfilDraft | undefined;
  setDraft: (userId: string, draft: Omit<EditarPerfilDraft, "updatedAt"> & { updatedAt?: number }) => void;
  clearDraft: (userId: string) => void;
};

const ProfileEditDraftContext = createContext<ProfileEditDraftContextValue | null>(null);

export const ProfileEditDraftProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [draftByUserId, setDraftByUserId] = useState<Record<string, EditarPerfilDraft | undefined>>({});

  const getDraft = useCallback(
    (userId: string) => draftByUserId[userId],
    [draftByUserId]
  );

  const setDraft = useCallback(
    (userId: string, draft: Omit<EditarPerfilDraft, "updatedAt"> & { updatedAt?: number }) => {
      setDraftByUserId((prev) => ({
        ...prev,
        [userId]: {
          formData: draft.formData,
          newImages: draft.newImages,
          updatedAt: draft.updatedAt ?? Date.now(),
        },
      }));
    },
    []
  );

  const clearDraft = useCallback((userId: string) => {
    setDraftByUserId((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ getDraft, setDraft, clearDraft }),
    [getDraft, setDraft, clearDraft]
  );

  return <ProfileEditDraftContext.Provider value={value}>{children}</ProfileEditDraftContext.Provider>;
};

export const useProfileEditDraft = () => {
  const ctx = useContext(ProfileEditDraftContext);
  if (!ctx) {
    throw new Error("useProfileEditDraft must be used within ProfileEditDraftProvider");
  }
  return ctx;
};
