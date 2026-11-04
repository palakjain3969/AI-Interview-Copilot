import React from "react";
import {NavLink,useNavigate} from "react-router-dom";
import {BrainCircuit,LogOut,Plus,LayoutDashboard} from "lucide-react";
import {useAuth} from "../auth";
export default function Layout({children}){
 const {user,logout}=useAuth();const navigate=useNavigate();
 return <div className="app-shell"><aside className="sidebar">
 <div className="brand"><span className="brand-icon"><BrainCircuit size={22}/></span><span>Interview<span className="brand-accent">Copilot</span></span></div>
 <div className="side-label">WORKSPACE</div>
 <NavLink to="/" end className={({isActive})=>`nav-item ${isActive?"active":""}`}><LayoutDashboard size={18}/>Dashboard</NavLink>
 <NavLink to="/interviews/new" className={({isActive})=>`nav-item ${isActive?"active":""}`}><Plus size={18}/>New interview</NavLink>
 <div className="sidebar-bottom"><div className="user-chip"><div className="avatar">{(user?.name||user?.email||"U").slice(0,1).toUpperCase()}</div><div className="user-meta"><strong>{user?.name||"Your account"}</strong><span>{user?.email||"Signed in"}</span></div></div>
 <button className="nav-item logout" onClick={()=>{logout();navigate("/login");}}><LogOut size={18}/>Log out</button></div>
 </aside><main className="main-area"><header className="topbar"><div className="topbar-kicker">AI-POWERED INTERVIEW PRACTICE</div><div className="status-pill"><span/>System ready</div></header><div className="page-content">{children}</div></main></div>;
}