import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import PlaceholderView from './components/views/PlaceholderView';
import { ViewName, Cliente, Credito } from './types';
import { LayoutList, UserPlus, CreditCard, DollarSign, Calculator, Globe, Layers, MapPin, AlertTriangle, Search, RefreshCw, Key, Settings, RefreshCcw } from 'lucide-react';

const VIEW_TITLES: Record<ViewName, { label: string; Icon: React.ElementType }> = {
  listado: { label: 'LISTADO GENERAL', Icon: LayoutList },
  'nuevo-cliente': { label: 'CLIENTES NUEVOS', Icon: UserPlus },
  ventas: { label: 'VENTAS NUEVAS', Icon: CreditCard },
  gastos: { label: 'GASTOS DEL DÍA', Icon: DollarSign },
  totalizar: { label: 'TOTALIZAR VENTAS', Icon: Calculator },
  rutas: { label: 'ENRUTA CLIENTES', Icon: Globe },
  prioridad: { label: 'POR PRIORIDAD', Icon: Layers },
  activar: { label: 'ACTIVAR CLIENTES', Icon: MapPin },
  morosos: { label: 'CLIENTES MOROSOS', Icon: AlertTriangle },
  consultas: { label: 'CONSULTAS DATOS', Icon: Search },
  actualizar: { label: 'ACTUALIZAR DATOS', Icon: RefreshCw },
  clave: { label: 'CAMBIAR CLAVE', Icon: Key },
  opciones: { label: 'OTRAS OPCIONES', Icon: Settings },
};

interface ToastState { message: string; type: ToastType; key: number; }

function AppInner() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<ViewName>('listado');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [morososCount, setMorososCount] = useState(0);
  const [editCliente, setEditCliente] = useState<Cliente | undefined>();
  const [editCredito, setEditCredito] = useState<Credito | undefined>();

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
      default:
        return <PlaceholderView title={label} onNavigate={navigate} />;
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
