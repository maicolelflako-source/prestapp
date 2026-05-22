import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, Ruta } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  ruta: Ruta | null;
  loading: boolean;
  signIn: (email: string, password: string, codigo: string) => Promise<string | null>;
  signUp: (email: string, password: string, nombre: string, codigo: string, rutaId: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (prof) {
      setProfile(prof);
      if (prof.ruta_id) {
        const { data: r } = await supabase.from('rutas').select('*').eq('id', prof.ruta_id).maybeSingle();
        if (r) setRuta(r);
      }
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        (async () => {
          await loadProfile(s.user.id);
        })();
      } else {
        setProfile(null);
        setRuta(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string, codigo: string): Promise<string | null> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    if (data.user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      if (prof && prof.codigo !== codigo) {
        await supabase.auth.signOut();
        return 'Código de acceso incorrecto.';
      }
    }
    return null;
  }

  async function signUp(
    email: string,
    password: string,
    nombre: string,
    codigo: string,
    rutaId: string
  ): Promise<string | null> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user) {
      const { error: pe } = await supabase.from('profiles').insert({
        id: data.user.id,
        nombre,
        email,
        codigo,
        ruta_id: rutaId || null,
        rol: 'cobrador',
        activo: true,
      });
      if (pe) return pe.message;
    }
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setRuta(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, ruta, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
