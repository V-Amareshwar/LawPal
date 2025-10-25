export interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  date: string;
}

export const Theme = {
  Light: "light",
  Dark: "dark",
  Auto: "auto",
} as const;
export type Theme = typeof Theme[keyof typeof Theme];

export interface AppConfig {
  theme: Theme;
  temperature: number;
  top_p: number;
  model: string;
}
