"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="ws-loading"><h1>Something interrupted this page.</h1><p>Your last saved workspace remains on this device.</p><button className="button button-coral" onClick={reset}>Try again</button><a href="/platform">Return to your workspace</a></main>;}
