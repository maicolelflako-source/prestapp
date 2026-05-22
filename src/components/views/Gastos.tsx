import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Gasto } from '../../types';
import { fmt, unf, today } from '../../utils';
import { Fuel, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { ToastType } from '../Toast';

interface Props {
  onNavigate: (v: string) => void;
  showToast: (msg: string, type: ToastType) => void;
}

export default function Gastos({ onNavigate, showToast }: Props) {
  const { profile, ruta } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [nombre, setNombre] = useState('');
  const [valor, setValor] = useState('');
  const [concepto, setConcepto] = useState('');
  const [fecha, setFecha] = useState(today());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!ruta) return;
    const { data } = await supabase.from('gastos')
      .select('*')
      .eq('ruta_id', ruta.id)
      .eq('fecha', today())
      .order('created_at');
    if (data) setGastos(data);
  }, [ruta]);

  useEffect(() => { load(); }, [load]);

  async function grabar() {
    if (!nombre || !valor || !ruta || !profile) {
      showToast('Completa nombre y valor del gasto', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('gastos').insert({
      ruta_id: ruta.id,
      cobrador_id: profile.id,
      fecha,
      nombre,
      concepto,
      tipo: 'OPERACIONAL',
      valor: unf(valor),
    });
    setSaving(false);
    if (error) { showToast('Error al guardar gasto', 'error'); return; }
    setNombre(''); setValor(''); setConcepto('');
    showToast('Gasto registrado: $' + fmt(unf(valor)), 'success');
    load();
  }

  async function eliminar(id: string) {
    await supabase.from('gastos').delete().eq('id', id);
    showToast('Gasto eliminado', 'warn');
    load();
  }

  const total = gastos.reduce((a, g) => a + g.valor, 0);

  return (
    <div className="view-content">
      <div className="form-card" style={{ maxWidth: 680 }}>
        <div className="fcard-head">
          <Fuel size={16} />
          <span>Gastos del Cobro — {ruta?.nombre}</span>
        </div>
        <div className="fcard-body">
          <div className="fg fg-3">
            <div className="field">
              <label>Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div className="field">
              <label>Nombre del gasto<span className="req">*</span></label>
              <select value={nombre} onChange={e => setNombre(e.target.value)}>
                <option value="">— Seleccione —</option>
                {['Gasolina','Peaje','Alimentación','Parqueadero','Transporte','Comunicaciones','Papelería','Mantenimiento','Otro'].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Valor<span className="req">*</span></label>
              <div className="px-wrap"><span className="px">$</span><input value={valor} onChange={e => setValor(e.target.value)} placeholder="0" /></div>
            </div>
            <div className="field f-full">
              <label>Concepto<span className="req">*</span></label>
              <textarea value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Descripción detallada del gasto…" rows={2} />
            </div>
          </div>
        </div>
        <div className="form-bar">
          <button className="btn btn-gold" onClick={grabar} disabled={saving}>
            <Plus size={14} /> {saving ? 'Guardando…' : 'GRABAR GASTO'}
          </button>
          <div className="form-bar-right">
            <button className="nbtn" onClick={() => onNavigate('listado')}><ArrowLeft size={16} /></button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="gastos-list" style={{ maxWidth: 680 }}>
        <div className="gastos-head">
          <span>Gastos registrados hoy</span>
          <span>{gastos.length} gastos</span>
        </div>
        {gastos.length === 0 ? (
          <div className="tbl-empty" style={{ padding: '24px' }}>Sin gastos registrados hoy</div>
        ) : (
          gastos.map(g => (
            <div key={g.id} className="gasto-row">
              <div className="gasto-dot" />
              <div className="gasto-info">
                <div className="gasto-nombre">{g.nombre}</div>
                <div className="gasto-concepto">{g.concepto}</div>
              </div>
              <div className="gasto-valor">-${fmt(g.valor)}</div>
              <button className="gasto-del" onClick={() => eliminar(g.id)}><Trash2 size={14} /></button>
            </div>
          ))
        )}
        <div className="gastos-total">
          <span>Total gastos del día</span>
          <span className="gt-val">$ {fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}
