import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { fmt, unf, today, todayShort } from '../../utils';
import { CheckCircle, Printer, Eye } from 'lucide-react';
import { ToastType } from '../Toast';

interface Props {
  onNavigate: (v: string) => void;
  showToast: (msg: string, type: ToastType) => void;
}

export default function Totalizar({ onNavigate, showToast }: Props) {
  const { ruta } = useAuth();
  const [cobrado, setCobrado] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [meta, setMeta] = useState(0);
  const [efectivo, setEfectivo] = useState('');

  const load = useCallback(async () => {
    if (!ruta) return;
    const { data: abonos } = await supabase
      .from('abonos')
      .select('valor')
      .eq('ruta_id', ruta.id)
      .eq('fecha', today());
    setCobrado((abonos || []).reduce((a: number, x: { valor: number }) => a + x.valor, 0));

    const { data: gData } = await supabase
      .from('gastos')
      .select('valor')
      .eq('ruta_id', ruta.id)
      .eq('fecha', today());
    setGastos((gData || []).reduce((a: number, x: { valor: number }) => a + x.valor, 0));

    const { data: creds } = await supabase
      .from('creditos')
      .select('cuota')
      .eq('ruta_id', ruta.id)
      .neq('estado', 'Finalizado');
    setMeta((creds || []).reduce((a: number, x: { cuota: number }) => a + x.cuota, 0));
  }, [ruta]);

  useEffect(() => { load(); }, [load]);

  const efectivoN = unf(efectivo);
  const real = cobrado - gastos;
  const diff = efectivoN - real;
  const faltante = diff < 0 ? Math.abs(diff) : 0;
  const sobrante = diff > 0 ? diff : 0;

  function Row({ label, value, color = '', big = false, input = false }: {
    label: string; value?: string; color?: string; big?: boolean; input?: boolean;
  }) {
    return (
      <tr>
        <td className="tot-label">{label}</td>
        <td className={`tot-value ${color} ${big ? 'tot-big' : ''}`}>
          {input ? (
            <input
              className="tot-input"
              value={efectivo}
              onChange={e => setEfectivo(e.target.value)}
              placeholder="$ 0"
            />
          ) : value}
        </td>
      </tr>
    );
  }

  return (
    <div className="view-content">
      <div className="tot-wrap">
        <div className="tot-title">Liquidación Diaria — Totalizar Cobros</div>
        <table className="tot-table">
          <thead>
            <tr className="tot-head-row">
              <th className="tot-label">Campo</th>
              <th className="tot-value">Valor</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Fecha de Liquidación:" value={todayShort()} />
            <tr style={{ background: '#1a1200' }}>
              <td className="tot-label" style={{ fontWeight: 700, fontSize: 14 }}>META DE RECAUDO HOY:</td>
              <td className="tot-value" style={{ color: '#EFBF04', fontWeight: 800, fontSize: 18 }}>${fmt(meta)}</td>
            </tr>
            <Row label="Ruta a liquidar:" value={ruta?.nombre || ''} />

            <tr className="tot-section-row"><td colSpan={2}>Entradas</td></tr>
            <Row label="Total Cobrado:" value={'$ ' + fmt(cobrado)} color="green" />

            <tr className="tot-section-row"><td colSpan={2}>Salidas</td></tr>
            <tr>
              <td className="tot-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Total Gastos:
                <button className="tot-link-btn" onClick={() => onNavigate('gastos')}>
                  <Eye size={12} /> VER
                </button>
              </td>
              <td className="tot-value red">$ {fmt(gastos)}</td>
            </tr>

            <tr className="tot-section-row"><td colSpan={2}>Resultado</td></tr>
            <tr className="tot-highlight">
              <td className="tot-label" style={{ fontSize: 15, fontWeight: 700 }}>VR. REAL A ENTREGAR:</td>
              <td className="tot-value" style={{ fontSize: 20, color: '#EFBF04' }}>$ {fmt(real)}</td>
            </tr>
            <Row label="Valor Faltante:" value={'$ ' + fmt(faltante)} color="red" />
            <Row label="Valor Sobrante:" value={'$ ' + fmt(sobrante)} color="green" />
            <tr style={{ background: '#1a1200' }}>
              <td className="tot-label" style={{ fontWeight: 700 }}>Entrega en Efectivo:</td>
              <td className="tot-value">
                <input className="tot-input" value={efectivo} onChange={e => setEfectivo(e.target.value)} placeholder="$ 0" />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="tot-actions">
          <button className="btn btn-gold btn-lg" onClick={() => {
            if (!efectivoN) { showToast('Ingresa el valor en efectivo', 'warn'); return; }
            showToast('Liquidación cerrada exitosamente', 'success');
          }}>
            <CheckCircle size={16} /> TOTALIZAR COBROS
          </button>
          <button className="btn btn-outline-gold btn-lg" onClick={() => showToast('Generando recibo de cierre…', 'info')}>
            <Printer size={16} /> Imprimir Recibo
          </button>
        </div>
      </div>
    </div>
  );
}
