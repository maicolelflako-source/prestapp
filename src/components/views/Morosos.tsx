import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Cliente, Credito } from '../../types';
import { fmt } from '../../utils';
import { AlertTriangle, Eye, CheckCircle } from 'lucide-react';
import { ToastType } from '../Toast';

interface Props {
  onEditClient: (c: Cliente, cr: Credito) => void;
  showToast: (msg: string, type: ToastType) => void;
}

interface Row { cliente: Cliente; credito: Credito; diasMora: number; }

export default function Morosos({ onEditClient }: Props) {
  const { ruta } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Row | null>(null);

  const load = useCallback(async () => {
    if (!ruta) return;
    setLoading(true);
    const { data: clientes } = await supabase.from('clientes').select('*').eq('ruta_id', ruta.id).eq('activo', true);
    const { data: creditos } = await supabase.from('creditos').select('*').eq('ruta_id', ruta.id).eq('estado', 'Atrasado');

    const built: Row[] = [];
    (creditos || []).forEach((cr: Credito) => {
      const c = (clientes || []).find((cl: Cliente) => cl.id === cr.cliente_id);
      if (c) {
        const fechaIni = new Date(cr.fecha_ini);
        const dias = Math.floor((new Date().getTime() - fechaIni.getTime()) / (1000 * 60 * 60 * 24));
        built.push({ cliente: c, credito: cr, diasMora: dias });
      }
    });
    built.sort((a, b) => b.diasMora - a.diasMora);
    setRows(built);
    setLoading(false);
  }, [ruta]);

  useEffect(() => { load(); }, [load]);

  if (!rows.length && !loading) {
    return (
      <div className="view-content">
        <div className="empty-state">
          <CheckCircle size={56} color="#EFBF04" />
          <h3>Sin clientes morosos</h3>
          <p>Todos los clientes de la ruta están al día.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-content">
      <div className="morosos-header">
        <AlertTriangle size={20} color="#ef5350" />
        <span>{rows.length} clientes con pagos en atraso</span>
      </div>

      <div className="coll-card">
        <div className="coll-head">
          <div className="coll-head-title"><AlertTriangle size={16} /> Clientes Morosos — {ruta?.nombre}</div>
        </div>
        <div className="tbl-wrap">
          {loading ? <div className="tbl-loading">Cargando…</div> : (
            <table className="coll-tbl">
              <thead>
                <tr>
                  <th className="left">Cliente</th>
                  <th>Cédula</th>
                  <th>Teléfono</th>
                  <th>Saldo</th>
                  <th>C.Pend</th>
                  <th>Días Mora</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.credito.id} className="row-red">
                    <td className="left client-name">{row.cliente.nombre}</td>
                    <td className="mono">{row.cliente.cedula}</td>
                    <td>{row.cliente.telefono || '—'}</td>
                    <td className="mono red">${fmt(row.credito.saldo_capital + row.credito.saldo_utilidad)}</td>
                    <td><span className="cell-pend">{row.credito.cuotas_pend}</span></td>
                    <td>
                      <span className="mora-badge" style={{ background: row.diasMora > 30 ? '#ef5350' : '#f9a825', color: '#000' }}>
                        {row.diasMora} días
                      </span>
                    </td>
                    <td><span className="status-pill sp-late">ATRASADO</span></td>
                    <td>
                      <button className="det-btn" onClick={() => setSelected(row)}>
                        <Eye size={13} /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <div className="overlay open" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <AlertTriangle size={18} />
              <span className="modal-title">{selected.cliente.nombre}</span>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row"><span className="dl">Cédula</span><span className="dv">{selected.cliente.cedula}</span></div>
              <div className="detail-row"><span className="dl">Teléfono</span><span className="dv">{selected.cliente.telefono}</span></div>
              <div className="detail-row"><span className="dl">Dirección</span><span className="dv">{selected.cliente.direccion}</span></div>
              <div className="detail-row"><span className="dl">Saldo Total</span><span className="dv mono red">${fmt(selected.credito.saldo_capital + selected.credito.saldo_utilidad)}</span></div>
              <div className="detail-row"><span className="dl">Cuotas Pend.</span><span className="dv red">{selected.credito.cuotas_pend}</span></div>
              <div className="detail-row"><span className="dl">Días Mora</span><span className="dv red">{selected.diasMora} días</span></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Cerrar</button>
              <button className="btn btn-gold" onClick={() => { onEditClient(selected.cliente, selected.credito); setSelected(null); }}>
                Gestionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
