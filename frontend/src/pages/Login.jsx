import React,{useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import {BrainCircuit,ArrowRight} from "lucide-react";
import {useAuth} from "../auth";
import {getErrorMessage} from "../api";
import Notice from "../components/Notice";
export default function Login(){
 const {login}=useAuth(),navigate=useNavigate();const[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(e){e.preventDefault();setBusy(true);setError("");try{await login(email,password);navigate("/");}catch(err){setError(getErrorMessage(err));}finally{setBusy(false);}}
 return <div className="auth-page"><div className="auth-glow"/><div className="auth-card"><div className="auth-brand"><span className="brand-icon"><BrainCircuit size={23}/></span><span>Interview<span className="brand-accent">Copilot</span></span></div><div className="eyebrow">WELCOME BACK</div><h1>Make your next<br/><span className="gradient-text">interview count.</span></h1><p className="muted">Sign in to continue your AI-powered interview preparation.</p><Notice>{error}</Notice><form onSubmit={submit} className="form-stack"><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required/></label><button className="btn primary full" disabled={busy}>{busy?"Signing in...":"Sign in"}<ArrowRight size={17}/></button></form><div className="auth-foot">New to InterviewCopilot? <Link to="/register">Create an account</Link></div></div></div>;
}