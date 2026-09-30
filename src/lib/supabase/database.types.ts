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
          source_url?: string | null;
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
          media_url: string | null;
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
          headline: string | null;
          summary_short: string | null;
          original_title: string | null;
          original_language: string | null;
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
          title: string | null;
          description: string;
          latitude: number | null;
          longitude: number | null;
          severity: string;
          status: string;
          source: string | null;
          source_name: string | null;
          source_url: string | null;
          source_type: "official" | "news" | "community" | null;
          location_name: string | null;
          reported_at: string;
          issued_at: string | null;
          expires_at: string | null;
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
      khowar_lexicon: {
        Row: {
          id: string;
          dataset_id: string;
          record_type: "letter" | "word";
          record_index: number;
          entry: string;
          source_name: string;
          source_url: string;
          license: string;
          attribution: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["khowar_lexicon"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["khowar_lexicon"]["Insert"]>;
        Relationships: [];
      };
      khowar_glossary: {
        Row: {
          id: string;
          source_entry_id: string;
          headword: string;
          english_gloss: string | null;
          english_definition: string | null;
          cultural_notes: string | null;
          examples: Json;
          source_author: string;
          source_title: string;
          publication_year: number;
          source_url: string;
          source_doi: string;
          source_locator: string | null;
          license: string;
          attribution: string;
          project_permission: string;
          provenance: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["khowar_glossary"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["khowar_glossary"]["Insert"]>;
        Relationships: [];
      };
      khowar_glossary_chunks: {
        Row: {
          id: string;
          source_id: string;
          headword: string;
          english_gloss: string;
          content: string;
          source_name: string | null;
          source_url: string | null;
          metadata: Json;
          embedding: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["khowar_glossary_chunks"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["khowar_glossary_chunks"]["Insert"]>;
        Relationships: [];
      };
      knowledge_chunks: {
        Row: {
          id: string;
          source_type: "encyclopedia" | "news" | "safety" | "place" | "translation" | "khowar_lexicon" | "khowar_glossary";
          source_id: string;
          chunk_index: number;
          content: string;
          source_name: string | null;
          source_url: string | null;
          metadata: Json;
          embedding: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["knowledge_chunks"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["knowledge_chunks"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_knowledge_chunks: {
        Args: {
          query_embedding: string;
          match_count?: number;
          source_type_filter?: string | null;
        };
        Returns: {
          id: string;
          source_type: string;
          source_id: string;
          chunk_index: number;
          content: string;
          source_name: string | null;
          source_url: string | null;
          metadata: Json;
          similarity: number;
        }[];
      };
      match_khowar_glossary_chunks: {
        Args: {
          query_embedding: string;
          query_terms: string[];
          match_count?: number;
        };
        Returns: {
          source_id: string;
          headword: string;
          english_gloss: string;
          content: string;
          source_name: string | null;
          source_url: string | null;
          metadata: Json;
          similarity: number;
          lexical_score: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
