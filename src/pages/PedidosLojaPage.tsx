import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PedidosLojaPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/configuracoes?tab=ecommerce', { replace: true });
  }, [navigate]);

  return null;
}
