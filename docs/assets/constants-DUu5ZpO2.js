import{G as e,Q as t,W as n}from"./icon-itxODMwq.js";import{J as r,L as i,On as a}from"./runtime-core.esm-bundler-BJw8slH9.js";import{H as o}from"./style-DG1kAfp8.js";var s={prefix:Math.floor(Math.random()*1e4),current:0},c=Symbol(`elIdInjection`),l=()=>i()?r(c,s):s,u=r=>{let i=l();!e&&i===s&&t(`IdInjection`,`Looks like you are using server rendering, you must provide a id provider to ensure the hydration process to be succeed
usage: app.provide(ID_INJECTION_KEY, {
  prefix: number,
  current: number,
})`);let c=o();return n(()=>a(r)||`${c.value}-id-${i.prefix}-${i.current++}`)},d=Symbol(`formContextKey`),f=Symbol(`formItemContextKey`);export{l as i,f as n,u as r,d as t};