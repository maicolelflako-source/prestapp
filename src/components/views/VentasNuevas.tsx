import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Cliente, Credito } from '../../types';
import { fmt, unf, today } from '../../utils';
import { Search, Save, Eraser, ArrowLeft, Receipt } from 'lucide-react';
import { ToastType } from '../Toast';

interface Props {
  onNavigate: (v: string) => void;
  showToast: (msg: string, type: ToastType) => void;
}

export default function VentasNuevas({ onNavigate, showToast }: Props) {
  const { profile, ruta } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Cliente[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);

  const [capital, setCapital] = useState('');
  const [cuota, setCuota] = useState('');
  const [cuotasPactadas, setCuotasPactadas] = useState('');
  const [fechaIni, setFechaIni] = useState(today());
  const [fechaFin, setFechaFin] = useState('');
  const [fechaCuota, setFechaCuota] = useState(today());
  const [formaPago, setFormaPago] = useState('DIARIA');
  const [tasa, setTasa] = useState('');
  const [saldoCap, setSaldoCap] = useState('');
  const [saldoUtil, setSaldoUtil] = useState('');
  const [totalPrestamo, setTotalPrestamo] = useState('');
  const [showCalc, setShowCalc] = useState(false);
  const [saving, setSaving] = useState(false);

  async function search(v: string) {
    setQuery(v);
    if (!v || !ruta) { setSuggestions([]); return; }
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('ruta_id', ruta.id)
      .or(`nombre.ilike.%${v}%,cedula.ilike.%${v}%`)
      .limit(8);
    setSuggestions(data || []);
  }

  function selectClient(c: Cliente) {
    setCliente(c);
    setQuery(c.nombre + ' (' + c.cedula + ')');
    setSuggestions([]);
  }

  function calcVenta() {
    const cap = unf(capital);
    const cu = unf(cuota);
    const cp = parseInt(cuotasPactadas) || 0;
    if (cap > 0 && cu > 0 && cp > 0) {
      const total = cu * cp;
      const util = Math.max(0, total - cap);
      const t = ((util / cap) * 100).toFixed(4);
      setTasa(t + ' %');
      setSaldoCap(fmt(cap));
      setSaldoUtil(fmt(util));
      setTotalPrestamo(fmt(cap + util));
      setShowCalc(true);
      showToast('Cuota calculada: $' + fmt(cu) + ' x ' + cp + ' = $' + fmt(total), 'success');
    } else {
      showToast('Ingresa capital, cuota y cuotas pactadas', 'warn');
    }
  }

  async function saveVenta() {
    if (!cliente || !capital || !cuota || !ruta || !profile) {
      showToast('Selecciona un cliente e ingresa los datos del crédito', 'error');
      return;
    }
    setSaving(true);
    const cap = unf(capital);
    const cu = unf(cuota);
    const cp = parseInt(cuotasPactadas) || 0;
    const util = Math.max(0, (cu * cp) - cap);

    const { error } = await supabase.from('creditos').insert({
      cliente_id: cliente.id,
      ruta_id: ruta.id,
      credito_no: 'CR-' + Date.now(),
      fecha_ini: fechaIni,
      fecha_fin: fechaFin || null,
      capital: cap,
      cuota: cu,
      cuotas_pactadas: cp,
      fecha_cuota: fechaCuota || null,
      forma_pago: formaPago,
      estado: 'Activo',
      saldo_capital: cap,
      saldo_utilidad: util,
      cuotas_pend: cp,
      cuotas_canc: 0,
      color_type: 'yellow',
      notas: '',
    });
    setSaving(false);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    showToast('Venta nueva guardada para ' + cliente.nombre, 'success');
    clearAll();
    setTimeout(() => onNavigate('listado'), 600);
  }

  function clearAll() {
    setCliente(null); setQuery('');
    setCapital(''); setCuota(''); setCuotasPactadas('');
    setFechaIni(today()); setFechaFin(''); setFechaCuota(today());
    setFormaPago('DIARIA'); setTasa(''); setSaldoCap('');
    setSaldoUtil(''); setTotalPrestamo(''); setShowCalc(false);
  }

  return (
    <div className="view-content">
      <div className="form-card">
        <div className="fcard-head">
          <span>Buscar Cliente para Venta Nueva</span>
        </div>
        <div className="fcard-body">
          <div className="field" style={{ position: 'relative' }}>
            <label>Buscar cliente (nombre o cédula)<span className="req">*</span></label>
            <div className="search-wrap">
              <Search size={13} />
              <input
                value={query}
                onChange={e => search(e.target.value)}
                placeholder="Escribe nombre o cédula…"
                autoComplete="off"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="ac-list open">
                {suggestions.map(c => (
                  <div key={c.id} className="ac-item" onClick={() => selectClient(c)}>
                    {c.nombre} — {c.cedula}
                  </div>
                ))}
              </div>
            )}
          </div>

          {cliente && (
            <div className="client-info-box">
              <div className="ci-title">Cliente encontrado</div>
              <div className="fg fg-3">
                <div className="field"><label>Ruta</label><input readOnly value={ruta?.nombre || ''} className="readonly" /></div>
                <div className="field"><label>Dirección</label><input readOnly value={cliente.direccion} className="readonly" /></div>
                <div className="field"><label>Teléfono</label><input readOnly value={cliente.telefono} className="readonly" /></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {cliente && (
        <div className="form-card">
          <div className="fcard-head"><span>Nuevo Crédito para {cliente.nombre}</span></div>
          <div className="fcard-body">
            <div className="fg fg-3">
              <div className="field"><label>Fecha inicial</label><input type="date" value={fechaIni} onChange={e => setFechaIni(e.target.value)} /></div>
              <div className="field"><label>Fecha final</label><input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} /></div>
              <div className="field">
                <label>Capital<span className="req">*</span></label>
                <div className="px-wrap"><span className="px">$</span><input value={capital} onChange={e => setCapital(e.target.value)} placeholder="0" /></div>
              </div>
              <div className="field">
                <label>Cuota<span className="req">*</span></label>
                <div className="px-wrap"><span className="px">$</span><input value={cuota} onChange={e => setCuota(e.target.value)} placeholder="0" /></div>
              </div>
              <div className="field"><label>Cuotas pactadas</label><input type="number" value={cuotasPactadas} onChange={e => setCuotasPactadas(e.target.value)} placeholder="0" /></div>
              <div className="field"><label>Fecha 1ra cuota</label><input type="date" value={fechaCuota} onChange={e => setFechaCuota(e.target.value)} /></div>
              <div className="field">
                <label>Forma de pago</label>
                <select value={formaPago} onChange={e => setFormaPago(e.target.value)}>
                  <option value="DIARIA">Diaria</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="MENSUAL">Mensual</option>
                </select>
              </div>
              <div className="field"><label>Tasa %</label><input readOnly value={tasa} className="calc" placeholder="0.0000 %" /></div>
            </div>
            <button className="btn btn-warn mt-sm" onClick={calcVenta}>
              <Receipt size={14} /> GENERAR CUOTA
            </button>

            {showCalc && (
              <div className="calc-box">
                <div className="fg fg-3" style={{ marginTop: 12 }}>
                  <div className="field"><label>Saldo capital</label><div className="px-wrap"><span className="px">$</span><input readOnly value={saldoCap} className="calc" /></div></div>
                  <div className="field"><label>Saldo utilidad</label><div className="px-wrap"><span className="px">$</span><input readOnly value={saldoUtil} className="calc" /></div></div>
                  <div className="field"><label>Total préstamo</label><div className="px-wrap"><span className="px green-px">$</span><input readOnly value={totalPrestamo} className="calc-big" /></div></div>
                </div>
              </div>
            )}
          </div>
          <div className="form-bar">
            <button className="btn btn-gold" onClick={saveVenta} disabled={saving}>
              <Save size={14} /> {saving ? 'Guardando…' : 'Guardar Venta Nueva'}
            </button>
            <button className="btn btn-outline-gold" onClick={clearAll}><Eraser size={14} /> Limpiar</button>
            <div className="form-bar-right">
              <button className="nbtn" onClick={() => onNavigate('listado')}><ArrowLeft size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
