"use client";
/** Reserve the same space for the company artwork and the generic company mark. */
import {Building2} from "lucide-react";
import {useState} from "react";
import {getLogoPath} from "@/lib/company-logos.cjs";

export function CompanyAvatar({ticker,size="md"}:{ticker:string;size?:"sm"|"md"|"lg"}) {
  const src=getLogoPath(ticker);
  const [failed,setFailed]=useState<string|null>(null);
  const hasLogo=src && src!==failed;
  const backdrop=hasLogo && !["/logos/V.png","/logos/CAT.png","/logos/IBM.png"].includes(src) ? "light" : "dark";
  return <span aria-hidden="true" data-backdrop={backdrop} className={`company-avatar company-avatar-${size}`}>
    {hasLogo ? <img src={src} alt="" loading="lazy" decoding="async" onError={()=>setFailed(src)}/> : <Building2 size={19}/>}
  </span>;
}
