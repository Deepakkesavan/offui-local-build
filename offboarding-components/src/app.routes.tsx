import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserDashboard from './screens/InitiateExit/userDashboard';
import ManagerDashboard from './screens/ManagerApproval/managerDashboard';
import EmployeeRecord from './screens/EmployeeRecord/EmployeeRecord';
import EmployeeDetails from './screens/EmployeeDetails/EmployeeDetails';
import HRDashboard from './screens/HRDashboard/hrDashboard';
import HREmployeeDetails from './screens/HREmployeeDetails/HREmployeeDetails';
import ITDashboard from './screens/ITDashboard/itDashboard';
import ITEmployeeDetails from './screens/ITEmployeeDetails/ITEmployeeDetails';

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
        {/* HR Dashboard — all-employee offboarding overview */}
        <Route path="/HRDashboard" element={<HRDashboard />} />
        {/* HR Employee Details — navigated to from HRDashboard's "View Tasks" action */}
        <Route path="/HREmployeeDetails/:empId" element={<HREmployeeDetails />} />
        {/* IT Dashboard — mirrors HR Dashboard layout, gated to IT designations */}
        <Route path="/ITDashboard" element={<ITDashboard />} />
        {/* IT Employee Details — navigated to from ITDashboard's "View Tasks" action */}
        <Route path="/ITEmployeeDetails/:empId" element={<ITEmployeeDetails />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;