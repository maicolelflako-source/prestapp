import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Cliente, Credito, Abono } from '../../types';
import { Users, CheckCircle, AlertCircle, Target, Search, Plus, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { fmt, today } from '../../utils';
import { ToastType } from '../Toast';

interface Props {
  onNavigate: (v: string) => void;
  onEditClient: (c: Cliente, credito?: Credito) => void;
  showToast: (msg: string, type: ToastType) => void;
}

interface Row {
  cliente: Cliente;
  credito: Credito;
  abonoHoy: number;
  applied: boolean;
  abonoInput: string;
}

export default function ListadoGeneral({ onNavigate, onEditClient, showToast }: Props) {
  const { profile, ruta } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Row | null>(null);
  const [cobradoHoy, setCobradoHoy] = useState(0);

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

    const { data: abonos } = await supabase
      .from('abonos')
      .select('*')
      .eq('ruta_id', ruta.id)
      .eq('fecha', today());

    const abonoMap: Record<string, { valor: number; id: string }> = {};
    (abonos || []).forEach((a: Abono) => {
      if (!abonoMap[a.credito_id] || a.valor > abonoMap[a.credito_id].valor) {
        abonoMap[a.credito_id] = { valor: a.valor, id: a.id };
      }
    });

    const built: Row[] = [];
    (clientes || []).forEach((c: Cliente) => {
      const cred = (creditos || []).find((cr: Credito) => cr.cliente_id === c.id);
      if (cred) {
        const ab = abonoMap[cred.id];
        built.push({
          cliente: c,
          credito: cred,
          abonoHoy: ab?.valor || 0,
          applied: !!ab,
          abonoInput: ab ? fmt(ab.valor) : '',
        });
      }
    });

    setRows(built);
    setCobradoHoy(built.reduce((a, r) => a + r.abonoHoy, 0));
    setLoading(false);
  }, [ruta]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(r =>
    !search || r.cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
    r.cliente.cedula.includes(search)
  );

  async function applyAbono(row: Row, valor: number) {
    if (!profile || !ruta) return;
    const v = valor || row.credito.cuota;
    if (!v) { showToast('Ingresa el valor del abono', 'warn'); return; }

    const { error } = await supabase.from('abonos').insert({
      credito_id: row.credito.id,
      cliente_id: row.cliente.id,
      ruta_id: ruta.id,
      cobrador_id: profile.id,
      fecha: today(),
      valor: v,
      aplicado: true,
    });
    if (error) { showToast('Error al aplicar abono', 'error'); return; }

    const newSaldo = Math.max(0, row.credito.saldo_capital - v);
    const newPend = Math.max(0, row.credito.cuotas_pend - 1);
    const newCanc = row.credito.cuotas_canc + 1;
    await supabase.from('creditos').update({
      saldo_capital: newSaldo,
      cuotas_pend: newPend,
      cuotas_canc: newCanc,
      updated_at: new Date().toISOString(),
    }).eq('id', row.credito.id);

    showToast(`Abono de $${fmt(v)} aplicado a ${row.cliente.nombre}`, 'success');
    load();
  }

  function updateInput(creditoId: string, val: string) {
    setRows(prev => prev.map(r =>
      r.credito.id === creditoId ? { ...r, abonoInput: val } : r
    ));
  }

  function rowClass(cr: Credito) {
    if (cr.color_type === 'red') return 'row-red';
    if (cr.color_type === 'purple') return 'row-purple';
    if (cr.color_type === 'green') return 'row-green';
    if (cr.color_type === 'blue') return 'row-blue';
    return 'row-yellow';
  }

  const total = rows.length;
  const activos = rows.filter(r => r.credito.estado === 'Activo').length;
  const morosos = rows.filter(r => r.credito.estado === 'Atrasado').length;
  const meta = rows.reduce((a, r) => a + r.credito.cuota, 0);

  return (
    <div className="view-content">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-body">
            <div className="stat-label">Total Créditos</div>
            <div className="stat-value">{total}</div>
            <div className="stat-sub">en cartera activa</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><CheckCircle size={20} /></div>
          <div className="stat-body">
            <div className="stat-label">Al Día</div>
            <div className="stat-value">{activos}</div>
            <div className="stat-sub">créditos activos</div>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><AlertCircle size={20} /></div>
          <div className="stat-body">
            <div className="stat-label">Morosos</div>
            <div className="stat-value">{morosos}</div>
            <div className="stat-sub">con atraso</div>
          </div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon"><Target size={20} /></div>
          <div className="stat-body">
            <div className="stat-label">Meta del Día</div>
            <div className="stat-value">${fmt(meta)}</div>
            <div className="stat-sub">a recaudar hoy</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="legend-bar">
        <span className="legend-title">Leyenda:</span>
        <div className="legend-item"><span className="ldot" style={{ background: '#ef5350' }} />CLAVOS</div>
        <div className="legend-item"><span className="ldot" style={{ background: '#f9a825' }} />Vencidos</div>
        <div className="legend-item"><span className="ldot" style={{ background: '#2e7d32' }} />Dos fechas sin pagar</div>
        <div className="legend-item"><span className="ldot" style={{ background: '#7b1fa2' }} />Próx. a renovar</div>
        <div className="legend-item"><span className="ldot" style={{ background: '#1565c0' }} />Quincenales</div>
      </div>

      {/* Table card */}
      <div className="coll-card">
        <div className="coll-head">
          <div className="coll-head-title">
            <Users size={16} />
            <span>Créditos a Liquidar — {ruta?.nombre}</span>
          </div>
          <div className="coll-head-stats">
            <div className="hs-item"><span className="hs-val">${fmt(cobradoHoy)}</span><span className="hs-lbl">Cobrado</span></div>
            <div className="hs-item"><span className="hs-val">{total}</span><span className="hs-lbl">Total</span></div>
            <div className="hs-item"><span className="hs-val">{rows.filter(r => !r.applied).length}</span><span className="hs-lbl">Pend.</span></div>
          </div>
          <div className="coll-head-actions">
            <div className="search-wrap">
              <Search size={13} />
              <input
                placeholder="Buscar cliente…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => onNavigate('nuevo-cliente')}>
              <Plus size={13} /> Nuevo
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          {loading ? (
            <div className="tbl-loading">Cargando créditos…</div>
          ) : filtered.length === 0 ? (
            <div className="tbl-empty">Sin resultados</div>
          ) : (
            <table className="coll-tbl">
              <thead>
                <tr>
                  <th>CPen</th>
                  <th>CCan</th>
                  <th>Saldo</th>
                  <th className="left">Cliente</th>
                  <th>Cuota</th>
                  <th>Abono</th>
                  <th></th>
                  <th>Aplicado</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Mora</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.credito.id} className={rowClass(row.credito)}>
                    <td><span className="cell-pend">{row.credito.cuotas_pend}</span></td>
                    <td><span className="cell-canc">{row.credito.cuotas_canc}</span></td>
                    <td className="mono">${fmt(row.credito.saldo_capital)}</td>
                    <td className="left client-name">{row.cliente.nombre}</td>
                    <td className="mono">${fmt(row.credito.cuota)}</td>
                    <td>
                      {row.applied ? (
                        <span className="mono abono-applied">${fmt(row.abonoHoy)}</span>
                      ) : (
                        <input
                          className="abono-input"
                          type="text"
                          value={row.abonoInput}
                          placeholder={fmt(row.credito.cuota)}
                          onChange={e => updateInput(row.credito.id, e.target.value)}
                        />
                      )}
                    </td>
                    <td></td>
                    <td>
                      {row.applied ? (
                        <span className="applied-badge"><CheckCircle size={11} /> OK</span>
                      ) : (
                        <button
                          className="click-btn"
                          onClick={() => {
                            const val = parseFloat(row.abonoInput.replace(/[^0-9.]/g, '')) || row.credito.cuota;
                            applyAbono(row, val);
                          }}
                        >
                          CLICK
                        </button>
                      )}
                    </td>
                    <td>
                      {row.applied
                        ? <span className="applied-date">{today()}</span>
                        : <span className="dash">—</span>}
                    </td>
                    <td>
                      <span className={`status-pill ${row.credito.estado === 'Atrasado' ? 'sp-late' : 'sp-active'}`}>
                        {row.credito.estado.toUpperCase()}
                      </span>
                    </td>
                    <td><span className="pago-badge">{row.credito.forma_pago}</span></td>
                    <td>
                      <button className="det-btn" onClick={() => { setSelected(row); }}>
                        <Eye size={13} /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="coll-footer">
          <span className="footer-cobrado">
            <CheckCircle size={14} />
            Total cobrado hoy: <strong>${fmt(cobradoHoy)}</strong>
          </span>
          <div className="footer-right">
            <button className="btn btn-outline btn-sm" onClick={load}>
              Actualizar
            </button>
            <button className="btn btn-gold btn-sm" onClick={() => onNavigate('totalizar')}>
              Totalizar cobros
            </button>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="overlay open" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <Users size={18} />
              <span className="modal-title">{selected.cliente.nombre}</span>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">Contacto</div>
              <div className="detail-row"><span className="dl">Cédula</span><span className="dv">{selected.cliente.cedula}</span></div>
              <div className="detail-row"><span className="dl">Teléfono</span><span className="dv">{selected.cliente.telefono || '—'}</span></div>
              <div className="detail-row"><span className="dl">Dirección</span><span className="dv">{selected.cliente.direccion || '—'}</span></div>

              <div className="detail-section">Crédito</div>
              <div className="detail-row"><span className="dl">No. Crédito</span><span className="dv">{selected.credito.credito_no}</span></div>
              <div className="detail-row"><span className="dl">Capital</span><span className="dv mono">${fmt(selected.credito.capital)}</span></div>
              <div className="detail-row"><span className="dl">Cuota</span><span className="dv mono">${fmt(selected.credito.cuota)}</span></div>
              <div className="detail-row"><span className="dl">Forma de Pago</span><span className="dv">{selected.credito.forma_pago}</span></div>
              <div className="detail-row"><span className="dl">Cuotas Pend.</span><span className="dv red">{selected.credito.cuotas_pend}</span></div>
              <div className="detail-row"><span className="dl">Cuotas Canc.</span><span className="dv green">{selected.credito.cuotas_canc}</span></div>

              <div className="detail-section">Saldos</div>
              <div className="detail-row"><span className="dl">Saldo Capital</span><span className="dv mono red">${fmt(selected.credito.saldo_capital)}</span></div>
              <div className="detail-row"><span className="dl">Saldo Utilidad</span><span className="dv mono">${fmt(selected.credito.saldo_utilidad)}</span></div>
              <div className="detail-row highlight"><span className="dl">TOTAL DEUDA</span><span className="dv mono gold">${fmt(selected.credito.saldo_capital + selected.credito.saldo_utilidad)}</span></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Cerrar</button>
              <button className="btn btn-gold" onClick={() => { onEditClient(selected.cliente, selected.credito); setSelected(null); }}>
                Editar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
