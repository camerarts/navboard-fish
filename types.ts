export interface Bookmark {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  icon?: string; // URL to favicon or icon name
  description?: string; // Short description of the website
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
}

export interface SearchEngine {
  id: string;
  name: string;
  urlTemplate: string;
  icon: React.ReactNode;
}

export enum AIState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface AIResponse {
  text: string;
  isError: boolean;
}