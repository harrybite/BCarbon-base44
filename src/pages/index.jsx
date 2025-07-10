import Layout from "./Layout.jsx";

import Home from "./Home";

import Projects from "./Projects";

import ProjectDetails from "./ProjectDetails";

import Trade from "./Trade";

import Administration from "./Administration";

import MyAccount from "./MyAccount";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Projects: Projects,
    
    ProjectDetails: ProjectDetails,
    
    Trade: Trade,
    
    Administration: Administration,
    
    MyAccount: MyAccount,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/ProjectDetails" element={<ProjectDetails />} />
                
                <Route path="/Trade" element={<Trade />} />
                
                <Route path="/Administration" element={<Administration />} />
                
                <Route path="/MyAccount" element={<MyAccount />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}