"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import type { ManagedAccountPayload, Wholesaler } from "./account.types";
import { wholesalerApi } from "./account.api";

type Errors = Partial<Record<keyof ManagedAccountPayload, string>>;

export function WholesalerForm({ initial, onSaved }: { initial?: Wholesaler; onSaved: (result: Wholesaler, temporaryPassword?: string) => void }) {
  const [values,setValues]=useState<ManagedAccountPayload>({name:initial?.name??"",email:initial?.email??"",phone:initial?.phone??"",discountPercent:initial?.discountPercent??0});
  const [errors,setErrors]=useState<Errors>({}); const [requestError,setRequestError]=useState<string|null>(null); const [busy,setBusy]=useState(false);
  const change=(field:keyof ManagedAccountPayload,value:string|number)=>{setValues(current=>({...current,[field]:value}));setErrors(current=>({...current,[field]:undefined}));};
  const submit=async(event:FormEvent)=>{event.preventDefault();const next:Errors={};if(values.name.trim().length<2)next.name="Name must contain at least 2 characters.";if(!/^\S+@\S+\.\S+$/.test(values.email.trim()))next.email="Enter a valid email address.";if(!values.phone.trim())next.phone="Phone is required.";if(values.discountPercent===undefined||!Number.isFinite(values.discountPercent)||values.discountPercent<0||values.discountPercent>100)next.discountPercent="Discount must be between 0 and 100.";setErrors(next);if(Object.keys(next).length)return;setBusy(true);setRequestError(null);try{if(initial){const saved=await wholesalerApi.update(initial._id,{...values,email:values.email.trim(),name:values.name.trim(),phone:values.phone.trim()});onSaved(saved);}else{const created=await wholesalerApi.create({...values,email:values.email.trim(),name:values.name.trim(),phone:values.phone.trim()});onSaved(created.user,created.temporaryPassword);}}catch(error){setErrors(getApiFieldErrors(error) as Errors);setRequestError(getApiErrorMessage(error,"Unable to save Wholesaler."));}finally{setBusy(false)}};
  return <form onSubmit={submit} className="space-y-5" noValidate><div className="grid gap-5 sm:grid-cols-2"><Input label="Name" required value={values.name} error={errors.name} onChange={e=>change("name",e.target.value)} maxLength={150}/><Input label="Email" required type="email" value={values.email} error={errors.email} onChange={e=>change("email",e.target.value)} maxLength={254}/><Input label="Phone" required value={values.phone} error={errors.phone} hint="7–15 digits; spaces, brackets and hyphens are normalized by the server." onChange={e=>change("phone",e.target.value)} maxLength={30}/><Input label="Account discount (%)" required type="number" min={0} max={100} step="0.01" value={values.discountPercent} error={errors.discountPercent} onChange={e=>change("discountPercent",e.target.valueAsNumber)}/></div>{requestError?<div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{requestError}</div>:null}<div className="flex justify-end"><Button type="submit" isLoading={busy} loadingLabel="Saving">{initial?"Save Changes":"Create Wholesaler"}</Button></div></form>;
}
