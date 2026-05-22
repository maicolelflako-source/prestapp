import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Ruta } from '../types';
import { Eye, EyeOff, Shield, Star, Lock, Mail, KeyRound, User, ChevronRight, Coins } from 'lucide-react';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [rutaId, setRutaId] = useState('');
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    supabase.from('rutas').select('*').then(({ data }) => {
      if (data) setRutas(data);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password || !codigo) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    if (mode === 'register' && !termsAccepted) {
      setError('Debes aceptar los Términos y Condiciones para continuar.');
      return;
    }
    if (mode === 'register' && !nombre) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    setLoading(true);
    let err: string | null;
    if (mode === 'login') {
      err = await signIn(email, password, codigo);
    } else {
      err = await signUp(email, password, nombre, codigo, rutaId);
    }
    setLoading(false);
    if (err) {
      if (err.toLowerCase().includes('rate limit') || err.toLowerCase().includes('email_rate_limit')) {
        setError('Demasiados intentos. Espera 1 minuto e inténtalo de nuevo.');
      } else {
        setError(err);
      }
    }
  }

  return (
    <div className="auth-bg">
      {/* Animated gold particles background */}
      <div className="auth-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="particle" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Coins size={32} />
          </div>
          <div className="auth-logo-text">
            <span className="auth-logo-name">PrestaApp</span>
            <span className="auth-logo-sub">Sistema Profesional de Préstamos</span>
          </div>
        </div>

        {/* Premium badge */}
        <div className="auth-premium">
          <div className="premium-badge">
            <Star size={14} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={14} fill="currentColor" />
          </div>
          <span className="premium-text">PREMIUM</span>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
            type="button"
          >
            Ingresar
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
            type="button"
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="auth-field">
              <User size={15} className="auth-field-icon" />
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <Mail size={15} className="auth-field-icon" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <Lock size={15} className="auth-field-icon" />
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button type="button" className="pwd-toggle" onClick={() => setShowPwd(p => !p)}>
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="auth-field">
            <KeyRound size={15} className="auth-field-icon" />
            <input
              type="text"
              placeholder="Código de acceso"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              autoComplete="off"
              maxLength={20}
            />
          </div>

          {mode === 'register' && rutas.length > 0 && (
            <div className="auth-field">
              <Shield size={15} className="auth-field-icon" />
              <select value={rutaId} onChange={e => setRutaId(e.target.value)}>
                <option value="">— Selecciona tu ruta (opcional) —</option>
                {rutas.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          {mode === 'register' && (
            <label className="auth-terms-check">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
              />
              <span>
                Acepto los{' '}
                <button type="button" className="terms-link" onClick={() => setShowTerms(true)}>
                  Términos y Condiciones
                </button>{' '}
                y la Política de Privacidad
              </span>
            </label>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <span className="auth-btn-loader" />
            ) : (
              <>
                {mode === 'login' ? 'INGRESAR' : 'CREAR CUENTA'}
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Terms note */}
        <div className="auth-footer-note">
          <Shield size={12} />
          Al ingresar, aceptas nuestros{' '}
          <button type="button" className="terms-link" onClick={() => setShowTerms(true)}>
            Términos y Condiciones
          </button>{' '}
          y reconoces que tus datos serán tratados según la Política de Privacidad.
        </div>
      </div>

      {/* Terms modal */}
      {showTerms && (
        <div className="terms-overlay" onClick={() => setShowTerms(false)}>
          <div className="terms-modal" onClick={e => e.stopPropagation()}>
            <div className="terms-head">
              <Shield size={18} />
              <span>Términos y Condiciones — PrestaApp</span>
              <button type="button" onClick={() => setShowTerms(false)}>✕</button>
            </div>
            <div className="terms-body">
              <h4>1. Aceptación de Términos</h4>
              <p>Al registrarse y utilizar PrestaApp, el usuario acepta plenamente los presentes Términos y Condiciones de uso. Si no está de acuerdo con alguno de ellos, no debe hacer uso de la plataforma.</p>

              <h4>2. Uso del Servicio</h4>
              <p>PrestaApp es una plataforma de gestión de carteras de crédito destinada exclusivamente a cobradores y administradores de rutas de préstamo. Queda prohibido su uso para actividades ilícitas, fraude o cualquier fin contrario a la ley.</p>

              <h4>3. Privacidad de Datos</h4>
              <p>Los datos personales ingresados en la plataforma son tratados con estricta confidencialidad conforme a la normativa de protección de datos vigente. PrestaApp no comparte información personal con terceros sin consentimiento expreso del usuario.</p>

              <h4>4. Responsabilidad</h4>
              <p>El usuario es responsable de la exactitud de la información ingresada. PrestaApp no se hace responsable por pérdidas derivadas de datos incorrectos o uso indebido de la plataforma.</p>

              <h4>5. Propiedad Intelectual</h4>
              <p>Todo el contenido, diseño y código de PrestaApp es propiedad de sus desarrolladores. Queda prohibida su reproducción total o parcial sin autorización escrita.</p>

              <h4>6. Modificaciones</h4>
              <p>PrestaApp se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la plataforma y entrarán en vigencia a partir de su publicación.</p>

              <h4>7. Suscripción Premium</h4>
              <p>El acceso a las funcionalidades avanzadas requiere una suscripción activa. La suscripción es personal e intransferible. El incumplimiento de los términos puede resultar en la cancelación de la cuenta sin reembolso.</p>

              <h4>8. Ley Aplicable</h4>
              <p>Estos Términos se rigen por las leyes de la República de Colombia. Cualquier disputa será resuelta ante los tribunales competentes de dicha jurisdicción.</p>
            </div>
            <div className="terms-footer">
              <button type="button" className="terms-accept-btn" onClick={() => { setTermsAccepted(true); setShowTerms(false); }}>
                Aceptar y cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
