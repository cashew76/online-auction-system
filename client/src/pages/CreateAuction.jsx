import { useState } from "react";
import { useNavigate } from "react-router";
import { useCreateAuction } from "../hooks/useAuction.js";
export const CreateAuction=()=>{const nav=useNavigate();const[f,setF]=useState({name:"",description:"",startDate:"",endDate:""});const[e,setE]=useState("");const m=useCreateAuction({onSuccess:d=>nav(`/auctions/${d.auction._id}/manage`),onError:x=>setE(x.response?.data?.message||"Unable to create auction")});return <div className="max-w-2xl mx-auto p-6"><h1 className="text-2xl font-bold mb-6">Create private auction</h1><form className="bg-white border rounded-2xl p-6 space-y-4" 

onSubmit={x=>{
  x.preventDefault();

  const now = new Date();

  const startDate = new Date(f.startDate);
  const endDate = new Date(f.endDate);

  const ninetyDays = new Date();
  ninetyDays.setDate(ninetyDays.getDate() + 90);

  if (startDate > ninetyDays) {
    setE("Start date must be within the next 90 days.");
    return;
  }

  if (endDate > ninetyDays) {
    setE("End date must be within the next 90 days.");
    return;
  }

  if (endDate <= startDate) {
    setE("End date must be after start date.");
    return;
  }

  m.mutate(f);
}}


>{["name","description","startDate","endDate"].map(k=><label key={k} className="block"><span className="text-sm font-medium capitalize">{k.replace("Date"," date")}</span>{k==="description"?<textarea className="mt-1 w-full border rounded-xl p-3" value={f[k]} onChange={x=>setF({...f,[k]:x.target.value})}/>:

<input
  required
  className="mt-1 w-full border rounded-xl p-3"
  type={k.includes("Date") ? "datetime-local" : "text"}
  value={f[k]}
  max={
    k.includes("Date")
      ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16)
      : undefined
  }
  onChange={x => setF({...f,[k]:x.target.value})}
/>}


</label>)}{e&&<p className="text-red-600">{e}</p>}<button className="bg-indigo-600 text-white rounded-xl px-5 py-3 font-semibold">Create auction</button></form></div>};
