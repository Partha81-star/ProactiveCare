import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading MediConnect AI...</p>
        </div>
      </div>
    );
  }

  // Auth check re-enabled — redirect to login if not authenticated
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  return <Outlet />;
};

export default ProtectedRoute;
