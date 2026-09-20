// Capa exclusivamente visual: reutiliza los nodos y eventos de los módulos existentes.
const byId=(id:string)=>document.getElementById(id)!;
export function panel(id:string,label:string){const section=document.createElement('section');section.id=id;section.className='ui-view';section.setAttribute('aria-label',label);return section;}
export function emptyState(title:string,message:string){const box=document.createElement('div');box.className='ui-empty';const h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=message;box.append(h,p);return box;}
export function accordion(label:string,nodes:Node[]){const details=document.createElement('details');details.className='ui-accordion';const summary=document.createElement('summary');summary.textContent=label;details.append(summary,...nodes);return details;}
export function tabs(container:HTMLElement,entries:{id:string;label:string;content:HTMLElement}[]){const list=document.createElement('div');list.className='ui-tabs';list.setAttribute('role','tablist');list.setAttribute('aria-label','Secciones de análisis');const buttons:HTMLButtonElement[]=[];
 function activate(i:number,focus=false){entries.forEach((entry,n)=>{entry.content.hidden=n!==i;buttons[n].setAttribute('aria-selected',String(n===i));buttons[n].tabIndex=n===i?0:-1;});if(focus)buttons[i].focus();}
 entries.forEach((entry,i)=>{const b=document.createElement('button');b.type='button';b.id='tab-'+entry.id;b.textContent=entry.label;b.setAttribute('role','tab');b.setAttribute('aria-controls',entry.content.id);entry.content.setAttribute('role','tabpanel');entry.content.setAttribute('aria-labelledby',b.id);entry.content.tabIndex=0;b.onclick=()=>activate(i);b.onkeydown=e=>{let next=i;if(e.key==='ArrowRight')next=(i+1)%entries.length;else if(e.key==='ArrowLeft')next=(i+entries.length-1)%entries.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=entries.length-1;else return;e.preventDefault();activate(next,true);};buttons.push(b);list.append(b);});container.append(list,...entries.map(e=>e.content));activate(0);return {activate};}
