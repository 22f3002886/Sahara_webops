'use strict';
const menuButton = document.querySelector('#menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; navigation.classList.toggle('open',open); menuButton.setAttribute('aria-expanded',String(open)); });
navigation.addEventListener('click', event => { if(event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if(event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menuButton.focus(); } });
document.addEventListener('click', event => { if(!event.target.closest('.header')) closeMenu(); });
matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);
const galleryItems = [...document.querySelectorAll('.gallery-open')];
const lightbox = document.querySelector('#lightbox');
let photoIndex=0;
let photoTrigger;
function showPhoto(index) {
 photoIndex=(index+galleryItems.length)%galleryItems.length;
 const item=galleryItems[photoIndex];const source=item.querySelector('img');
 const preview=document.querySelector('#lightbox-image');preview.src=source.src;preview.alt=source.alt;
 document.querySelector('#lightbox-caption').textContent=item.dataset.caption;
 document.querySelector('#lightbox-count').textContent=`${photoIndex+1} / ${galleryItems.length}`;
}
galleryItems.forEach((item,index)=>item.addEventListener('click',()=>{photoTrigger=item;showPhoto(index);lightbox.showModal();document.querySelector('#lightbox-close').focus();}));
document.querySelector('#lightbox-close').addEventListener('click',()=>lightbox.close());
document.querySelector('#lightbox-prev').addEventListener('click',()=>showPhoto(photoIndex-1));
document.querySelector('#lightbox-next').addEventListener('click',()=>showPhoto(photoIndex+1));
lightbox.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();showPhoto(photoIndex+1);}if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(photoIndex-1);}});
lightbox.addEventListener('click',event=>{if(event.target===lightbox){const r=lightbox.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)lightbox.close();}});
lightbox.addEventListener('close',()=>photoTrigger?.focus());
lightbox.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;
 const controls=[...lightbox.querySelectorAll('button')];const first=controls[0];const last=controls.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
