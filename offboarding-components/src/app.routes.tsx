import { BrowserRouter, Routes, Route } from 'react-router-dom';

import UserDashboard from './screens/InitiateExit/userDashboard';
import ManagerDashboard from './screens/ManagerApproval/managerDashboard';
// import Home from './screens/Home/home';
// import Login from './screens/Login/login';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default Route */}
        <Route path="/InitiateExit" element={<UserDashboard />} />
        <Route path="/ManagerApproval" element={<ManagerDashboard />} />

        {/* Additional Routes */}
        {/* <Route path="/home" element={<Home />} /> */}
        {/* <Route path="/login" element={<Login />} /> */}
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;