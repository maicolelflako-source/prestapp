import {
  LayoutList, UserPlus, CreditCard, DollarSign, Calculator,
  Globe, Layers, AlertTriangle,
  Power, Coins, ChevronRight, Crown
} from 'lucide-react';
import { ViewName } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: ViewName;
  onNavigate: (v: ViewName) => void;
  morososCount: number;
}

const MENU = [
  {
    section: 'Principal',
    items: [
      { view: 'listado' as ViewName, label: 'Listado General', Icon: LayoutList },
      { view: 'nuevo-cliente' as ViewName, label: 'Clientes Nuevos', Icon: UserPlus },
      { view: 'ventas' as ViewName, label: 'Ventas Nuevas', Icon: CreditCard },
      { view: 'gastos' as ViewName, label: 'Gastos del Día', Icon: DollarSign },
      { view: 'totalizar' as ViewName, label: 'Totalizar Ventas', Icon: Calculator },
    ],
  },
  {
    section: 'Gestión',
    items: [
      { view: 'rutas' as ViewName, label: 'Enruta Clientes', Icon: Globe },
      { view: 'prioridad' as ViewName, label: 'Por Prioridad', Icon: Layers },
      { view: 'morosos' as ViewName, label: 'Clientes Morosos', Icon: AlertTriangle, badge: true },
    ],
  },
];

export default function Sidebar({ currentView, onNavigate, morososCount }: SidebarProps) {
  const { profile, ruta, signOut } = useAuth();
  const initials = profile?.nombre
    ? profile.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'US';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-icon">
          <Coins size={22} />
        </div>
        <div>
          <div className="sb-logo-name">PrestaApp</div>
          <div className="sb-logo-ver">v2.1 — Sistema Premium</div>
        </div>
      </div>

      {/* User */}
      <div className="sb-user">
        <div className="sb-avatar">{initials}</div>
        <div className="sb-user-info">
          <div className="sb-uname">{profile?.nombre || 'Usuario'}</div>
          <div className="sb-urole">{profile?.rol || 'Cobrador'}</div>
          {ruta && <span className="sb-ruta">{ruta.nombre}</span>}
        </div>
      </div>

      {/* Menu */}
      <nav className="sb-menu">
        {MENU.map(group => (
          <div key={group.section}>
            <div className="menu-section-label">{group.section}</div>
            {group.items.map(({ view, label, Icon, badge }) => (
              <button
                key={view}
                className={`mi ${currentView === view ? 'active' : ''}`}
                onClick={() => onNavigate(view)}
              >
                <Icon size={16} />
                <span>{label}</span>
                {badge && morososCount > 0 && (
                  <span className="mi-badge">{morososCount}</span>
                )}
                {currentView === view && <ChevronRight size={12} className="mi-arrow" />}
              </button>
            ))}
          </div>
        ))}

        <div className="sb-divider" />

        <button className="mi" onClick={() => onNavigate('suscripcion')}>
          <Crown size={16} /><span>Mi Suscripción</span>
        </button>
        <button className="mi danger" onClick={signOut}>
          <Power size={16} /><span>Salir del Sistema</span>
        </button>
      </nav>

      <div className="sb-bottom">
        <div className="sb-bottom-date">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
      </div>
    </aside>
  );
}
