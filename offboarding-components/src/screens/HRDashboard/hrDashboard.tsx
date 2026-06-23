// src/screens/HRDashboard/hrDashboard.tsx
// Thin wrapper — all logic lives in DepartmentDashboard.
import DepartmentDashboard from '../DepartmentDashboard/DepartmentDashboard';
import { HR_DASHBOARD_CONFIG } from '../../config/dashboardConfig';

const HRDashboard = () => <DepartmentDashboard config={HR_DASHBOARD_CONFIG} />;

export default HRDashboard;