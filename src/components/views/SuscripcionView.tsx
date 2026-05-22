import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Crown, CheckCircle, CreditCard, Loader } from 'lucide-react';
import { ToastType } from '../Toast';

interface Props {
  showToast: (msg: string, type: ToastType) => void;
}

const PLANES = [
  { id: 'mensual', nombre: 'Mensual', precio: 29900, descripcion: 'Acceso completo por 30 días', popular: true },
  { id: 'semestral', nombre: 'Semestral', precio: 99900, descripcion: '6 meses de acceso premium', popular: false },
  { id: 'anual', nombre: 'Anual', precio: 149900, descripcion: '12 meses al mejor precio', popular: false },
];

export default function SuscripcionView({ showToast }: Props) {
  const { user } = useAuth();
  const [suscripcion, setSuscripcion] = useState<{ activa: boolean; plan: string; fecha_fin: string; user_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deposito, setDeposito] = useState('');
  const [planSel, setPlanSel] = useState('mensual');
  const [pagando, setPagando] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('suscripciones').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      setSuscripcion(data);
      setLoading(false);
    });
  }, [user]);

  async function pagar() {
    if (!deposito || !user) { showToast('Ingresa el valor a depositar', 'warn'); return; }
    const valor = parseInt(deposito.replace(/[^0-9]/g, '')) || 0;
    if (valor < 10000) { showToast('El depósito mínimo es $10,000', 'warn'); return; }
    setPagando(true);

    const plan = PLANES.find(p => p.id === planSel)!;
    const dias = planSel === 'anual' ? 365 : planSel === 'semestral' ? 180 : 30;
    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + dias);

    if (suscripcion) {
      await supabase.from('suscripciones').update({
        plan: plan.id,
        activa: true,
        fecha_fin: fechaFin.toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    } else {
      await supabase.from('suscripciones').insert({
        user_id: user.id,
        plan: plan.id,
        activa: true,
        fecha_inicio: new Date().toISOString(),
        fecha_fin: fechaFin.toISOString(),
      });
    }

    setPagando(false);
    showToast('Depósito exitoso. Tu suscripción está activa.', 'success');
    setDeposito('');

    const { data } = await supabase.from('suscripciones').select('*').eq('user_id', user.id).maybeSingle();
    if (data) setSuscripcion(data);
  }

  const activa = suscripcion?.activa;
  const planActual = PLANES.find(p => p.id === suscripcion?.plan);

  if (loading) {
    return (
      <div className="view-content">
        <div className="loading-screen" style={{ height: '60vh' }}>
          <Loader size={24} className="spin" color="#EFBF04" />
        </div>
      </div>
    );
  }

  return (
    <div className="view-content">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Estado actual */}
        <div className="form-card">
          <div className="fcard-head">
            <Crown size={16} />
            <span>Estado de mi Suscripción</span>
          </div>
          <div className="fcard-body">
            {activa ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Crown size={48} color="#EFBF04" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e', marginBottom: 6 }}>SUSCRIPCIÓN ACTIVA</div>
                <div style={{ color: '#b8a870', fontSize: 13 }}>
                  Plan {planActual?.nombre || 'Premium'} • Válido hasta {new Date(suscripcion.fecha_fin).toLocaleDateString('es-CO')}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Crown size={48} color="#6b5e30" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 20, fontWeight: 800, color: '#f97316', marginBottom: 6 }}>SIN SUSCRIPCIÓN</div>
                <div style={{ color: '#6b5e30', fontSize: 13 }}>
                  Activa tu plan premium para acceder a todas las funciones
                </div>
              </div>
            )}
          </div>
        </div>

        {!activa && (
          <>
            {/* Planes */}
            <div className="form-card">
              <div className="fcard-head">
                <CreditCard size={16} />
                <span>Elige tu plan</span>
              </div>
              <div className="fcard-body">
                <div style={{ display: 'grid', gap: 10 }}>
                  {PLANES.map(p => (
                    <label
                      key={p.id}
                      onClick={() => setPlanSel(p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        background: planSel === p.id ? 'rgba(239,191,4,0.1)' : 'transparent',
                        border: planSel === p.id ? '1.5px solid #EFBF04' : '1px solid rgba(239,191,4,0.15)',
                        borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <input type="radio" name="plan" checked={planSel === p.id} onChange={() => setPlanSel(p.id)} style={{ accentColor: '#EFBF04' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#f0e8cc', fontSize: 14 }}>
                          {p.nombre} {p.popular && <span style={{ color: '#EFBF04', fontSize: 10, fontWeight: 800 }}>MÁS POPULAR</span>}
                        </div>
                        <div style={{ color: '#6b5e30', fontSize: 11 }}>{p.descripcion}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: '#EFBF04' }}>${(p.precio / 1000).toFixed(0)}k</div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Depositar */}
            <div className="form-card">
              <div className="fcard-head">
                <CreditCard size={16} />
                <span>Depositar y suscribirse</span>
              </div>
              <div className="fcard-body">
                <p style={{ color: '#6b5e30', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                  Ingresa el valor que deseas depositar. El sistema activará automáticamente el plan seleccionado.
                </p>
                <div className="field">
                  <label>Valor a depositar</label>
                  <div className="px-wrap">
                    <span className="px">$</span>
                    <input
                      value={deposito}
                      onChange={e => setDeposito(e.target.value)}
                      placeholder="Ej: 29900"
                      style={{ fontSize: 18, fontWeight: 700, padding: '10px 10px 10px 22px' }}
                    />
                  </div>
                </div>
                <button
                  className="btn btn-gold btn-lg"
                  onClick={pagar}
                  disabled={pagando}
                  style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
                >
                  {pagando ? (
                    <><Loader size={16} className="spin" /> Procesando…</>
                  ) : (
                    <><CheckCircle size={16} /> PAGAR Y ACTIVAR</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {activa && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10 }}>
            <button className="btn btn-outline-gold" onClick={() => showToast('Suscripción vigente. No necesita renovación aún.', 'info')}>
              Renovar Suscripción
            </button>
          </div>
        )}
      </div>
    </div>
  );
}