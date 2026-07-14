import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h1>404 — Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to={ROUTES.DASHBOARD}>Go to Dashboard</Link>
    </div>
  );
};

export default NotFound;
