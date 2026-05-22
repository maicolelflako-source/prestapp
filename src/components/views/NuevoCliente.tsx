import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Cliente, Credito } from '../../types';
import { fmt, unf, today } from '../../utils';
import { Save, Eraser, ArrowLeft, Receipt } from 'lucide-react';
import { ToastType } from '../Toast';

interface Props {
  editCliente?: Cliente;
  editCredito?: Credito;
  onNavigate: (v: string) => void;
  showToast: (msg: string, type: ToastType) => void;
}

export default function NuevoCliente({ editCliente, editCredito, onNavigate, showToast }: Props) {
  const { profile, ruta } = useAuth();

  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [garante, setGarante] = useState('');
  const [prioridad, setPrioridad] = useState('');

  const [creditoNo, setCreditoNo] = useState('');
  const [fechaIni, setFechaIni] = useState(today());
  const [fechaFin, setFechaFin] = useState('');
  const [capital, setCapital] = useState('');
  const [cuota, setCuota] = useState('');
  const [cuotasPactadas, setCuotasPactadas] = useState('');
  const [fechaCuota, setFechaCuota] = useState(today());
  const [formaPago, setFormaPago] = useState('DIARIA');
  const [estado, setEstado] = useState('Activo');

  const [saldoCapital, setSaldoCapital] = useState('');
  const [saldoUtilidad, setSaldoUtilidad] = useState('');
  const [saldoTotal, setSaldoTotal] = useState('');
  const [cuotasPend, setCuotasPend] = useState('');
  const [cuotasCanc, setCuotasCanc] = useState('');
  const [notas, setNotas] = useState('');
  const [tasa, setTasa] = useState('');
  const [plazo, setPlazo] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editCliente) {
      setCedula(editCliente.cedula);
      setNombre(editCliente.nombre);
      setDireccion(editCliente.direccion || '');
      setTelefono(editCliente.telefono || '');
      setEmail(editCliente.email || '');
      setGarante(editCliente.garante || '');
      setPrioridad(String(editCliente.prioridad || ''));
    }
    if (editCredito) {
      setCreditoNo(editCredito.credito_no || '');
      setFechaIni(editCredito.fecha_ini || today());
      setFechaFin(editCredito.fecha_fin || '');
      setCapital(fmt(editCredito.capital));
      setCuota(fmt(editCredito.cuota));
      setCuotasPactadas(String(editCredito.cuotas_pactadas || ''));
      setFechaCuota(editCredito.fecha_cuota || today());
      setFormaPago(editCredito.forma_pago || 'DIARIA');
      setEstado(editCredito.estado || 'Activo');
      setSaldoCapital(fmt(editCredito.saldo_capital));
      setSaldoUtilidad(fmt(editCredito.saldo_utilidad));
      setSaldoTotal(fmt(editCredito.saldo_capital + editCredito.saldo_utilidad));
      setCuotasPend(String(editCredito.cuotas_pend || ''));
      setCuotasCanc(String(editCredito.cuotas_canc || ''));
      setNotas(editCredito.notas || '');
    }
    if (!editCliente && !editCredito) {
      clearAll();
    }
  }, [editCliente, editCredito]);

  function clearAll() {
    setCedula(''); setNombre(''); setDireccion(''); setTelefono('');
    setEmail(''); setGarante(''); setPrioridad(''); setCreditoNo('');
    setFechaIni(today()); setFechaFin(''); setCapital(''); setCuota('');
    setCuotasPactadas(''); setFechaCuota(today()); setFormaPago('DIARIA');
    setEstado('Activo'); setSaldoCapital(''); setSaldoUtilidad('');
    setSaldoTotal(''); setCuotasPend(''); setCuotasCanc('');
    setNotas(''); setTasa(''); setPlazo('');
  }

  function calcAuto() {
    const cap = unf(capital);
    const cu = unf(cuota);
    const cp = parseInt(cuotasPactadas) || 0;
    if (cp > 0) setPlazo(cp + ' días');
    if (cap > 0 && cu > 0 && cp > 0) {
      const total = cu * cp;
      const util = total - cap;
      const t = ((util / cap) * 100).toFixed(4);
      setTasa(t + ' %');
      setSaldoCapital(fmt(cap));
      setSaldoUtilidad(fmt(util > 0 ? util : 0));
      setSaldoTotal(fmt(cap + (util > 0 ? util : 0)));
    }
  }

  function calcTotal() {
    const sc = unf(saldoCapital);
    const su = unf(saldoUtilidad);
    setSaldoTotal(fmt(sc + su));
  }

  async function save() {
    if (!cedula || !nombre || !ruta || !profile) {
      showToast('Completa cédula, nombre y ruta', 'error');
      return;
    }
    setSaving(true);

    try {
      let clienteId = editCliente?.id;

      if (editCliente) {
        await supabase.from('clientes').update({
          cedula, nombre, direccion, telefono, email, garante,
          prioridad: parseInt(prioridad) || 999,
          updated_at: new Date().toISOString(),
        }).eq('id', editCliente.id);
      } else {
        const { data: nc, error: ce } = await supabase.from('clientes').insert({
          ruta_id: ruta.id,
          cedula, nombre, direccion, telefono, email, garante,
          prioridad: parseInt(prioridad) || 999,
          activo: true,
        }).select().single();
        if (ce) { showToast('Error: ' + ce.message, 'error'); setSaving(false); return; }
        clienteId = nc.id;
      }

      const creditoData = {
        cliente_id: clienteId,
        ruta_id: ruta.id,
        credito_no: creditoNo || 'CR-' + Date.now(),
        fecha_ini: fechaIni,
        fecha_fin: fechaFin || null,
        capital: unf(capital),
        cuota: unf(cuota),
        cuotas_pactadas: parseInt(cuotasPactadas) || 0,
        fecha_cuota: fechaCuota || null,
        forma_pago: formaPago,
        estado,
        saldo_capital: unf(saldoCapital),
        saldo_utilidad: unf(saldoUtilidad),
        cuotas_pend: parseInt(cuotasPend) || 0,
        cuotas_canc: parseInt(cuotasCanc) || 0,
        notas,
        updated_at: new Date().toISOString(),
      };

      if (editCredito) {
        await supabase.from('creditos').update(creditoData).eq('id', editCredito.id);
      } else {
        await supabase.from('creditos').insert(creditoData);
      }

      showToast(editCliente ? 'Cliente actualizado' : 'Cliente registrado correctamente', 'success');
      setTimeout(() => onNavigate('listado'), 600);
    } catch (e) {
      showToast('Error inesperado', 'error');
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, node: React.ReactNode, req = false) => (
    <div className="field">
      <label>{label}{req && <span className="req">*</span>}</label>
      {node}
    </div>
  );

  return (
    <div className="view-content">
      {/* Section 1 */}
      <div className="form-card">
        <div className="fcard-head">
          <div className="fcard-num">1</div>
          <span>Identificación y Contacto</span>
        </div>
        <div className="fcard-body">
          <div className="fg fg-3">
            {field('Cédula del cliente', <input value={cedula} onChange={e => setCedula(e.target.value)} placeholder="Ej: 5,462,349" />, true)}
            <div className="field f-2">
              <label>Nombre completo<span className="req">*</span></label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="APELLIDO NOMBRE" />
            </div>
            <div className="field f-2">
              <label>Dirección de cobro<span className="req">*</span></label>
              <input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle, Barrio, referencia" />
            </div>
            {field('Teléfono', <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="300 000 0000" type="tel" />, true)}
            {field('Correo electrónico', <input value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" type="email" />)}
            {field('Ruta', <input value={ruta?.nombre || ''} readOnly className="readonly" />)}
            {field('Prioridad', <input value={prioridad} onChange={e => setPrioridad(e.target.value)} type="number" placeholder="1 - 999" min={1} />)}
            {field('Garante / Referencia', <input value={garante} onChange={e => setGarante(e.target.value)} placeholder="Nombre, relación, teléfono" />)}
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="form-card">
        <div className="fcard-head">
          <div className="fcard-num">2</div>
          <span>Detalles del Préstamo</span>
        </div>
        <div className="fcard-body">
          <div className="fg fg-3">
            {field('Crédito No.', <input value={creditoNo} onChange={e => setCreditoNo(e.target.value)} placeholder="CR-000000" />)}
            {field('Fecha inicial', <input type="date" value={fechaIni} onChange={e => setFechaIni(e.target.value)} />, true)}
            {field('Fecha final', <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />)}
            <div className="field">
              <label>Valor capital<span className="req">*</span></label>
              <div className="px-wrap"><span className="px">$</span><input value={capital} onChange={e => { setCapital(e.target.value); }} onBlur={calcAuto} placeholder="0" /></div>
            </div>
            <div className="field">
              <label>Cuota fija<span className="req">*</span></label>
              <div className="px-wrap"><span className="px">$</span><input value={cuota} onChange={e => setCuota(e.target.value)} onBlur={calcAuto} placeholder="0" /></div>
            </div>
            {field('Cuotas pactadas', <input value={cuotasPactadas} onChange={e => setCuotasPactadas(e.target.value)} onBlur={calcAuto} type="number" placeholder="0" />)}
            {field('Fecha 1ra cuota', <input type="date" value={fechaCuota} onChange={e => setFechaCuota(e.target.value)} />)}
            {field('Forma de pago', (
              <select value={formaPago} onChange={e => setFormaPago(e.target.value)}>
                <option value="DIARIA">Diaria</option>
                <option value="SEMANAL">Semanal</option>
                <option value="QUINCENAL">Quincenal</option>
                <option value="MENSUAL">Mensual</option>
              </select>
            ))}
            {field('Estado', (
              <select value={estado} onChange={e => setEstado(e.target.value)}>
                <option value="Activo">Activo</option>
                <option value="Atrasado">Atrasado</option>
                <option value="Nuevo">Nuevo</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            ))}
          </div>
          <button className="btn btn-warn mt-sm" onClick={() => { calcAuto(); showToast('Cuota generada', 'success'); }}>
            <Receipt size={14} /> GENERAR CUOTA
          </button>
        </div>
      </div>

      {/* Section 3 */}
      <div className="form-card">
        <div className="fcard-head">
          <div className="fcard-num">3</div>
          <span>Saldos y Contabilidad</span>
        </div>
        <div className="fcard-body">
          <div className="fg fg-3">
            <div className="field">
              <label>Saldo capital</label>
              <div className="px-wrap"><span className="px">$</span><input value={saldoCapital} onChange={e => { setSaldoCapital(e.target.value); calcTotal(); }} placeholder="0" /></div>
            </div>
            <div className="field">
              <label>Saldo utilidad</label>
              <div className="px-wrap"><span className="px">$</span><input value={saldoUtilidad} onChange={e => { setSaldoUtilidad(e.target.value); calcTotal(); }} placeholder="0" /></div>
            </div>
            <div className="field">
              <label>Saldo total</label>
              <div className="px-wrap"><span className="px green-px">$</span><input value={saldoTotal} readOnly className="calc" /></div>
            </div>
            {field('Plazo (días)', <input value={plazo} readOnly className="readonly" placeholder="0 días" />)}
            {field('Tasa de interés %', <input value={tasa} readOnly className="readonly" placeholder="0.0000 %" />)}
            {field('Cuotas pendientes', <input value={cuotasPend} onChange={e => setCuotasPend(e.target.value)} type="number" placeholder="0" />)}
            {field('Cuotas canceladas', <input value={cuotasCanc} onChange={e => setCuotasCanc(e.target.value)} type="number" placeholder="0" />)}
            <div className="field f-full">
              <label>Notas del cobrador</label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones, acuerdos especiales…" rows={3} />
            </div>
          </div>
        </div>
        <div className="form-bar">
          <button className="btn btn-gold" onClick={save} disabled={saving}>
            <Save size={14} /> {saving ? 'Guardando…' : 'Guardar Cambios'}
          </button>
          <button className="btn btn-outline-gold" onClick={clearAll}>
            <Eraser size={14} /> Limpiar
          </button>
          <div className="form-bar-right">
            <button className="nbtn" onClick={() => onNavigate('listado')}><ArrowLeft size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
