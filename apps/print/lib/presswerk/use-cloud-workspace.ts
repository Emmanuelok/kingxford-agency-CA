'use client';
import {useState,useRef,useEffect,useLayoutEffect} from 'react';
import {toast} from 'sonner';
import {connectCloud,cloud,listWorkspaces,loadWorkspace,brandSchema,type Workspace,type Session,type Role,type CloudOrder} from './cloud';
import type {Design} from './catalog';

export function useCloudWorkspace(onLoad:(data:{projects:Design[];orders:CloudOrder[];workspace:Workspace})=>void,onClear:(reason:'signin'|'switch'|'signout')=>void){
  const [configured,setConfigured]=useState(false);const [session,setSession]=useState<Session|null>(null);const [workspace,setWorkspace]=useState<Workspace|null>(null);const [workspaces,setWorkspaces]=useState<Workspace[]>([]);const [role,setRole]=useState<Role|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
  const epoch=useRef(0);const sessionRef=useRef<Session|null>(null);const workspaceRef=useRef<Workspace|null>(null);const callbacks=useRef({onLoad,onClear});
  useLayoutEffect(()=>{callbacks.current={onLoad,onClear};},[onLoad,onClear]);
  const selectWorkspace=async(w:Workspace,s=sessionRef.current)=>{
    if(!s)return;const e=++epoch.current;setLoading(true);setError('');setRole(null);workspaceRef.current=w;setWorkspace(w);callbacks.current.onClear('switch');
    try{const data=await loadWorkspace(w.id,s.user.id);if(epoch.current!==e)return;const next={...w,brand:brandSchema.parse(w.brand)};setWorkspace(next);workspaceRef.current=next;setRole(data.role);callbacks.current.onLoad({...data,workspace:next});}
    catch(err){if(epoch.current===e){setError((err as Error).message);toast.error('Workspace could not be loaded: '+(err as Error).message);}}
    finally{if(epoch.current===e)setLoading(false);}
  };
  const reload=async()=>{const s=sessionRef.current;if(!s)return;const e=epoch.current;const list=await listWorkspaces();if(epoch.current!==e||sessionRef.current?.user.id!==s.user.id)return;setWorkspaces(list);const w=list.find(x=>x.id===workspaceRef.current?.id)||list[0];if(w)await selectWorkspace(w,s);};
  useEffect(()=>{
    let stopped=false;let unsubscribe:(()=>void)|undefined;let currentUser:string|undefined;
    const sessionChanged=(s:Session|null)=>{
      sessionRef.current=s;setSession(s);if(s?.user.id===currentUser)return;const previous=currentUser;currentUser=s?.user.id;++epoch.current;workspaceRef.current=null;setWorkspace(null);setWorkspaces([]);setRole(null);setError('');callbacks.current.onClear(s?previous?'switch':'signin':'signout');
      if(s)setTimeout(()=>{if(!stopped)reload().catch(e=>{setError(e.message);toast.error(e.message);});},0);
    };
    fetch('/api/print/config').then(r=>{if(!r.ok)throw Error('Account configuration unavailable');return r.json();}).then(async c=>{
      const config=c as {cloud?:{url:string;publishableKey:string}};if(stopped||!config.cloud)return;const db=connectCloud(config.cloud);setConfigured(true);const sub=db.auth.onAuthStateChange((event,s)=>{if(stopped)return;sessionChanged(s);if(event==='PASSWORD_RECOVERY')window.dispatchEvent(new CustomEvent('presswerk-password-recovery'));});unsubscribe=()=>sub.data.subscription.unsubscribe();const {data,error}=await db.auth.getSession();if(error)throw error;if(!stopped)sessionChanged(data.session);
    }).catch(()=>{if(!stopped)setError('Account service is awaiting activation.');});
    return()=>{stopped=true;++epoch.current;unsubscribe?.();};
  },[]);
  const signOut=async()=>{const {error}=await cloud().auth.signOut();if(error)throw error;sessionRef.current=null;setSession(null);workspaceRef.current=null;setWorkspace(null);setWorkspaces([]);setRole(null);setError('');++epoch.current;callbacks.current.onClear('signout');};
  const created=async(w:Workspace)=>{setWorkspaces(list=>[...list,w]);await selectWorkspace(w);};
  return{configured,session,workspace,workspaces,role,loading,error,selectWorkspace,reload,signOut,created,epoch};
}
