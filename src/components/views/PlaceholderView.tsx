import { Wrench, ArrowLeft } from 'lucide-react';

interface Props {
  title: string;
  onNavigate: (v: string) => void;
}

export default function PlaceholderView({ title, onNavigate }: Props) {
  return (
    <div className="view-content">
      <div className="empty-state">
        <Wrench size={52} color="#EFBF04" opacity={0.5} />
        <h3>{title}</h3>
        <p>Este módulo estará disponible en la próxima actualización.</p>
        <button className="btn btn-outline-gold" onClick={() => onNavigate('listado')} style={{ marginTop: 16 }}>
          <ArrowLeft size={14} /> Volver al listado
        </button>
      </div>
    </div>
  );
}
