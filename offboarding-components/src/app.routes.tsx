import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserDashboard from './screens/InitiateExit/userDashboard';
import ManagerDashboard from './screens/ManagerApproval/managerDashboard';
import EmployeeRecord from './screens/EmployeeRecord/EmployeeRecord';
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default Route */}
        <Route path="/InitiateExit" element={<UserDashboard />} />
        <Route path="/ManagerApproval" element={<ManagerDashboard />} />
        <Route path="/OffboardingRecord" element={<EmployeeRecord />} />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;