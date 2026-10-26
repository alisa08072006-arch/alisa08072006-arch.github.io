/* Alisa Akimova · base kit JS. Tolerant: every block checks that its elements exist, so a layout may leave any of them out.
   Provides: menu (#menuBtn/#menu/#menuClose), video tiles (.work with data-src + <video> + .stop; one at a time, sound on, tap-for-sound fallback),
   sticky Text|Call bar (#bar, shown after .hero, hidden near #contact), top bar hide on scroll (#topbar), phone wiring (#cfg[data-phone] → [data-sms]/[data-tel]),
   toast + copy buttons ([data-copy]), contact form (#form, fields c1..c5, posts to #cfg[data-form] when set, otherwise hands the visitor the message),
   call-prep card (#prep), "not ready" fold (#nrSend), slides (.slides > .track + .strip-line + .strip-foot arrows), the wash (section[data-wash] ↔ .wash img[data-wash]),
   photo viewer (#lb; galleries from window.GAL = {key:{title,sub,files:[...]}} and .cover[data-gallery]). */
(function(){
  var $=function(id){ return document.getElementById(id); };
  var menu=$('menu'), menuBtn=$('menuBtn'), menuClose=$('menuClose');
  function openMenu(){ if(!menu) return; menu.classList.add('on'); document.body.classList.add('lb-open'); if(menuBtn) menuBtn.setAttribute('aria-expanded','true'); if(menuClose) menuClose.focus(); }
  function closeMenu(){ if(!menu||!menu.classList.contains('on')) return; menu.classList.remove('on'); document.body.classList.remove('lb-open'); if(menuBtn){ menuBtn.setAttribute('aria-expanded','false'); menuBtn.focus(); } }
  if(menuBtn) menuBtn.addEventListener('click',openMenu);
  if(menuClose) menuClose.addEventListener('click',closeMenu);
  if(menu) menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click',closeMenu); });

  // one video at a time; load on first tap; sound on (tap-for-sound fallback when the browser refuses)
  var current=null;
  function stop(w){ if(!w) return; var v=w.querySelector('video'); if(v) v.pause(); w.classList.remove('playing','loading','muted','paused'); document.body.classList.remove('playing'); if(current===w) current=null; }
  document.querySelectorAll('.work[data-src]').forEach(function(w){
    var v=w.querySelector('video'); if(!v) return;
    w.addEventListener('click',function(e){
      if(e.target.closest('.stop')){ stop(w); return; }
      if(w.classList.contains('muted')&&!w.hasAttribute('data-silent')){ v.muted=false; w.classList.remove('muted'); return; }
      if(w.classList.contains('playing')){ if(v.paused){ v.play(); w.classList.remove('paused'); } else { v.pause(); w.classList.add('paused'); } return; }
      if(current && current!==w) stop(current);
      w._vis=true;
      if(!v.src){ v.src=w.getAttribute('data-src'); v.load(); }
      v.muted=w.hasAttribute('data-silent'); v.controls=false; w.classList.add('loading'); current=w;
      var p=v.play(); if(p&&p.catch) p.catch(function(err){ if(err&&err.name==='NotAllowedError'){ v.muted=true; w.classList.add('muted'); v.play().catch(function(){}); } else if(!err||err.name!=='AbortError'){ stop(w); toast('That video did not load. Tap again.'); } });
    });
    v.addEventListener('playing',function(){ if(w._vis===false){ stop(w); return; } w.classList.remove('loading','paused'); w.classList.add('playing'); document.body.classList.add('playing'); });
    v.addEventListener('pause',function(){ document.body.classList.remove('playing'); });
    v.addEventListener('ended',function(){ stop(w); v.currentTime=0; });
  });
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){ es.forEach(function(en){ en.target._vis=en.isIntersecting; if(!en.isIntersecting && (en.target.classList.contains('playing')||en.target.classList.contains('loading'))) stop(en.target); }); },{threshold:0});
    document.querySelectorAll('.work[data-src]').forEach(function(w){ io.observe(w); });
  }

  // sticky bar + top bar
  var bar=$('bar'), hero=document.querySelector('.hero'), contact=$('contact'), top=$('topbar'), lastY=0;
  function onScroll(){
    if(bar){ var past=hero?hero.getBoundingClientRect().bottom<0:scrollY>400; var atContact=contact?contact.getBoundingClientRect().top<innerHeight*0.7:false; bar.classList.toggle('on',past&&!atContact); }
    if(top){ var y=scrollY; if(y>lastY+4&&y>120){top.classList.add('hide')} else if(y<lastY-4||y<=120){top.classList.remove('hide')} lastY=y; }
  }
  addEventListener('scroll',onScroll,{passive:true}); addEventListener('resize',onScroll); onScroll();

  // phone: one source
  var cfg=$('cfg'), PH=cfg?cfg.getAttribute('data-phone'):'', PHP=cfg?cfg.getAttribute('data-phone-pretty'):'';
  var inArtifact=/claude\.ai|claudeusercontent/.test(location.hostname);
  function copyText(t){ if(navigator.clipboard&&navigator.clipboard.writeText) return navigator.clipboard.writeText(t); var i=document.createElement('textarea'); i.value=t; i.setAttribute('readonly',''); i.style.cssText='position:fixed;opacity:0'; document.body.appendChild(i); i.select(); var ok=false; try{ok=document.execCommand('copy')}catch(e){} i.remove(); return ok?Promise.resolve():Promise.reject(); }
  if(PH){
    var pt=$('phoneTxt'); if(pt){ pt.textContent=PHP; pt.classList.remove('ph'); }
    var pc=$('phoneCopy'); if(pc){ pc.hidden=false; pc.setAttribute('data-copy',PHP); }
    document.querySelectorAll('[data-sms]').forEach(function(a){ a.href='sms:'+PH+'?&body='+encodeURIComponent('Hi Alisa, '); });
    document.querySelectorAll('[data-tel]').forEach(function(a){ a.href='tel:'+PH; });
    if(inArtifact){ document.querySelectorAll('[data-sms],[data-tel]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); copyText(PHP).then(function(){toast('Number copied: '+PHP)},function(){toast(PHP)}); }); }); }
  }

  // toast + copy
  function toast(t){ var el=$('toast'); if(!el) return; el.textContent=t; el.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(function(){el.classList.remove('on')},1800); }
  document.querySelectorAll('[data-copy]').forEach(function(b){ b.addEventListener('click',function(){ var t=b.getAttribute('data-copy'); copyText(t).then(function(){toast('Copied')},function(){toast(t)}); }); });

  // contact form
  var form=$('form');
  function g(id){ var el=$(id); return el?(el.value||'').trim():''; }
  if(form) form.addEventListener('submit',function(e){ e.preventDefault(); var f=this, ph=$('c4'); if(ph&&!ph.value.trim()){ ph.focus(); toast('Your phone number, please'); return; }
    var msg='Hi Alisa, this is '+(g('c1')||'-')+' from '+(g('c2')||'-')+'. '+(g('c5')||'')+' Instagram: '+(g('c3')||'-')+'. Phone: '+g('c4');
    var endpoint=cfg?cfg.getAttribute('data-form'):'', nm=g('c1'), phn=g('c4');
    var done=function(){ f.innerHTML='<p class="lede">Thanks. I\'ll call or text you.</p>'; openPrep({name:nm,phone:phn,live:true,msg:msg}); };
    var hand=function(){ f.innerHTML='<p class="lede">'+(inArtifact?'Preview: this is the message a visitor sends you.':(endpoint?'Something went wrong sending this. Your message is ready to text or email:':'Your message is ready. Text it or email it to me:'))+'</p><p class="plain" id="handMsg"></p><div class="row"><button class="btn solid" type="button" id="handCopy">Copy message</button>'+(PH?'<a class="btn" href="sms:'+PH+'?&body='+encodeURIComponent(msg)+'">Text it</a>':'')+'<a class="btn" href="mailto:info@alisaakimova.com?subject=From%20your%20website&body='+encodeURIComponent(msg)+'">Email it</a></div>'; $('handMsg').textContent=msg; $('handCopy').addEventListener('click',function(){copyText(msg).then(function(){toast('Copied')},function(){toast('Select and copy the text above')})}); openPrep({name:nm,phone:phn,live:false,msg:msg}); };
    if(endpoint && !inArtifact){ fetch(endpoint,{method:'POST',body:new FormData(f),headers:{'Accept':'application/json'}}).then(function(r){ r.ok?done():hand(); },hand); } else hand(); });

  // call prep (optional 3 questions after Send)
  var prep=$('prep'), prepCtx=null, ACCESS_KEY=($('accessKey')||{}).value||'';
  function openPrep(ctx){ if(!prep) return; prepCtx=ctx; var ey=$('prepEyebrow'); if(ey) ey.textContent=ctx.live?'Sent. Thank you.':'One more thing, if you like.'; prep.classList.add('on'); document.body.classList.add('lb-open'); setTimeout(function(){ var p1=$('p1'); if(p1) p1.focus(); },450); }
  function closePrep(){ if(!prep) return; prep.classList.remove('on'); document.body.classList.remove('lb-open'); }
  if($('prepClose')) $('prepClose').addEventListener('click',closePrep);
  if($('prepSkip')) $('prepSkip').addEventListener('click',function(){ closePrep(); toast('No problem. Talk soon.'); });
  if($('prepSend')) $('prepSend').addEventListener('click',function(){ var a=[g('p1'),g('p2'),g('p3')]; if(!a.join('')){ toast('Write a line or two, or tap Skip'); return; }
    var qs=['Business','Wants','Result']; var extra=qs.map(function(q,i){return q+': '+(a[i]||'-')}).join(' | ');
    var endpoint=cfg?cfg.getAttribute('data-form'):''; var btn=this; btn.disabled=true;
    var finish=function(){ closePrep(); toast(prepCtx&&prepCtx.live?'Got it. Thank you.':'Added to your message.'); };
    if(prepCtx&&prepCtx.live&&endpoint&&!inArtifact){ var fd=new FormData(); fd.append('subject','Call prep: '+(prepCtx.name||'-')); fd.append('name',prepCtx.name||'-'); fd.append('phone',prepCtx.phone||'-'); fd.append('business',a[0]); fd.append('wants',a[1]); fd.append('result',a[2]); if(ACCESS_KEY) fd.append('access_key',ACCESS_KEY);
      var fail=function(){ btn.disabled=false; toast('Did not send. Try again.'); };
      fetch(endpoint,{method:'POST',body:fd,headers:{'Accept':'application/json'}}).then(function(r){ r.ok?finish():fail(); },fail); }
    else { var full=(prepCtx?prepCtx.msg:'')+' | '+extra; var hm=$('handMsg'); if(hm){ hm.textContent=full; var hc=$('handCopy'); if(hc){ hc.onclick=function(){copyText(full).then(function(){toast('Copied')},function(){toast('Select and copy the text above')})}; } document.querySelectorAll('#form a.btn').forEach(function(x){ x.href=x.href.replace(/body=[^&]*/,'body='+encodeURIComponent(full)); }); } finish(); } });

  // "not ready to talk" fold
  if($('nrSend')) $('nrSend').addEventListener('click',function(){ var a=g('nr1'),b=g('nr2'); if(!a||!b){ toast('Instagram and email, please'); return; }
    var msg='Hi Alisa, ideas for my page please. Instagram: '+a+'. Email: '+b; var row=this.parentNode; row.innerHTML='<button class="btn" type="button" id="nrCopy">Copy</button>'+(PH?'<a class="btn accent" href="sms:'+PH+'?&body='+encodeURIComponent(msg)+'">Text it</a>':'')+'<a class="btn" href="mailto:info@alisaakimova.com?subject=Ideas%20for%20my%20page&body='+encodeURIComponent(msg)+'">Email it</a>'; $('nrCopy').addEventListener('click',function(){ copyText(msg).then(function(){toast('Copied')},function(){toast(msg)}); }); if(inArtifact){ row.querySelectorAll('a').forEach(function(x){ if(x.href.indexOf('sms:')===0){ x.addEventListener('click',function(e){ e.preventDefault(); copyText(msg).then(function(){toast('Copied. Text it to '+PHP)},function(){toast(msg)}); }); } }); } });

  // slides: every .slides strip gets arrows (computer), a progress line, swipe on phones
  document.querySelectorAll('.slides').forEach(function(box){ var strip=box.querySelector('.track'); if(!strip) return; var line=box.querySelector('.strip-line i'), btns=box.querySelectorAll('.strip-foot .arrows button');
    function upd(){ var max=strip.scrollWidth-strip.clientWidth; if(line){ var w=Math.min(1,Math.max(.08,strip.clientWidth/strip.scrollWidth)); line.style.width=(w*100)+'%'; line.style.transform='translateX('+(max>0?(strip.scrollLeft/max)*(100/w-100):0)+'%)'; }
      btns.forEach(function(b){ b.disabled = b.getAttribute('data-dir')==='-1' ? strip.scrollLeft<4 : strip.scrollLeft>max-4; }); }
    strip.addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd); upd();
    btns.forEach(function(b){ b.addEventListener('click',function(){ var card=strip.firstElementChild, step=card?card.getBoundingClientRect().width+18:300; strip.scrollBy({left:step*parseInt(b.getAttribute('data-dir'),10),behavior:'smooth'}); }); });
  });

  // the wash follows the section in view
  (function(){ var imgs=document.querySelectorAll('.wash img'), secs=document.querySelectorAll('[data-wash]'), last=null; if(!imgs.length||!secs.length) return;
    function pick(){ var best=null,bd=1e9; secs.forEach(function(sec){ if(sec.tagName==='IMG') return; var r=sec.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return; var d=Math.abs(r.top+Math.min(r.height,innerHeight)*0.35-innerHeight*0.4); if(d<bd){bd=d;best=sec;} }); if(!best) return; var k=best.getAttribute('data-wash'); if(k===last) return; last=k; imgs.forEach(function(im){ im.classList.toggle('on', im.getAttribute('data-wash')===k); }); }
    addEventListener('scroll',pick,{passive:true}); addEventListener('resize',pick); pick();
  })();

  // photo viewer: galleries from window.GAL, opened by .cover[data-gallery] or any [data-gallery]
  (function(){ var lb=$('lb'), track=$('lbTrack'), cnt=$('lbCount'), ttl=$('lbTitle'), GAL=window.GAL||{}, cur=null, lastFocus=null; if(!lb||!track) return;
    function idx(){ return Math.round(track.scrollLeft/track.clientWidth); }
    function upd(){ var g=GAL[cur]; if(g&&cnt) cnt.textContent=(idx()+1)+' / '+g.files.length; }
    function open(key,start){ var g=GAL[key]; if(!g) return; cur=key; lastFocus=document.activeElement; track.innerHTML='';
      g.files.forEach(function(src,j){ var f=document.createElement('figure'); var im=document.createElement('img'); im.src=src; im.alt=g.title+', photo '+(j+1); im.loading=j<2?'eager':'lazy'; im.decoding='async'; f.appendChild(im); track.appendChild(f); });
      if(ttl){ ttl.innerHTML='<b></b>'; ttl.querySelector('b').textContent=g.title; ttl.appendChild(document.createTextNode(g.sub||'')); }
      lb.classList.add('on'); document.body.classList.add('lb-open'); track.scrollLeft=(start||0)*track.clientWidth; upd(); var c=$('lbClose'); if(c) c.focus(); if(current) stop(current); }
    function close(){ lb.classList.remove('on'); document.body.classList.remove('lb-open'); cur=null; if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
    function go(d){ track.scrollBy({left:d*track.clientWidth,behavior:'smooth'}); }
    document.querySelectorAll('[data-gallery]').forEach(function(c){ c.addEventListener('click',function(){ open(c.getAttribute('data-gallery'), parseInt(c.getAttribute('data-start')||'0',10)); }); });
    if($('lbClose')) $('lbClose').addEventListener('click',close);
    if($('lbPrev')) $('lbPrev').addEventListener('click',function(){go(-1)}); if($('lbNext')) $('lbNext').addEventListener('click',function(){go(1)});
    track.addEventListener('scroll',function(){ upd(); },{passive:true});
    track.addEventListener('click',function(e){ if(e.target===track||e.target.tagName==='FIGURE') close(); });
    addEventListener('keydown',function(e){ if(!cur) return; if(e.key==='Escape') close(); else if(e.key==='ArrowRight') go(1); else if(e.key==='ArrowLeft') go(-1); });
    window.openGallery=open;
  })();

  addEventListener('keydown',function(e){ if(e.key==='Escape'){ closeMenu(); closePrep(); if(current) stop(current); } });
})();
