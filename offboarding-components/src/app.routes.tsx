import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserDashboard from './screens/InitiateExit/userDashboard';
import ManagerDashboard from './screens/ManagerApproval/managerDashboard';
import EmployeeRecord from './screens/EmployeeRecord/EmployeeRecord';
import EmployeeDetails from './screens/EmployeeDetails/EmployeeDetails';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/InitiateExit" element={<UserDashboard />} />
        <Route path="/ManagerApproval" element={<ManagerDashboard />} />
        {/* :empId is required — EmployeeRecord reads it via useParams */}
        <Route path="/OffboardingRecord/:empId" element={<EmployeeRecord />} />
        {/* Employee Details for active (non-offboarding) employees */}
        <Route path="/EmployeeDetails/:empId" element={<EmployeeDetails />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;