// types/arena-types.ts

export interface ArenaChannel {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  open: boolean;
  collaboration: boolean;
  slug: string;
  length: number;
  status: string;
  user_id: number;
  contents: ArenaItem[];
  contents_updated_at: string;
  base_class: string;
  page: number;
  per: number;
  collaborators: any[];
  followers: any[];
  skeleton: any[];
  can_index: boolean;
  nsfw: boolean;
  metadata: Record<string, any>;
  class: string;
}

export interface ArenaItem {
  id: number;
  title?: string;
  content?: string;
  description?: string;
  source?: {
    url?: string;
    title?: string;
  };
  image?: {
    filename?: string;
    content_type?: string;
    updated_at?: string;
    thumb?: {
      url?: string;
    };
    square?: {
      url?: string;
    };
    display?: {
      url?: string;
    };
    large?: {
      url?: string;
    };
    original?: {
      url?: string;
      file_size?: number;
      file_size_display?: string;
    };
  };
  attachment?: {
    url?: string;
    file_name?: string;
    file_size?: number;
    extension?: string;
  };
  embed?: {
    type?: string;
    title?: string;
    author_name?: string;
    author_url?: string;
    html?: string;
    width?: number;
    height?: number;
    thumbnail_url?: string;
  };
  metadata?: Record<string, any>;
  connected_at: string;
  connected_by_username: string;
  connected_by_user_slug: string;
  connected_by_user_id: number;
  connection_id: number;
  position: number;
  selected?: boolean;
  base_class: string;
  class: string;
  user?: {
    id: number;
    slug: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SlugMapping {
  [slug: string]: {
    id: number;
    title: string;
    class: string;
    original_title: string;
  };
}
