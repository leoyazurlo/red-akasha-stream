import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatDialog } from '@/components/profile/ChatDialog';

interface ChatPartner {
  id: string;
  name: string;
  avatar?: string | null;
}

interface GlobalChatContextType {
  openChat: (partner: ChatPartner) => void;
  closeChat: () => void;
  isOpen: boolean;
  currentPartner: ChatPartner | null;
}

const GlobalChatContext = createContext<GlobalChatContextType | undefined>(undefined);

export const useGlobalChat = () => {
  const context = useContext(GlobalChatContext);
  if (!context) {
    throw new Error('useGlobalChat must be used within a GlobalChatProvider');
  }
  return context;
};

interface GlobalChatProviderProps {
  children: ReactNode;
}

export const GlobalChatProvider = ({ children }: GlobalChatProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<ChatPartner | null>(null);

  const openChat = (partner: ChatPartner) => {
    setCurrentPartner(partner);
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    // Keep partner for a moment to avoid flicker during close animation
    setTimeout(() => setCurrentPartner(null), 300);
  };

  return (
    <GlobalChatContext.Provider value={{ openChat, closeChat, isOpen, currentPartner }}>
      {children}
      {currentPartner && (
        <ChatDialog
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) closeChat();
          }}
          partnerId={currentPartner.id}
          partnerName={currentPartner.name}
          partnerAvatar={currentPartner.avatar}
        />
      )}
    </GlobalChatContext.Provider>
  );
};
