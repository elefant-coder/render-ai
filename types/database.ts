/**
 * Supabase Database Types
 * Generated types for type-safe database queries
 */

import type { AIModel, GenerationRequest, GeneratedImage, GenerationStatus } from './generation';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'pro' | 'business';
          credits: number;
          monthly_generations: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro' | 'business';
          credits?: number;
          monthly_generations?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro' | 'business';
          credits?: number;
          monthly_generations?: number;
          updated_at?: string;
        };
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          status: GenerationStatus;
          prompt: string;
          parameters: GenerationRequest;
          images: GeneratedImage[];
          model_used: AIModel;
          generation_time_ms: number | null;
          error_message: string | null;
          credits_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: GenerationStatus;
          prompt: string;
          parameters: GenerationRequest;
          images?: GeneratedImage[];
          model_used: AIModel;
          generation_time_ms?: number | null;
          error_message?: string | null;
          credits_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: GenerationStatus;
          images?: GeneratedImage[];
          generation_time_ms?: number | null;
          error_message?: string | null;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          generation_id: string;
          image_index: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          generation_id: string;
          image_index: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          note?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrement_credits: {
        Args: { user_id: string; amount: number };
        Returns: number;
      };
      increment_monthly_generations: {
        Args: { user_id: string };
        Returns: number;
      };
    };
    Enums: {
      plan_type: 'free' | 'pro' | 'business';
      generation_status: 'pending' | 'processing' | 'completed' | 'failed';
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

// Specific table types
export type User = Tables<'users'>;
export type Generation = Tables<'generations'>;
export type Favorite = Tables<'favorites'>;