export function initPresentation(){
 const main=document.querySelector('main')!,header=document.querySelector('header')!,form=byId('chart-form'),results=byId('results'),input=document.querySelector('.input-panel')!,wheel=document.querySelector('.wheel-section')!;
 const oldWorkspace=document.querySelector('.workspace')!,oldResults=document.querySelector('.results-panel')!,intro=document.querySelector('.intro')!;
 const nav=document.createElement('nav');nav.className='main-nav';nav.setAttribute('aria-label','Navegación principal');
 const views=[panel('view-new','Nueva carta'),panel('view-chart','Carta'),panel('view-analysis','Análisis'),panel('view-saved','Guardadas')];
 main.append(...views);
 const names=['Nueva carta','Carta','Análisis','Guardadas'];let active=0;
 views.forEach((view,i)=>{const b=document.createElement('button');b.type='button';b.textContent=names[i];b.dataset.view=String(i);b.setAttribute('aria-controls',view.id);b.onclick=()=>show(i,true);nav.append(b);});
 const pageTitle=document.createElement('h1');pageTitle.id='page-title';pageTitle.tabIndex=-1;const top=document.createElement('div');top.className='page-heading';top.append(pageTitle);
 const alerts=document.createElement('div');alerts.className='ui-alerts';alerts.append(byId('status'),byId('error'));
 header.querySelector('.badge')?.remove();header.querySelector('.brand small')?.remove();header.querySelector('.seal')?.remove();header.append(nav);
 const brand=header.querySelector('a')!;brand.setAttribute('href','#view-new');brand.addEventListener('click',e=>{e.preventDefault();show(0,true);});
 const skip=document.createElement('a');skip.href='#page-title';skip.className='skip-link';skip.textContent='Ir al contenido';document.body.prepend(skip);
 views[0].append(input);input.querySelector('.section-title')?.remove();
 const house=byId('house-system'),houseLabel=document.querySelector('label[for="house-system"]')!;form.insertBefore(houseLabel,form.querySelector('details'));form.insertBefore(house,form.querySelector('details'));
 form.querySelector('summary')!.textContent='Opciones avanzadas';byId('calculate').textContent='Calcular carta';
 const formError=document.createElement('p');formError.className='ui-error';formError.id='form-error';formError.setAttribute('role','alert');formError.hidden=true;form.prepend(formError);
 form.addEventListener('invalid',e=>{const field=e.target as HTMLInputElement;field.closest('details')?.setAttribute('open','');const label=document.querySelector(`label[for="${field.id}"]`)?.textContent||'este campo';formError.textContent=`Revisá ${label.toLowerCase()}: ${field.validationMessage}`;formError.hidden=false;field.setAttribute('aria-invalid','true');},true);
 form.addEventListener('input',e=>{const field=e.target as HTMLInputElement;if(field.validity?.valid)field.removeAttribute('aria-invalid');formError.hidden=true;});
 const chartEmpty=byId('empty');chartEmpty.classList.add('ui-empty');chartEmpty.innerHTML='<h2>Tu carta, en un solo vistazo</h2><p>Completá los datos en Nueva carta para ver la rueda.</p>';views[1].append(chartEmpty,results);results.classList.add('panel');
 const positions=panel('analysis-positions','Posiciones'),aspects=panel('analysis-aspects','Aspectos'),dignities=panel('analysis-dignities','Dignidades'),terms=panel('analysis-terms','Términos'),lots=panel('analysis-lots','Lotes'),predictive=panel('analysis-predictive','Profecciones');
 positions.append(byId('angles'));
 for(const id of ['bodies','cusps']){const wrap=byId(id).closest('.table-wrap')!;const next=wrap.nextElementSibling;positions.append(wrap);if(next?.classList.contains('hint'))positions.append(next);}
 positions.append(byId('technical').closest('details')!);
 dignities.append(byId('chart-dignities'));
 // Desplaza el bloque completo de orbes y aspectos conservando cada control y listener.
 const start=byId('planet-orbs').previousElementSibling!.previousElementSibling!;let node:Element|null=start;while(node){const next:Element|null=node.nextElementSibling;aspects.append(node);node=next;}
 const controls=[wheel.querySelector('.wheel-controls')!,wheel.querySelector('.wheel-selects')!];wheel.querySelector('h3')!.after(accordion('Opciones de la rueda',controls));
 const termInfo=byId('term-info'),wheelHint=termInfo.nextElementSibling!;wheelHint.textContent='La rueda encaja al ancho de la pantalla. Usá Ampliación para inspeccionar los detalles; las tablas están en Análisis.';
 wheel.append(accordion('Lectura de términos y posiciones',[termInfo,wheelHint]));
 terms.append(byId('reference-title').closest('section')!);lots.append(byId('lots-section'));predictive.append(byId('profections-section'));
 const natalPanels=[positions,aspects,dignities];const gates=natalPanels.map(p=>{const contents=document.createElement('div');contents.className='analysis-content';contents.append(...Array.from(p.childNodes));const empty=emptyState('Todavía no hay una carta calculada','Completá los datos en Nueva carta para consultar este análisis.');p.append(empty,contents);return {contents,empty};});
 tabs(views[2],[{id:'positions',label:'Posiciones',content:positions},{id:'aspects',label:'Aspectos',content:aspects},{id:'dignities',label:'Dignidades',content:dignities},{id:'terms',label:'Términos',content:terms},{id:'lots',label:'Lotes',content:lots},{id:'predictive',label:'Profecciones',content:predictive}]);
 views[3].append(emptyState('Todavía no hay cartas guardadas','Este espacio estará disponible en una próxima versión.'));
 const scope=document.querySelector('.scope')!;scope.querySelector('p')!.textContent=scope.querySelector('p')!.textContent!.replace('Sin técnicas predictivas ni interpretación automática.','Profecciones anuales por signos enteros. Sin interpretación automática.');
 const help=accordion('Acerca de esta aplicación',[scope]);main.append(top,alerts,...views,help);intro.remove();oldWorkspace.remove();oldResults.remove();
 function show(i:number,focus=false){const changed=active!==i;active=i;views.forEach((view,n)=>view.hidden=n!==i);nav.querySelectorAll('button').forEach((b,n)=>{if(n===i)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});pageTitle.textContent=names[i];if(focus)pageTitle.focus({preventScroll:true});if(changed||focus)window.scrollTo({top:0,behavior:'auto'});}
 let wasHidden=results.hidden;
 function sync(){gates.forEach(({contents,empty})=>{contents.hidden=results.hidden;empty.hidden=!results.hidden;});if(wasHidden&&!results.hidden&&active===0)show(1);wasHidden=results.hidden;}
 new MutationObserver(sync).observe(results,{attributes:true,attributeFilter:['hidden']});sync();show(0);
 function enhance(){document.querySelectorAll('table').forEach(table=>{table.classList.add('ui-table');const wrap=table.closest('.table-wrap');if(wrap){wrap.setAttribute('tabindex','0');if(!wrap.hasAttribute('aria-label'))wrap.setAttribute('aria-label','Tabla desplazable horizontalmente');}});document.querySelectorAll('details').forEach(d=>d.classList.add('ui-accordion'));document.querySelectorAll('input:not([type=checkbox]),select').forEach(el=>el.classList.add('ui-field'));document.querySelectorAll('.panel').forEach(el=>el.classList.add('ui-panel'));byId('calculate').classList.add('ui-primary');byId('error').classList.add('ui-error');}
 let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance();});}).observe(main,{childList:true,subtree:true});enhance();
}
initPresentation();
