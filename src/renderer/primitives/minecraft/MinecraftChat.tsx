import React from 'react';

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  color?: string;
}

export interface MinecraftChatProps {
  messages: ChatMessage[];
  className?: string;
}

export const MinecraftChat: React.FC<MinecraftChatProps> = ({ messages, className = '' }) => {
  return (
    <div className={`w-80 max-h-48 bg-black/60 backdrop-blur-sm p-2.5 font-mono text-xs flex flex-col gap-1 overflow-y-auto rounded border border-white/10 ${className}`}>
      {messages.map((msg) => (
        <div key={msg.id} className="leading-tight drop-shadow-[1px_1px_0px_#000000]">
          <span style={{ color: msg.color || '#55ffff' }} className="font-bold">
            &lt;{msg.username}&gt;
          </span>{' '}
          <span className="text-white">{msg.text}</span>
        </div>
      ))}
    </div>
  );
};
