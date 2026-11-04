import React from "react";
export default function Notice({type="error",children}){return children?<div className={`notice ${type}`}>{children}</div>:null;}