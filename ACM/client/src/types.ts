export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: 'user' | 'admin';
  role_level?: number;
}

export interface Attachment {
  type: string;
  name: string;
  size?: number;
}

export interface Message {
  id: number;
  room_id: number;
  user_id: string | number;
  user_name: string;
  message: string;
  created_at: string;
  attachments?: Attachment[];
}

export interface PowerLog {
  action: string;
  user: string;
  target?: string;
  time: string;
}
