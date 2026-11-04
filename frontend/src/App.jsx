import React from "react";
import {Navigate,Route,Routes} from "react-router-dom";
import {AuthProvider,useAuth} from "./auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewInterview from "./pages/NewInterview";
import InterviewRoom from "./pages/InterviewRoom";
import Results from "./pages/Results";
function Protected({children}){const {token}=useAuth();return token?children:<Navigate to="/login" replace/>;}
function AppRoutes(){const {token}=useAuth();return <Routes>
<Route path="/login" element={token?<Navigate to="/" replace/>:<Login/>}/>
<Route path="/register" element={token?<Navigate to="/" replace/>:<Register/>}/>
<Route path="/" element={<Protected><Layout><Dashboard/></Layout></Protected>}/>
<Route path="/interviews/new" element={<Protected><Layout><NewInterview/></Layout></Protected>}/>
<Route path="/interviews/:id" element={<Protected><Layout><InterviewRoom/></Layout></Protected>}/>
<Route path="/interviews/:id/results" element={<Protected><Layout><Results/></Layout></Protected>}/>
<Route path="*" element={<Navigate to={token?"/":"/login"} replace/>}/>
</Routes>;}
export default function App(){return <AuthProvider><AppRoutes/></AuthProvider>;}