import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Layout from "./Layout.jsx";

import Home from "./Home";
import Projects from "./Projects";
import ProjectDetails from "./ProjectDetails/ProjectDetails.jsx";
import Trade from "./Trade";
import Administration from "./Administration";
import MyAccount from "./MyAccount";
import ValidateCertificate from "./ValidateCertificate";
import Login from './Login.jsx';
import Register from './Ragister.jsx';

// Page mapping
const PAGES = {
  Home,
  Projects,
  ProjectDetails,
  Trade,
  ValidateCertificate,
  Administration,
  MyAccount
};

// Derive page name from current URL
function _getCurrentPage(url) {
  let path = url.endsWith("/") ? url.slice(0, -1) : url;
  const last = path.split("/").pop().split("?")[0];
  return Object.keys(PAGES).find(page => page.toLowerCase() === last.toLowerCase()) || "Home";
}

// Optional: scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Main router content inside Layout
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <ScrollToTop />
      <Routes>
        {/* <Route path="/" element={<Home />} />
        <Route path="/Home" element={<Home />} /> */}
         <Route path="/" element={<Projects />} />
         <Route path="/Home" element={<Projects />} />
        <Route path="/Projects" element={<Projects />} />
       

        <Route path="/ProjectDetails/:projectContract" element={<ProjectDetails />} />
        <Route path="/Trade" element={<Trade />} />
        <Route path="/ValidateCertificate" element={<ValidateCertificate />} />
        <Route path="/Administration" element={<Administration />} />
        <Route path="/MyAccount" element={<MyAccount />} />
        {/* login and ragistration */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Optional: redirect unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

// App-wide routing provider
export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
