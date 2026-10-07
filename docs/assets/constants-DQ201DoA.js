import{Ht as e,Nt as t,Pt as n,tt as r}from"./icon-DZItDeMB.js";import{J as i,L as a,On as o}from"./runtime-core.esm-bundler-BV7Lsdgt.js";var s={prefix:Math.floor(Math.random()*1e4),current:0},c=Symbol(`elIdInjection`),l=()=>a()?i(c,s):s,u=i=>{let a=l();!n&&a===s&&e(`IdInjection`,`Looks like you are using server rendering, you must provide a id provider to ensure the hydration process to be succeed
usage: app.provide(ID_INJECTION_KEY, {
  prefix: number,
  current: number,
})`);let c=r();return t(()=>o(i)||`${c.value}-id-${a.prefix}-${a.current++}`)},d=Symbol(`formContextKey`),f=Symbol(`formItemContextKey`);export{l as i,f as n,u as r,d as t};