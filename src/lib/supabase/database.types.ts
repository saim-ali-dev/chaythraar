export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      places: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          latitude: number | null;
          longitude: number | null;
          category: string;
          image_url: string | null;
          opening_time: string | null;
          closing_time: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["places"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["places"]["Insert"]>;
        Relationships: [];
      };
      encyclopedia: {
        Row: {
          id: string;
          title: string;
          category: string;
          content: string;
          image_url: string | null;
          source: string | null;
          source_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["encyclopedia"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["encyclopedia"]["Insert"]>;
        Relationships: [];
      };
      news: {
        Row: {
          id: string;
          title: string;
          summary: string | null;
          source: string;
          source_url: string | null;
          image_url: string | null;
          published_at: string;
          category: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["news"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["news"]["Insert"]>;
        Relationships: [];
      };
      hazards: {
        Row: {
          id: string;
          type: string;
          description: string;
          latitude: number | null;
          longitude: number | null;
          severity: string;
          status: string;
          source: string | null;
          reported_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["hazards"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["hazards"]["Insert"]>;
        Relationships: [];
      };
      translations: {
        Row: {
          id: string;
          khowar: string;
          urdu: string;
          english: string;
          example: string | null;
          verified: boolean;
          source: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["translations"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["translations"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
