// src/screens/ITDashboard/itDashboard.tsx
// Thin wrapper — all logic lives in DepartmentDashboard.
import DepartmentDashboard from '../DepartmentDashboard/DepartmentDashboard';
import { IT_DASHBOARD_CONFIG } from '../../config/dashboardConfig';

const ITDashboard = () => <DepartmentDashboard config={IT_DASHBOARD_CONFIG} />;

export default ITDashboard;