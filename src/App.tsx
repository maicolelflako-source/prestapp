import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import Toast, { ToastType } from './components/Toast';
import ListadoGeneral from './components/views/ListadoGeneral';
import NuevoCliente from './components/views/NuevoCliente';
import VentasNuevas from './components/views/VentasNuevas';
import Gastos from './components/views/Gastos';
import Totalizar from './components/views/Totalizar';
import EnrutaClientes from './components/views/EnrutaClientes';
import Morosos from './components/views/Morosos';
import SuscripcionView from './components/views/SuscripcionView';
import { ViewName, Cliente, Credito } from './types';
import { LayoutList, UserPlus, CreditCard, DollarSign, Calculator, Globe, Layers, AlertTriangle, RefreshCcw, Crown } from 'lucide-react';

const VIEW_TITLES: Record<ViewName, { label: string; Icon: React.ElementType }> = {
  listado: { label: 'LISTADO GENERAL', Icon: LayoutList },
  'nuevo-cliente': { label: 'CLIENTES NUEVOS', Icon: UserPlus },
  ventas: { label: 'VENTAS NUEVAS', Icon: CreditCard },
  gastos: { label: 'GASTOS DEL DÍA', Icon: DollarSign },
  totalizar: { label: 'TOTALIZAR VENTAS', Icon: Calculator },
  rutas: { label: 'ENRUTA CLIENTES', Icon: Globe },
  prioridad: { label: 'POR PRIORIDAD', Icon: Layers },
  morosos: { label: 'CLIENTES MOROSOS', Icon: AlertTriangle },
  suscripcion: { label: 'MI SUSCRIPCIÓN', Icon: Crown },
};

interface ToastState { message: string; type: ToastType; key: number; }

function AppInner() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<ViewName>('listado');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [morososCount, setMorososCount] = useState(0);
  const [editCliente, setEditCliente] = useState<Cliente | undefined>();
  const [editCredito, setEditCredito] = useState<Credito | undefined>();

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('ruta_id').eq('id', user.id).maybeSingle().then(({ data: prof }) => {
      if (prof?.ruta_id) {
        supabase.from('creditos').select('id', { count: 'exact', head: true }).eq('ruta_id', prof.ruta_id).eq('estado', 'Atrasado').then(({ count }) => {
          if (count !== null) setMorososCount(count);
        });
      }
    });
  }, [user]);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, key: Date.now() });
  }, []);

  function navigate(v: string) {
    setView(v as ViewName);
    if (v !== 'nuevo-cliente') {
      setEditCliente(undefined);
      setEditCredito(undefined);
    }
  }

  function editClient(c: Cliente, cr?: Credito) {
    setEditCliente(c);
    setEditCredito(cr);
    setView('nuevo-cliente');
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <RefreshCcw size={32} className="spin" color="#EFBF04" />
          <span>PrestaApp</span>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const { label, Icon } = VIEW_TITLES[view] || VIEW_TITLES.listado;

  function renderView() {
    switch (view) {
      case 'listado':
        return <ListadoGeneral onNavigate={navigate} onEditClient={editClient} showToast={showToast} />;
      case 'nuevo-cliente':
        return <NuevoCliente editCliente={editCliente} editCredito={editCredito} onNavigate={navigate} showToast={showToast} />;
      case 'ventas':
        return <VentasNuevas onNavigate={navigate} showToast={showToast} />;
      case 'gastos':
        return <Gastos onNavigate={navigate} showToast={showToast} />;
      case 'totalizar':
        return <Totalizar onNavigate={navigate} showToast={showToast} />;
      case 'rutas':
        return <EnrutaClientes showToast={showToast} />;
      case 'prioridad':
        return <EnrutaClientes showToast={showToast} />;
      case 'morosos':
        return <Morosos onEditClient={editClient} showToast={showToast} />;
      case 'suscripcion':
        return <SuscripcionView showToast={showToast} />;
    }
  }

  return (
    <div className="app">
      <Sidebar currentView={view} onNavigate={navigate} morososCount={morososCount} />
      <div className="main">
        <div className="topbar">
          <div className="tb-title">
            <Icon size={18} />
            <span>{label}</span>
          </div>
          <div className="tb-sep" />
          <span className="tb-chip">
            {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="main-content">
          {renderView()}
        </div>
      </div>
      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
