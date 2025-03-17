var app=function(){"use strict";function t(){}function e(t,e){for(const n in e)t[n]=e[n];return t}function n(t){return t()}function o(){return Object.create(null)}function i(t){t.forEach(n)}function l(t){return"function"==typeof t}function s(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function r(t,e,n,o){if(t){const i=c(t,e,n,o);return t[0](i)}}function c(t,n,o,i){return t[1]&&i?e(o.ctx.slice(),t[1](i(n))):o.ctx}function u(t,e,n,o){if(t[2]&&o){const i=t[2](o(n));if(void 0===e.dirty)return i;if("object"==typeof i){const t=[],n=Math.max(e.dirty.length,i.length);for(let o=0;o<n;o+=1)t[o]=e.dirty[o]|i[o];return t}return e.dirty|i}return e.dirty}function a(t,e,n,o,i,l){if(i){const s=c(e,n,o,l);t.p(s,i)}}function d(t){if(t.ctx.length>32){const e=[],n=t.ctx.length/32;for(let t=0;t<n;t++)e[t]=-1;return e}return-1}function p(t){return null==t?"":t}function f(t,e){t.appendChild(e)}function g(t,e,n){t.insertBefore(e,n||null)}function m(t){t.parentNode.removeChild(t)}function h(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function y(t){return document.createElement(t)}function $(t){return document.createTextNode(t)}function v(){return $(" ")}function b(){return $("")}function _(t,e,n,o){return t.addEventListener(e,n,o),()=>t.removeEventListener(e,n,o)}function x(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function w(t){return""===t?null:+t}function k(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}function E(t,e){t.value=null==e?"":e}function z(t,e,n,o){t.style.setProperty(e,n,o?"important":"")}function j(t,e){for(let n=0;n<t.options.length;n+=1){const o=t.options[n];if(o.__value===e)return void(o.selected=!0)}t.selectedIndex=-1}let C;function F(t){C=t}function I(){if(!C)throw new Error("Function called outside component initialization");return C}function L(t){I().$$.on_mount.push(t)}function M(){const t=I();return(e,n)=>{const o=t.$$.callbacks[e];if(o){const i=function(t,e,n=!1){const o=document.createEvent("CustomEvent");return o.initCustomEvent(t,n,!1,e),o}(e,n);o.slice().forEach((e=>{e.call(t,i)}))}}}const q=[],B=[],S=[],T=[],O=Promise.resolve();let A=!1;function H(t){S.push(t)}let D=!1;const R=new Set;function N(){if(!D){D=!0;do{for(let t=0;t<q.length;t+=1){const e=q[t];F(e),U(e.$$)}for(F(null),q.length=0;B.length;)B.pop()();for(let t=0;t<S.length;t+=1){const e=S[t];R.has(e)||(R.add(e),e())}S.length=0}while(q.length);for(;T.length;)T.pop()();A=!1,D=!1,R.clear()}}function U(t){if(null!==t.fragment){t.update(),i(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(H)}}const P=new Set;let X;function W(){X={r:0,c:[],p:X}}function Y(){X.r||i(X.c),X=X.p}function J(t,e){t&&t.i&&(P.delete(t),t.i(e))}function V(t,e,n,o){if(t&&t.o){if(P.has(t))return;P.add(t),X.c.push((()=>{P.delete(t),o&&(n&&t.d(1),o())})),t.o(e)}}function G(t,e){t.d(1),e.delete(t.key)}function K(t,e){V(t,1,1,(()=>{e.delete(t.key)}))}function Q(t,e,n,o,i,l,s,r,c,u,a,d){let p=t.length,f=l.length,g=p;const m={};for(;g--;)m[t[g].key]=g;const h=[],y=new Map,$=new Map;for(g=f;g--;){const t=d(i,l,g),r=n(t);let c=s.get(r);c?o&&c.p(t,e):(c=u(r,t),c.c()),y.set(r,h[g]=c),r in m&&$.set(r,Math.abs(g-m[r]))}const v=new Set,b=new Set;function _(t){J(t,1),t.m(r,a),s.set(t.key,t),a=t.first,f--}for(;p&&f;){const e=h[f-1],n=t[p-1],o=e.key,i=n.key;e===n?(a=e.first,p--,f--):y.has(i)?!s.has(o)||v.has(o)?_(e):b.has(i)?p--:$.get(o)>$.get(i)?(b.add(o),_(e)):(v.add(i),p--):(c(n,s),p--)}for(;p--;){const e=t[p];y.has(e.key)||c(e,s)}for(;f;)_(h[f-1]);return h}function Z(t,e){const n={},o={},i={$$scope:1};let l=t.length;for(;l--;){const s=t[l],r=e[l];if(r){for(const t in s)t in r||(o[t]=1);for(const t in r)i[t]||(n[t]=r[t],i[t]=1);t[l]=r}else for(const t in s)i[t]=1}for(const t in o)t in n||(n[t]=void 0);return n}function tt(t){return"object"==typeof t&&null!==t?t:{}}function et(t){t&&t.c()}function nt(t,e,o,s){const{fragment:r,on_mount:c,on_destroy:u,after_update:a}=t.$$;r&&r.m(e,o),s||H((()=>{const e=c.map(n).filter(l);u?u.push(...e):i(e),t.$$.on_mount=[]})),a.forEach(H)}function ot(t,e){const n=t.$$;null!==n.fragment&&(i(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function it(t,e){-1===t.$$.dirty[0]&&(q.push(t),A||(A=!0,O.then(N)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function lt(e,n,l,s,r,c,u,a=[-1]){const d=C;F(e);const p=e.$$={fragment:null,ctx:null,props:c,update:t,not_equal:r,bound:o(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(d?d.$$.context:n.context||[]),callbacks:o(),dirty:a,skip_bound:!1,root:n.target||d.$$.root};u&&u(p.root);let f=!1;if(p.ctx=l?l(e,n.props||{},((t,n,...o)=>{const i=o.length?o[0]:n;return p.ctx&&r(p.ctx[t],p.ctx[t]=i)&&(!p.skip_bound&&p.bound[t]&&p.bound[t](i),f&&it(e,t)),n})):[],p.update(),f=!0,i(p.before_update),p.fragment=!!s&&s(p.ctx),n.target){if(n.hydrate){const t=function(t){return Array.from(t.childNodes)}(n.target);p.fragment&&p.fragment.l(t),t.forEach(m)}else p.fragment&&p.fragment.c();n.intro&&J(e.$$.fragment),nt(e,n.target,n.anchor,n.customElement),N()}F(d)}class st{$destroy(){ot(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}const rt=[];window._link_picker_list={};const ct=function(){const{subscribe:e,set:n,update:o}=function(e,n=t){let o;const i=new Set;function l(t){if(s(e,t)&&(e=t,o)){const t=!rt.length;for(const t of i)t[1](),rt.push(t,e);if(t){for(let t=0;t<rt.length;t+=2)rt[t][0](rt[t+1]);rt.length=0}}}return{set:l,update:function(t){l(t(e))},subscribe:function(s,r=t){const c=[s,r];return i.add(c),1===i.size&&(o=n(l)||t),s(e),()=>{i.delete(c),0===i.size&&(o(),o=null)}}}}(0);return{subscribe:e,increment:()=>o((t=>t+1)),decrement:()=>o((t=>t-1)),reset:()=>n(0)}}(),ut=new class{constructor(){this.picked=window._link_picker_list}add_entry(t){void 0===this.picked[t]&&(this.picked[t]=!0)}remove_entry(t){void 0!==this.picked[t]&&delete this.picked[t]}is_picked(t){return void 0!==this.picked[t]}toggle_pick(t){this.is_picked(t)?this.remove_entry(t):this.add_entry(t)}map_picks(t){for(let e of t)this.is_picked(e.entry)&&(this.picked[e.entry]=e)}get_pick_values(){let t=[];for(let e in this.picked)t.push(this.picked[e]);return t}};function at(e){let n,o,i,l,s,r,c,u,a,d,p,h,b,_;return{c(){n=y("div"),o=y("span"),i=$(e[0]),l=v(),s=y("span"),r=$(e[3]),c=v(),u=y("span"),a=$(e[2]),d=v(),p=y("h4"),h=$(e[4]),b=v(),_=y("div"),z(o,"color","darkbrown"),x(o,"class","svelte-1rpkexp"),z(s,"background-color","yellowgreen"),x(s,"class","svelte-1rpkexp"),z(u,"background-color","lightblue"),x(u,"class","svelte-1rpkexp"),x(p,"class","blg-item-title svelte-1rpkexp"),z(p,"background-color","inherit"),x(_,"class","teaser svelte-1rpkexp"),x(n,"class","blg-el-wrapper svelte-1rpkexp")},m(t,m){g(t,n,m),f(n,o),f(o,i),f(n,l),f(n,s),f(s,r),f(n,c),f(n,u),f(u,a),f(n,d),f(n,p),f(p,h),f(n,b),f(n,_),_.innerHTML=e[1]},p(t,[e]){1&e&&k(i,t[0]),8&e&&k(r,t[3]),4&e&&k(a,t[2]),16&e&&k(h,t[4]),2&e&&(_.innerHTML=t[1])},i:t,o:t,d(t){t&&m(n)}}}function dt(t){if("never"===t)return"never";{let e=parseInt(t);return new Date(e).toLocaleDateString("en-US")}}function pt(t,e,n){let o,i,l,s,{dates:r}=e,{entry:c}=e,{title:u}=e,{txt_full:a}=e;return t.$$set=t=>{"dates"in t&&n(5,r=t.dates),"entry"in t&&n(0,c=t.entry),"title"in t&&n(6,u=t.title),"txt_full"in t&&n(7,a=t.txt_full)},t.$$.update=()=>{128&t.$$.dirty&&n(1,o=void 0!==a?a.substr(0,250)+"&#8230;":"search"),32&t.$$.dirty&&n(2,i=r?dt(r.updated):""),32&t.$$.dirty&&n(3,l=r?dt(r.created):""),64&t.$$.dirty&&n(4,s=u?u.substr(0,16)+"...":"...")},[c,o,i,l,s,r,u,a]}class ft extends st{constructor(t){super(),lt(this,t,pt,at,s,{dates:5,entry:0,title:6,txt_full:7})}}function gt(t,e,n){const o=t.slice();return o[19]=e[n],o}function mt(e){let n,o,i;return{c(){n=y("button"),n.textContent="add comment"},m(t,l){g(t,n,l),o||(i=_(n,"click",e[12]),o=!0)},p:t,d(t){t&&m(n),o=!1,i()}}}function ht(t){let e,n,o=t[5],i=[];for(let e=0;e<o.length;e+=1)i[e]=yt(gt(t,o,e));const l=t=>V(i[t],1,1,(()=>{i[t]=null}));return{c(){for(let t=0;t<i.length;t+=1)i[t].c();e=b()},m(t,o){for(let e=0;e<i.length;e+=1)i[e].m(t,o);g(t,e,o),n=!0},p(t,n){if(32&n){let s;for(o=t[5],s=0;s<o.length;s+=1){const l=gt(t,o,s);i[s]?(i[s].p(l,n),J(i[s],1)):(i[s]=yt(l),i[s].c(),J(i[s],1),i[s].m(e.parentNode,e))}for(W(),s=o.length;s<i.length;s+=1)l(s);Y()}},i(t){if(!n){for(let t=0;t<o.length;t+=1)J(i[t]);n=!0}},o(t){i=i.filter(Boolean);for(let t=0;t<i.length;t+=1)V(i[t]);n=!1},d(t){h(i,t),t&&m(e)}}}function yt(t){let n,o,i,l,s;const r=[t[19]];let c={};for(let t=0;t<r.length;t+=1)c=e(c,r[t]);return i=new ft({props:c}),{c(){n=y("ul"),o=y("li"),et(i.$$.fragment),l=v(),x(o,"class","comment-list-entry"),x(n,"class","comment-list")},m(t,e){g(t,n,e),f(n,o),nt(i,o,null),f(n,l),s=!0},p(t,e){const n=32&e?Z(r,[tt(t[19])]):{};i.$set(n)},i(t){s||(J(i.$$.fragment,t),s=!0)},o(t){V(i.$$.fragment,t),s=!1},d(t){t&&m(n),ot(i)}}}function $t(t){let e,n,o,l,s,r,c,u,a,d,p,h,b,w,E,j,C,F,I,L,M,q,B,S,T,O,A,H,D,R,N,U,P=t[6]&&mt(t),X=t[7]&&ht(t);return{c(){e=y("div"),n=y("div"),o=y("span"),l=$(t[1]),s=v(),r=y("input"),c=v(),u=y("span"),a=$(t[10]),d=v(),p=y("span"),h=$(t[9]),b=v(),P&&P.c(),w=v(),E=y("h4"),j=$(t[2]),C=v(),F=y("h6"),I=$(t[11]),L=v(),M=y("div"),q=y("span"),q.textContent="subject",B=$("  "),S=y("h5"),T=$(t[3]),O=v(),A=y("div"),H=v(),D=y("div"),X&&X.c(),z(o,"background-color",t[0]),x(o,"class","svelte-giy3dc"),x(r,"type","checkbox"),z(u,"background-color","yellowgreen"),x(u,"class","svelte-giy3dc"),z(p,"background-color","lightblue"),x(p,"class","svelte-giy3dc"),x(E,"class","blg-item-title svelte-giy3dc"),z(E,"background-color","inherit"),x(F,"class","svelte-giy3dc"),z(q,"background-color","navy"),x(q,"class","svelte-giy3dc"),x(S,"class","blg-item-subject svelte-giy3dc"),z(n,"padding","6px"),x(A,"id","blg-window-full-text"),x(A,"class","full-display svelte-giy3dc"),x(D,"class","comment-list-block"),x(e,"class","blg-el-wrapper-full svelte-giy3dc")},m(i,m){g(i,e,m),f(e,n),f(n,o),f(o,l),f(n,s),f(n,r),r.checked=t[8],f(n,c),f(n,u),f(u,a),f(n,d),f(n,p),f(p,h),f(n,b),P&&P.m(n,null),f(n,w),f(n,E),f(E,j),f(n,C),f(n,F),f(F,I),f(n,L),f(n,M),f(M,q),f(M,B),f(M,S),f(S,T),f(e,O),f(e,A),A.innerHTML=t[4],f(e,H),f(e,D),X&&X.m(D,null),R=!0,N||(U=[_(r,"change",t[16]),_(r,"click",t[13])],N=!0)},p(t,[e]){(!R||2&e)&&k(l,t[1]),(!R||1&e)&&z(o,"background-color",t[0]),256&e&&(r.checked=t[8]),(!R||1024&e)&&k(a,t[10]),(!R||512&e)&&k(h,t[9]),t[6]?P?P.p(t,e):(P=mt(t),P.c(),P.m(n,w)):P&&(P.d(1),P=null),(!R||4&e)&&k(j,t[2]),(!R||2048&e)&&k(I,t[11]),(!R||8&e)&&k(T,t[3]),(!R||16&e)&&(A.innerHTML=t[4]),t[7]?X?(X.p(t,e),128&e&&J(X,1)):(X=ht(t),X.c(),J(X,1),X.m(D,null)):X&&(W(),V(X,1,1,(()=>{X=null})),Y())},i(t){R||(J(X),R=!0)},o(t){V(X),R=!1},d(t){t&&m(e),P&&P.d(),X&&X.d(),N=!1,i(U)}}}function vt(t){if("never"===t)return"never";{let e=parseInt(t);return new Date(e).toLocaleDateString("en-US")}}function bt(t,e,n){let o,i,l,{color:s}=e,{entry:r}=e,{title:c}=e,{dates:u}=e,{subject:a}=e,{keys:d}=e,{txt_full:p}=e,{comments:f}=e,g=!1,m=!1,h=!1;return ct.subscribe((t=>{n(8,m=ut.is_picked(r))})),t.$$set=t=>{"color"in t&&n(0,s=t.color),"entry"in t&&n(1,r=t.entry),"title"in t&&n(2,c=t.title),"dates"in t&&n(14,u=t.dates),"subject"in t&&n(3,a=t.subject),"keys"in t&&n(15,d=t.keys),"txt_full"in t&&n(4,p=t.txt_full),"comments"in t&&n(5,f=t.comments)},t.$$.update=()=>{32768&t.$$.dirty&&n(11,o=d.join(", ")),2&t.$$.dirty&&n(8,m=ut.is_picked(r)),16384&t.$$.dirty&&n(9,i=vt(u.updated)),16384&t.$$.dirty&&n(10,l=vt(u.created)),96&t.$$.dirty&&void 0!==f&&"function"==typeof window.retrieve_session&&(n(6,h=window.retrieve_session()),h&&n(7,g=Array.isArray(f)&&0!==f.length))},[s,r,c,a,p,f,h,g,m,i,l,o,function(){h&&"function"==typeof window.launch_comment_editor&&window.launch_comment_editor(h,r)},function(t){ut.toggle_pick(r),m?ct.increment():ct.decrement()},u,d,function(){m=this.checked,n(8,m),n(1,r)}]}class _t extends st{constructor(t){super(),lt(this,t,bt,$t,s,{color:0,entry:1,title:2,dates:14,subject:3,keys:15,txt_full:4,comments:5})}}function xt(e){let n;return{c(){n=y("div"),n.innerHTML='<h4 class="blg-item-title svelte-z1o6yc" style="background-color: lightgrey;color:darkgrey">End of Content</h4>',x(n,"class","blg-el-wrapper svelte-z1o6yc")},m(t,e){g(t,n,e)},p:t,d(t){t&&m(n)}}}function wt(t){let e,n,o,l,s,r,c,u,a,d,p,h,b,w,E,j,C,F,I,L,M,q,B,S,T,O,A,H,D;return{c(){e=y("div"),n=y("input"),o=v(),l=y("span"),s=$(t[1]),r=v(),c=y("span"),u=$(t[6]),a=v(),d=y("span"),p=$(t[5]),h=v(),b=y("h4"),w=$(t[7]),E=v(),j=y("h6"),C=$(t[9]),F=v(),I=y("div"),L=y("span"),M=$(t[3]),q=y("span"),q.textContent="subject",B=$("  "),S=y("h5"),T=$(t[8]),O=v(),A=y("div"),x(n,"type","checkbox"),z(l,"color","darkbrown"),x(l,"class","svelte-z1o6yc"),z(c,"background-color","yellowgreen"),x(c,"class","svelte-z1o6yc"),z(d,"background-color","lightblue"),x(d,"class","svelte-z1o6yc"),x(b,"class","blg-item-title svelte-z1o6yc"),z(b,"background-color","inherit"),x(j,"class","svelte-z1o6yc"),x(L,"class","thng-score svelte-z1o6yc"),z(q,"background-color","navy"),x(q,"class","svelte-z1o6yc"),x(S,"class","blg-item-subject svelte-z1o6yc"),x(A,"class","teaser svelte-z1o6yc"),x(e,"class","blg-el-wrapper svelte-z1o6yc")},m(i,m){g(i,e,m),f(e,n),n.checked=t[4],f(e,o),f(e,l),f(l,s),f(e,r),f(e,c),f(c,u),f(e,a),f(e,d),f(d,p),f(e,h),f(e,b),f(b,w),f(e,E),f(e,j),f(j,C),f(e,F),f(e,I),f(I,L),f(L,M),f(I,q),f(I,B),f(I,S),f(S,T),f(e,O),f(e,A),A.innerHTML=t[2],H||(D=[_(n,"change",t[20]),_(n,"click",t[10])],H=!0)},p(t,e){16&e&&(n.checked=t[4]),2&e&&k(s,t[1]),64&e&&k(u,t[6]),32&e&&k(p,t[5]),128&e&&k(w,t[7]),512&e&&k(C,t[9]),8&e&&k(M,t[3]),256&e&&k(T,t[8]),4&e&&(A.innerHTML=t[2])},d(t){t&&m(e),H=!1,i(D)}}}function kt(e){let n;function o(t,e){return t[0]&&"never"!=t[0].created?wt:xt}let i=o(e),l=i(e);return{c(){l.c(),n=b()},m(t,e){l.m(t,e),g(t,n,e)},p(t,[e]){i===(i=o(t))&&l?l.p(t,e):(l.d(1),l=i(t),l&&(l.c(),l.m(n.parentNode,n)))},i:t,o:t,d(t){l.d(t),t&&m(n)}}}function Et(t){if("never"===t)return"never";{let e=parseInt(t);return new Date(e).toLocaleDateString("en-US")}}function zt(t,e,n){let o,i,l,s,r,c,u,{abstract:a}=e,{color:d}=e,{dates:p}=e,{entry:f}=e,{id:g}=e,{keys:m}=e,{media:h}=e,{score:y}=e,{subject:$}=e,{title:v}=e,{txt_full:b}=e,_=!1;return ct.subscribe((t=>{n(4,_=ut.is_picked(f))})),t.$$set=t=>{"abstract"in t&&n(11,a=t.abstract),"color"in t&&n(12,d=t.color),"dates"in t&&n(0,p=t.dates),"entry"in t&&n(1,f=t.entry),"id"in t&&n(13,g=t.id),"keys"in t&&n(14,m=t.keys),"media"in t&&n(15,h=t.media),"score"in t&&n(16,y=t.score),"subject"in t&&n(17,$=t.subject),"title"in t&&n(18,v=t.title),"txt_full"in t&&n(19,b=t.txt_full)},t.$$.update=()=>{524288&t.$$.dirty&&n(2,i=void 0!==b?b.substr(0,250)+"&#8230;":"search"),16384&t.$$.dirty&&n(9,o=m?m.join(", "):""),65536&t.$$.dirty&&n(3,l=y?y.toFixed(3):0),2&t.$$.dirty&&n(4,_=ut.is_picked(f)),1&t.$$.dirty&&n(5,s=p?Et(p.updated):""),1&t.$$.dirty&&n(6,r=p?Et(p.created):""),262144&t.$$.dirty&&n(7,c=v?v.substr(0,16)+"...":"..."),131072&t.$$.dirty&&n(8,u=$?$.substr(0,32)+"...":"...")},[p,f,i,l,_,s,r,c,u,o,function(t){t.stopPropagation(),ut.toggle_pick(f),_?ct.increment():ct.decrement()},a,d,g,m,h,y,$,v,b,function(){_=this.checked,n(4,_),n(1,f)}]}class jt extends st{constructor(t){super(),lt(this,t,zt,kt,s,{abstract:11,color:12,dates:0,entry:1,id:13,keys:14,media:15,score:16,subject:17,title:18,txt_full:19})}}function Ct(t,e,n){const o=t.slice();return o[5]=e[n],o}function Ft(t,n){let o,l,s,r,c,u,a;const d=[n[5]];var h=n[1];function $(t){let n={};for(let t=0;t<d.length;t+=1)n=e(n,d[t]);return{props:n}}return h&&(l=new h($())),{key:t,first:null,c(){o=y("div"),l&&et(l.$$.fragment),s=v(),x(o,"id",r="xy_"+n[5].id),x(o,"class",p(Mt)+" svelte-1q6bcs0"),this.first=o},m(t,e){g(t,o,e),l&&nt(l,o,null),f(o,s),c=!0,u||(a=[_(o,"click",n[2]),_(o,"mouseover",n[3])],u=!0)},p(t,e){n=t;const i=1&e?Z(d,[tt(n[5])]):{};if(h!==(h=n[1])){if(l){W();const t=l;V(t.$$.fragment,1,0,(()=>{ot(t,1)})),Y()}h?(l=new h($()),et(l.$$.fragment),J(l.$$.fragment,1),nt(l,o,s)):l=null}else h&&l.$set(i);(!c||1&e&&r!==(r="xy_"+n[5].id))&&x(o,"id",r)},i(t){c||(l&&J(l.$$.fragment,t),c=!0)},o(t){l&&V(l.$$.fragment,t),c=!1},d(t){t&&m(o),l&&ot(l),u=!1,i(a)}}}function It(t){let e,n,o=[],i=new Map,l=t[0];const s=t=>t[5].id;for(let e=0;e<l.length;e+=1){let n=Ct(t,l,e),r=s(n);i.set(r,o[e]=Ft(r,n))}return{c(){e=y("div");for(let t=0;t<o.length;t+=1)o[t].c();x(e,"class",p(Lt)+" svelte-1q6bcs0")},m(t,i){g(t,e,i);for(let t=0;t<o.length;t+=1)o[t].m(e,null);n=!0},p(t,[n]){15&n&&(l=t[0],W(),o=Q(o,n,s,1,t,l,i,e,K,Ft,null,Ct),Y())},i(t){if(!n){for(let t=0;t<l.length;t+=1)J(o[t]);n=!0}},o(t){for(let t=0;t<o.length;t+=1)V(o[t]);n=!1},d(t){t&&m(e);for(let t=0;t<o.length;t+=1)o[t].d()}}}let Lt="grid-container",Mt="element-poster";function qt(t,e,n){let{things:o}=e,{thing_component:i}=e;const l=M();return t.$$set=t=>{"things"in t&&n(0,o=t.things),"thing_component"in t&&n(1,i=t.thing_component)},[o,i,function(t){let e=t.currentTarget.id;l("message",{type:"click",text:"click "+e})},function(t){let e=t.currentTarget.id;l("message",{type:"over",text:"over "+e})}]}class Bt extends st{constructor(t){super(),lt(this,t,qt,It,s,{things:0,thing_component:1})}}function St(t){let e,n,o,l;const s=t[3].default,c=r(s,t,t[2],null);return{c(){e=y("div"),c&&c.c(),x(e,"class","drag-container svelte-1qg5mt7")},m(i,s){g(i,e,s),c&&c.m(e,null),n=!0,o||(l=[_(e,"mousedown",t[0]),_(e,"mouseup",t[1])],o=!0)},p(t,[e]){c&&c.p&&(!n||4&e)&&a(c,s,t,t[2],n?u(s,t[2],e,null):d(t[2]),null)},i(t){n||(J(c,t),n=!0)},o(t){V(c,t),n=!1},d(t){t&&m(e),c&&c.d(t),o=!1,i(l)}}}function Tt(t,e,n){let{$$slots:o={},$$scope:i}=e;const l=M();let s={x:0,y:0};function r(t){window.removeEventListener("mousemove",c,!0),window.removeEventListener("mouseup",r,!0),l("message",{cmd:"stop"})}function c(t){if(void 0===t.target)return;const e=t.pageX-s.x,n=t.pageY-s.y;l("message",{cmd:"drag",w_delta:e,h_delta:n})}return t.$$set=t=>{"$$scope"in t&&n(2,i=t.$$scope)},[function(t){t.target&&(s.x=t.pageX,s.y=t.pageY,window.addEventListener("mousemove",c,!0),window.addEventListener("mouseup",r,!0))},r,i,o]}class Ot extends st{constructor(t){super(),lt(this,t,Tt,St,s,{})}}function At(t){let e;return{c(){e=$("ⓩ")},m(t,n){g(t,e,n)},d(t){t&&m(e)}}}function Ht(t){let e,n,o,l,s,c,p,h,b,w,E,j,C,F,I,L,M;const q=t[6].default,B=r(q,t,t[7],null);return C=new Ot({props:{$$slots:{default:[At]},$$scope:{ctx:t}}}),C.$on("message",t[2]),{c(){e=y("div"),n=y("div"),o=$(t[0]),l=v(),s=y("span"),c=$("[X]"),b=v(),w=y("p"),w.textContent="Press ESC to close window.",E=v(),B&&B.c(),j=v(),et(C.$$.fragment),x(s,"id",p="btn_close_"+t[1]),x(s,"class","btn_close svelte-8emtpk"),x(n,"id",h="popup_bar_"+t[1]),x(n,"class","popup_bar svelte-8emtpk"),z(w,"font-size","0.75em"),z(w,"font-weight","bold"),z(w,"color","darkgreen"),z(w,"padding-left","4px"),x(e,"id",F="popup_"+t[1]),x(e,"class","popup svelte-8emtpk")},m(i,r){g(i,e,r),f(e,n),f(n,o),f(n,l),f(n,s),f(s,c),f(e,b),f(e,w),f(e,E),B&&B.m(e,null),f(e,j),nt(C,e,null),I=!0,L||(M=[_(s,"click",Rt),_(n,"mousedown",t[4]),_(n,"mouseup",t[3])],L=!0)},p(t,[i]){(!I||1&i)&&k(o,t[0]),(!I||2&i&&p!==(p="btn_close_"+t[1]))&&x(s,"id",p),(!I||2&i&&h!==(h="popup_bar_"+t[1]))&&x(n,"id",h),B&&B.p&&(!I||128&i)&&a(B,q,t,t[7],I?u(q,t[7],i,null):d(t[7]),null);const l={};128&i&&(l.$$scope={dirty:i,ctx:t}),C.$set(l),(!I||2&i&&F!==(F="popup_"+t[1]))&&x(e,"id",F)},i(t){I||(J(B,t),J(C.$$.fragment,t),I=!0)},o(t){V(B,t),V(C.$$.fragment,t),I=!1},d(t){t&&m(e),B&&B.d(t),ot(C),L=!1,i(M)}}}var Dt=24;function Rt(t){let e=t.target.id;if(e){let t=`popup_${e.replace("btn_close_","")}`;var n=document.getElementById(t);if(void 0===n)return;n.style.display="none"}}function Nt(t,e){let n=document.getElementById("blg-window-full-text");if(n){n._blg_app_resized=!0;let i=n.getBoundingClientRect();var o=document.getElementById(`popup_${t}`);if(o){let t=o.getBoundingClientRect(),l=Math.floor(t.bottom-i.top)-e;n.style.height=l+"px"}}}function Ut(t,e,n){let{$$slots:o={},$$scope:i}=e,{title:l}=e,{scale_size_array:s}=e,{index:r=0}=e,c={x:0,y:0},u=0,a=0;function d(t){t&&(u=parseFloat(getComputedStyle(t,null).getPropertyValue("width").replace("px","")),a=parseFloat(getComputedStyle(t,null).getPropertyValue("height").replace("px","")),t.getBoundingClientRect().left,t.getBoundingClientRect().top)}let p=Object.assign({},s);function f(t){var e=document.getElementById(`popup_${t}`);e&&(e.style.width=window.innerWidth*p.w-Dt+"px",e.style.height=window.innerHeight*p.h-Dt+"px",d(e))}function g(t){window.removeEventListener("mousemove",h,!0)}function m(t){let e=t.target.id;if(e){let o=e.replace("popup_bar_",""),i=`popup_${o}`;var n=document.getElementById(i);if(!n)return;!function(t){let e=window._fws_z_order;if(void 0!==e){"string"==typeof t&&(t=parseInt(t));let n=e.indexOf(t);if(n>=0){e.splice(n,1),e.push(t);let o=500;for(let t of e){let e=`popup_${t}`,n=document.getElementById(e);n&&(n.style.zIndex=o++)}}}}(o),c.x=t.clientX-n.offsetLeft,c.y=t.clientY-n.offsetTop,window.addEventListener("mousemove",h,!0)}}function h(t){var e=document.getElementById(`popup_${r}`);if(void 0!==e){e.style.position="absolute";var n=Math.max(t.clientY-c.y,0),o=Math.max(t.clientX-c.x,0);e.style.top=n+"px",e.style.left=o+"px"}}return L((()=>{let t=window._fws_z_order;(void 0===t&&(window._fws_z_order=[],t=window._fws_z_order),t.push(r),void 0!==document.getElementById(`popup_${r}`))&&(f(r),document.getElementById(`popup_bar_${r}`).addEventListener("mousedown",m,!1),window.addEventListener("mouseup",g,!1),window.addEventListener("keydown",(t=>{if(27==t.keyCode){var e=document.getElementById(`popup_${r}`);if(void 0===e)return;e.style.display="none"}})),window.addEventListener("resize",(t=>{f(r)})),window.start_floating_window=t=>{!function(t){var e=document.getElementById(`popup_${t}`);e&&"block"!==e.style.display&&(e.style.top="4px",e.style.left="4px",e.style.width=window.innerWidth*p.w-Dt+"px",e.style.height=window.innerHeight*p.h-Dt+"px",e.style.display="block",setTimeout((()=>{Nt(t,4)}),40));setTimeout((()=>{Nt(t,4)}),20)}(t)})})),t.$$set=t=>{"title"in t&&n(0,l=t.title),"scale_size_array"in t&&n(5,s=t.scale_size_array),"index"in t&&n(1,r=t.index),"$$scope"in t&&n(7,i=t.$$scope)},[l,r,function(t){if(t&&t.detail)if("drag"==t.detail.cmd){let n=t.detail.w_delta,o=t.detail.h_delta;const i=u+n,l=a+o;(e=document.getElementById(`popup_${r}`))&&(i>300&&(e.style.width=i+"px"),l>300&&(e.style.height=l+"px"))}else if("stop"==t.detail.cmd){var e;d(e=document.getElementById(`popup_${r}`))}},g,m,s,o,i]}class Pt extends st{constructor(t){super(),lt(this,t,Ut,Ht,s,{title:0,scale_size_array:5,index:1})}}function Xt(t){return JSON.parse(JSON.stringify(t))}let Wt={color:"grey",title:"no content",_tracking:!1,dates:{created:"never",updated:"never"},subject:"",abstract:"no content",keys:[],media:{_x_link_counter:"nowhere",protocol:"default",poster:"test",source:"test"},components:{graphic:[],boxes:[]},comments:[],score:1};function Yt(t,e){return void 0!==t?(Wt=t,Jt=Object.assign({id:1,entry:-1},Wt)):t=Wt,e?Object.assign({},Jt):Xt(t)}let Jt=Object.assign({id:1,entry:-1},Wt);function Vt(t,e){let n=t-e.length;for(;n>0;)e.push(!1),n--}function Gt(t,e,n,o){let i=t.length,l=e.length,s=void 0===o?n-1:o-1;for(let n=0;n<i;n++)if(s+n<l){let o=e[s+n];if(!1!==o)o.id=n+1,t[n]=o;else{let e=Xt(Jt);e.id=n+1,t[n]=e}}else{let e=Xt(Jt);e.id=n+1,t[n]=e}return t}function Kt(t,e,n,o,i){if(n){let l=n.data;if(l){l=void 0!==i?i(l):function(t){return t.map((t=>(t.title=t.title?decodeURIComponent(t.title):"no title",t.abstract=t.abstract?decodeURIComponent(t.abstract):"no abstract",t.keys&&Array.isArray(t.keys)&&(t.keys=t.keys.map((t=>decodeURIComponent(t)))),t)))}(l);let s=n.count;if(void 0===e)return s>l.length&&Vt(s,l),[1,s,l];{s>o.length&&Vt(s,o);let e=l.length;for(let n=0;n<e;n++)o[n+t]=l.shift()}return[1,s,o]}}return[!1,!1,!1]}function Qt(){let t=3e3,e=1e3,n=Math.max(200,window.innerWidth);n=Math.min(t,n);let o=Math.max(600,window.innerHeight);if(o=Math.min(e,o),n>560){let i,l,s=.6;i=.8-s,l=(e-o)/400;let r=l*i+s,c=.2;return i=.96-c,l=(t-n)/2800,{w:l*i+c,h:r}}{let i,l,s=.8;i=.9-s,l=(e-o)/400;let r=l*i+s,c=n>480?.8:.95;return i=1-c,l=(t-n)/2800,{w:l*i+c,h:r}}}function Zt(t,e,n){const o=t.slice();return o[3]=e[n],o}function te(t,e){let n,o,i,l,s=e[3].title+"";return{key:t,first:null,c(){n=y("li"),o=$(s),i=v(),x(n,"id",l="xy_"+e[3].id),x(n,"class","element-poster"),this.first=n},m(t,e){g(t,n,e),f(n,o),f(n,i)},p(t,i){e=t,1&i&&s!==(s=e[3].title+"")&&k(o,s),1&i&&l!==(l="xy_"+e[3].id)&&x(n,"id",l)},d(t){t&&m(n)}}}function ee(e){let n,o,i=[],l=new Map,s=e[0];const r=t=>t[3].id;for(let t=0;t<s.length;t+=1){let n=Zt(e,s,t),o=r(n);l.set(o,i[t]=te(o,n))}return{c(){n=y("div"),o=y("ul");for(let t=0;t<i.length;t+=1)i[t].c();x(n,"class","blg-el-wrapper-full svelte-h1xdvy")},m(t,e){g(t,n,e),f(n,o);for(let t=0;t<i.length;t+=1)i[t].m(o,null)},p(t,[e]){1&e&&(s=t[0],i=Q(i,e,r,1,t,s,l,o,G,te,null,Zt))},i:t,o:t,d(t){t&&m(n);for(let t=0;t<i.length;t+=1)i[t].d()}}}function ne(t,e,n){let{link_picks:o}=e;return ct.subscribe((t=>{n(0,o=ut.get_pick_values())})),t.$$set=t=>{"link_picks"in t&&n(0,o=t.link_picks)},[o]}class oe extends st{constructor(t){super(),lt(this,t,ne,ee,s,{link_picks:0})}}let ie={},le={},se=[],re=null;function ce(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(function(t){var e=16*Math.random()|0;return("x"==t?e:3&e|8).toString(16)}))}function ue(){let t=[],e=Date.now();for(let n in ie){e-le[n]>14400&&t.push(n)}t.forEach((t=>{delete le[t],delete ie[t]})),t=[]}function ae(t){se.length>=200&&null===re&&(re=setTimeout(ue,6e5));let e=function(){let t=ce();for(;se.indexOf(t)>=0;)t=ce();return t}();return ie[t]=e,le[t]=Date.now(),se=Object.keys(ie),e}function de(t,e,n){const o=t.slice();return o[40]=e[n],o}function pe(e){let n,o,i,l,s=e[40].text+"";return{c(){n=y("option"),o=$(s),i=v(),n.__value=l=e[40],n.value=n.__value},m(t,e){g(t,n,e),f(n,o),f(n,i)},p:t,d(t){t&&m(n)}}}function fe(t){let n,o;const i=[t[5]];let l={};for(let t=0;t<i.length;t+=1)l=e(l,i[t]);return n=new _t({props:l}),{c(){et(n.$$.fragment)},m(t,e){nt(n,t,e),o=!0},p(t,e){const o=32&e[0]?Z(i,[tt(t[5])]):{};n.$set(o)},i(t){o||(J(n.$$.fragment,t),o=!0)},o(t){V(n.$$.fragment,t),o=!1},d(t){ot(n,t)}}}function ge(t){let e,n;return e=new oe({props:{link_picks:t[0]}}),{c(){et(e.$$.fragment)},m(t,o){nt(e,t,o),n=!0},p(t,n){const o={};1&n[0]&&(o.link_picks=t[0]),e.$set(o)},i(t){n||(J(e.$$.fragment,t),n=!0)},o(t){V(e.$$.fragment,t),n=!1},d(t){ot(e,t)}}}function me(t){let e,n,o,l,s,r,c,u,a,d,p,b,C,F,I,L,M,q,B,S,T,O,A,D,R,N,U,P,X,W,Y,G,K,Q,Z,tt,it,lt,st,rt,ct,ut,at,dt,pt,ft,gt,mt,ht,yt,$t,vt,bt,_t=t[10],xt=[];for(let e=0;e<_t.length;e+=1)xt[e]=pe(de(t,_t,e));return ft=new Bt({props:{things:t[6],thing_component:jt}}),ft.$on("message",t[12]),mt=new Pt({props:{title:t[5].title.substr(0,he)+"...",index:0,scale_size_array:t[11][0],$$slots:{default:[fe]},$$scope:{ctx:t}}}),yt=new Pt({props:{title:"Selection List",index:1,scale_size_array:t[11][1],$$slots:{default:[ge]},$$scope:{ctx:t}}}),{c(){e=y("div"),n=y("div"),o=y("div"),l=y("span"),l.textContent="Boxes",s=v(),r=y("input"),c=v(),u=y("button"),u.textContent="-",a=v(),d=y("button"),d.textContent="+",p=v(),b=y("div"),C=y("button"),C.textContent="search",F=v(),I=y("div"),L=$(" "),M=y("input"),q=v(),B=y("div"),S=y("button"),S.textContent="≤",T=v(),O=y("input"),A=v(),D=y("button"),D.textContent="≥",R=v(),N=y("input"),U=$("\n\t\t\tof "),P=$(t[7]),X=v(),W=y("div"),Y=y("select");for(let t=0;t<xt.length;t+=1)xt[t].c();G=v(),K=y("div"),Q=v(),Z=y("div"),tt=$("Title: "),it=$(t[3]),lt=y("div"),st=$("Subject: "),rt=$(t[4]),ct=v(),ut=y("div"),at=y("button"),at.textContent="show selections",dt=v(),pt=y("div"),et(ft.$$.fragment),gt=v(),et(mt.$$.fragment),ht=v(),et(yt.$$.fragment),z(l,"color","navy"),z(l,"font-weight","bold"),x(r,"type","number"),x(r,"class","blg-ctl-number-field svelte-aq6usa"),x(r,"min","1"),x(r,"max","4"),x(u,"class","blg-ctl-button svelte-aq6usa"),x(d,"class","blg-ctl-button svelte-aq6usa"),x(o,"class","blg-ctrl-panel svelte-aq6usa"),z(o,"display","inline-block"),z(o,"vertical-align","bottom"),z(o,"background-color","#EFFFFE"),x(M,"type","text"),z(I,"display","inline-block"),x(b,"class","blg-ctrl-panel svelte-aq6usa"),z(b,"display","inline-block"),z(b,"vertical-align","bottom"),z(b,"background-color","#EFEFFE"),x(S,"class","blg-ctl-button svelte-aq6usa"),x(O,"class","blg-ctl-slider svelte-aq6usa"),x(O,"type","range"),x(O,"min","1"),x(O,"max",t[7]),x(D,"class","blg-ctl-button svelte-aq6usa"),x(N,"type","number"),x(N,"class","blg-ctl-number-field svelte-aq6usa"),x(N,"min","1"),x(N,"max",t[7]),x(B,"class","blg-ctrl-panel svelte-aq6usa"),z(B,"display","inline-block"),z(B,"background-color","#FFFFFA"),void 0===t[1]&&H((()=>t[27].call(Y))),x(W,"class","blg-ctrl-panel svelte-aq6usa"),z(W,"display","inline-block"),z(W,"background-color","#FFFFFA"),z(n,"border","solid 2px navy"),z(n,"padding","4px"),z(n,"background-color","#EFEFEF"),x(Z,"class","sel-titles svelte-aq6usa"),x(lt,"class","sel-titles svelte-aq6usa"),x(ut,"class","sel-titles svelte-aq6usa"),z(ut,"width","15%"),z(K,"border","solid 1px grey"),z(K,"padding","4px"),z(K,"background-color","#F5F6EF"),x(pt,"class","blg-grid-container svelte-aq6usa")},m(i,m){g(i,e,m),f(e,n),f(n,o),f(o,l),f(o,s),f(o,r),E(r,t[9]),f(o,c),f(o,u),f(o,a),f(o,d),f(n,p),f(n,b),f(b,C),f(b,F),f(b,I),f(I,L),f(I,M),E(M,t[2]),f(n,q),f(n,B),f(B,S),f(B,T),f(B,O),E(O,t[8]),f(B,A),f(B,D),f(B,R),f(B,N),E(N,t[8]),f(B,U),f(B,P),f(n,X),f(n,W),f(W,Y);for(let t=0;t<xt.length;t+=1)xt[t].m(Y,null);j(Y,t[1]),f(e,G),f(e,K),f(K,Q),f(K,Z),f(Z,tt),f(Z,it),f(K,lt),f(lt,st),f(lt,rt),f(K,ct),f(K,ut),f(ut,at),f(e,dt),f(e,pt),nt(ft,pt,null),g(i,gt,m),nt(mt,i,m),g(i,ht,m),nt(yt,i,m),$t=!0,vt||(bt=[_(r,"input",t[23]),_(u,"click",t[13]),_(d,"click",t[14]),_(C,"click",t[20]),_(M,"input",t[24]),_(M,"keypress",t[18]),_(S,"click",t[16]),_(O,"change",t[25]),_(O,"input",t[25]),_(O,"change",t[15]),_(D,"click",t[17]),_(N,"input",t[26]),_(N,"change",t[15]),_(Y,"change",t[27]),_(Y,"change",t[19]),_(at,"click",t[21])],vt=!0)},p(t,e){if(512&e[0]&&w(r.value)!==t[9]&&E(r,t[9]),4&e[0]&&M.value!==t[2]&&E(M,t[2]),(!$t||128&e[0])&&x(O,"max",t[7]),256&e[0]&&E(O,t[8]),(!$t||128&e[0])&&x(N,"max",t[7]),256&e[0]&&w(N.value)!==t[8]&&E(N,t[8]),(!$t||128&e[0])&&k(P,t[7]),1024&e[0]){let n;for(_t=t[10],n=0;n<_t.length;n+=1){const o=de(t,_t,n);xt[n]?xt[n].p(o,e):(xt[n]=pe(o),xt[n].c(),xt[n].m(Y,null))}for(;n<xt.length;n+=1)xt[n].d(1);xt.length=_t.length}1026&e[0]&&j(Y,t[1]),(!$t||8&e[0])&&k(it,t[3]),(!$t||16&e[0])&&k(rt,t[4]);const n={};64&e[0]&&(n.things=t[6]),ft.$set(n);const o={};32&e[0]&&(o.title=t[5].title.substr(0,he)+"..."),32&e[0]|4096&e[1]&&(o.$$scope={dirty:e,ctx:t}),mt.$set(o);const i={};1&e[0]|4096&e[1]&&(i.$$scope={dirty:e,ctx:t}),yt.$set(i)},i(t){$t||(J(ft.$$.fragment,t),J(mt.$$.fragment,t),J(yt.$$.fragment,t),$t=!0)},o(t){V(ft.$$.fragment,t),V(mt.$$.fragment,t),V(yt.$$.fragment,t),$t=!1},d(t){t&&m(e),h(xt,t),ot(ft),t&&m(gt),ot(mt,t),t&&m(ht),ot(yt,t),vt=!1,i(bt)}}}let he=20;function ye(t,e,n){let{name:o}=e,i=[{id:1,text:"update_date"},{id:2,text:"score"},{id:3,text:"create_date"}],l=[],s=i[2],r="any",c="",u="",a=Yt(),d=Object.assign({id:0,entry:0},a),p=Object.assign({id:1,entry:-1},a),f={w:.4,h:.6};f=Qt();let g=[];function m(t){let e=Xt(p);return e.id=t,e}g.push(f),g.push(f),L((async()=>{window.app_page_gets_ccwid=t=>{},await window.retrieve_session(),window.addEventListener("resize",(t=>{let e=Qt();f.h=e.h,f.w=e.w}))}));let h=[p],y=[],$=1,v=1,b=1;function _(t,e){if(y.length>0)for(let n=t;n<e;n++)if(!1===y[n])return!0;return!1}function x(){let t=v+h.length,e=v-1;_(e,t)?k(e,h.length):Gt(h,y,v)}async function k(t,e){let o=void 0===e?h.length:e,i=void 0===t?v-1:t,l=encodeURIComponent(r);l+="|"+s.text;let c=function(t,e=!1){return t in ie?ie[t]:e?ae(t):void 0}(l,!0);i=Math.max(0,i);let u={uid:c,query:l,box_count:o,offset:i};try{let e="blog-search",o=`${u.uid}/${u.query}/${u.box_count}/${u.offset}`,l=location.host,s=location.protocol,r="//",c=await async function(t,e,n){return"function"==typeof window.personalization&&window.personalization(e),await n(t,e)}(`${s}${r}${l}/${e}/${o}`,u,postData),[a,d,p]=Kt(i,t,c,y);n(8,v=a),n(7,$=d),y=p,!1!==y&&n(6,h=Gt(h,y,v))}catch(t){alert(t.message)}}return ct.subscribe((t=>{ut.map_picks(h)})),t.$$set=t=>{"name"in t&&n(22,o=t.name)},[l,s,r,c,u,d,h,$,v,b,i,g,function(t){let e=t.detail.text,o=e.substr(e.indexOf("xy_")+3),i=t.detail.type;if(o=parseInt(o),o--,void 0!==o&&o>=0&&o<h.length){let t=h[o];void 0!==t&&("click"===i?(n(5,d=t),start_floating_window(0)):(n(3,c=t.title),n(4,u=t.subject)))}},function(){for(let t=0;t<b;t++){let t=h;t.pop(),n(6,h=[...t])}},async function(){let t=h.length;for(let t=0;t<b;t++){let t=h.length;t++;let e=m(t);n(6,h=[...h,e])}_(t,h.length)?k(t,h.length):n(6,h=Gt(h,y,v))},function(){x()},function(){n(8,v=1),x()},function(){n(8,v=$),x()},function(t){13==t.charCode&&(n(8,v=1),k())},function(t){n(8,v=1),k()},function(t){n(8,v=1),k()},function(t){n(0,l=ut.get_pick_values()),start_floating_window(1)},o,function(){b=w(this.value),n(9,b)},function(){r=this.value,n(2,r)},function(){v=w(this.value),n(8,v)},function(){v=w(this.value),n(8,v)},function(){s=function(t){const e=t.querySelector(":checked")||t.options[0];return e&&e.__value}(this),n(1,s),n(10,i)}]}return new class extends st{constructor(t){super(),lt(this,t,ye,me,s,{name:22},null,[-1,-1])}}({target:document.getElementById("app-main"),props:{name:"My Blog With Grid"}})}();
//# sourceMappingURL=bundle.js.map
