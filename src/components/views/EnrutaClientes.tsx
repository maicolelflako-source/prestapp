import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Cliente, Credito } from '../../types';
import { fmt } from '../../utils';
import { Globe, ArrowUp, ArrowDown, Save, Info } from 'lucide-react';
import { ToastType } from '../Toast';

interface Props {
  showToast: (msg: string, type: ToastType) => void;
}

interface Row {
  cliente: Cliente;
  credito?: Credito;
  newPriority: string;
}

export default function EnrutaClientes({ showToast }: Props) {
  const { ruta } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!ruta) return;
    setLoading(true);
    const { data: clientes } = await supabase
      .from('clientes')
      .select('*')
      .eq('ruta_id', ruta.id)
      .eq('activo', true)
      .order('prioridad');

    const { data: creditos } = await supabase
      .from('creditos')
      .select('*')
      .eq('ruta_id', ruta.id)
      .neq('estado', 'Finalizado');

    const built: Row[] = (clientes || []).map((c: Cliente) => ({
      cliente: c,
      credito: (creditos || []).find((cr: Credito) => cr.cliente_id === c.id),
      newPriority: String(c.prioridad),
    }));
    setRows(built);
    setLoading(false);
  }, [ruta]);

  useEffect(() => { load(); }, [load]);

  function updatePriority(clienteId: string, val: string) {
    setRows(prev => prev.map(r =>
      r.cliente.id === clienteId ? { ...r, newPriority: val } : r
    ));
  }

  async function saveAll() {
    setSaving(true);
    const updates = rows
      .filter(r => r.newPriority !== String(r.cliente.prioridad))
      .map(r => ({ id: r.cliente.id, prioridad: parseInt(r.newPriority) || r.cliente.prioridad }));

    for (const u of updates) {
      await supabase.from('clientes').update({ prioridad: u.prioridad, updated_at: new Date().toISOString() }).eq('id', u.id);
    }

    setSaving(false);
    showToast(`${updates.length} prioridades actualizadas`, 'success');
    load();
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const newRows = [...rows];
    const a = newRows[idx - 1];
    const b = newRows[idx];
    const tmp = b.newPriority;
    b.newPriority = a.newPriority;
    a.newPriority = tmp;
    [newRows[idx - 1], newRows[idx]] = [newRows[idx], newRows[idx - 1]];
    setRows(newRows);
  }

  function moveDown(idx: number) {
    if (idx === rows.length - 1) return;
    const newRows = [...rows];
    const a = newRows[idx];
    const b = newRows[idx + 1];
    const tmp = a.newPriority;
    a.newPriority = b.newPriority;
    b.newPriority = tmp;
    [newRows[idx], newRows[idx + 1]] = [newRows[idx + 1], newRows[idx]];
    setRows(newRows);
  }

  return (
    <div className="view-content">
      {/* Info box */}
      <div className="info-box">
        <Info size={16} />
        <div>
          <strong>Enrutamiento por Prioridad</strong>
          <p>Ingresa la nueva prioridad del cliente o usa las flechas para reordenar. El sistema reasignará las prioridades conservando el orden relativo de los demás clientes. Solo digita la nueva prioridad para el cliente que quieres cambiar.</p>
        </div>
      </div>

      <div className="coll-card">
        <div className="coll-head">
          <div className="coll-head-title"><Globe size={16} /> Enruta Clientes — {ruta?.nombre}</div>
          <button className="btn btn-gold btn-sm" onClick={saveAll} disabled={saving}>
            <Save size={13} /> {saving ? 'Guardando…' : 'Guardar Prioridades'}
          </button>
        </div>
        <div className="tbl-wrap">
          {loading ? <div className="tbl-loading">Cargando…</div> : (
            <table className="coll-tbl">
              <thead>
                <tr>
                  <th>Pri</th>
                  <th className="left">Cliente</th>
                  <th>Nueva Pri</th>
                  <th>Dirección de Cobro</th>
                  <th>Saldo</th>
                  <th>Cuota</th>
                  <th>Orden</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.cliente.id} className="row-yellow">
                    <td><span className="prio-badge">{row.cliente.prioridad}</span></td>
                    <td className="left client-name">{row.cliente.nombre}</td>
                    <td>
                      <input
                        className="prio-input"
                        type="number"
                        value={row.newPriority}
                        onChange={e => updatePriority(row.cliente.id, e.target.value)}
                        min={1}
                        max={999}
                      />
                    </td>
                    <td className="left" style={{ fontSize: 11, color: '#aaa' }}>{row.cliente.direccion}</td>
                    <td className="mono">{row.credito ? '$' + fmt(row.credito.saldo_capital) : '—'}</td>
                    <td className="mono">{row.credito ? '$' + fmt(row.credito.cuota) : '—'}</td>
                    <td>
                      <div className="order-btns">
                        <button className="order-btn" onClick={() => moveUp(idx)} disabled={idx === 0}><ArrowUp size={12} /></button>
                        <button className="order-btn" onClick={() => moveDown(idx)} disabled={idx === rows.length - 1}><ArrowDown size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
