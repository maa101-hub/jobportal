import CandidateOffers from "../pages/candidate/CandidateOffers";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CompanySignup from "../pages/auth/CompanySignup";
import Login from "../pages/auth/Login";
import CandidateSignup from "../pages/auth/CandidateSignup";
import Jobs from "../pages/candidate/Jobs"; 
import MyApplications from "../pages/candidate/MyApplications";
import CreateJob from "../pages/job/CreateJob";
import CompanyJobs from "../pages/job/CompanyJobs";
import Applications from "../pages/application/Applications";
import Interview from "../pages/application/Interview";
import Employees from "../pages/company/Employees";
import AddEmployee from "../pages/company/AddEmployee";
import RoleAccess from "../pages/company/RoleAccess";
import Offer from "../pages/candidate/Offer";
import Dashboard from "../pages/company/Dashboard";
import OfferManagement from "../pages/offer/OfferManagement";






function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<CandidateSignup />} />
        <Route path="/company-signup" element={<CompanySignup />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="/company/dashboard" element={<Dashboard />} />
        <Route path="/company/role-access" element={<RoleAccess />} />
        <Route path="/company/create-job" element={<CreateJob />} />
        <Route path="/company/jobs" element={<CompanyJobs />} />

        <Route path="/applications-manage" element={<Applications />} />
        <Route path="/company/applications" element={<Applications />} />
        

        <Route path="/company/interview" element={<Interview />} />
        <Route path="/company/employees" element={<Employees />} />
        <Route path="/company/add-employee" element={<AddEmployee />} />
        <Route path="/offer" element={<Offer />} />
        <Route path="/my-offers" element={<CandidateOffers />} />
        <Route path="/company/offers" element={<OfferManagement />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;