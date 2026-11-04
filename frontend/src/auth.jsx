import React,{createContext,useContext,useMemo,useState} from "react";
import {api,extractToken,paths} from "./api";
const AuthContext=createContext(null);
export function AuthProvider({children}){
 const [token,setToken]=useState(()=>localStorage.getItem("aic_token")||"");
 const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("aic_user")||"null")}catch{return null}});
 async function login(email,password){
  const {data}=await api.post(paths.login,{email,password});const t=extractToken(data);
  if(!t)throw new Error("Login response did not contain a token. Check your backend response format.");
  localStorage.setItem("aic_token",t);setToken(t);const u=data?.user||data?.data?.user||{email};localStorage.setItem("aic_user",JSON.stringify(u));setUser(u);return data;
 }
 async function register(name,email,password){
  const {data}=await api.post(paths.register,{name,email,password});const t=extractToken(data);
  if(t){localStorage.setItem("aic_token",t);setToken(t);const u=data?.user||data?.data?.user||{name,email};localStorage.setItem("aic_user",JSON.stringify(u));setUser(u);}return data;
 }
 function logout(){localStorage.removeItem("aic_token");localStorage.removeItem("aic_user");setToken("");setUser(null);}
 const value=useMemo(()=>({token,user,login,register,logout}),[token,user]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const v=useContext(AuthContext);if(!v)throw new Error("useAuth must be used inside AuthProvider");return v;}