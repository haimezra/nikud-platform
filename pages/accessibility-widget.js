(function() {
  var STORAGE_KEY = 'nikud_accessibility_prefs'

  var state = {
    fontScale: 1,
    contrast: false,
    grayscale: false,
    underlineLinks: false,
    stopAnimations: false,
    bigCursor: false,
    readableFont: false
  }

  try {
    var saved = localStorage.getItem(STORAGE_KEY)
    if (saved) state = Object.assign(state, JSON.parse(saved))
  } catch(e) {}

  var style = document.createElement('style')
  style.textContent = `
    #a11y-toggle-btn{position:fixed;bottom:20px;left:20px;width:52px;height:52px;border-radius:50%;background:#6C63FF;color:#fff;border:none;cursor:pointer;z-index:99998;box-shadow:0 6px 20px rgba(0,0,0,0.3);font-size:1.5rem;display:flex;align-items:center;justify-content:center}
    #a11y-toggle-btn:hover{transform:scale(1.06)}
    #a11y-panel{position:fixed;bottom:82px;left:20px;width:280px;max-height:70vh;overflow-y:auto;background:#1C2333;border:1px solid #2A3450;border-radius:16px;padding:16px;z-index:99999;display:none;box-shadow:0 12px 40px rgba(0,0,0,0.4);font-family:'Heebo',sans-serif;direction:rtl;color:#E8EBF4}
    #a11y-panel.open{display:block}
    #a11y-panel h3{font-size:0.95rem;margin:0 0 12px;font-weight:700}
    .a11y-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid #2A3450;font-size:0.85rem}
    .a11y-row:last-of-type{border-bottom:none}
    .a11y-btn{background:#111827;border:1px solid #2A3450;color:#E8EBF4;border-radius:8px;padding:6px 10px;cursor:pointer;font-family:'Heebo',sans-serif;font-size:0.8rem}
    .a11y-btn.active{background:#6C63FF;border-color:#6C63FF;color:#fff}
    .a11y-fontctrl{display:flex;gap:6px;align-items:center}
    #a11y-reset{width:100%;margin-top:12px;padding:9px;background:rgba(255,107,107,0.15);border:1px solid rgba(255,107,107,0.3);color:#FF6B6B;border-radius:8px;cursor:pointer;font-family:'Heebo',sans-serif;font-size:0.82rem}
    body.a11y-contrast{filter:contrast(1.35) brightness(1.05) !important}
    body.a11y-grayscale{filter:grayscale(1) !important}
    body.a11y-contrast.a11y-grayscale{filter:grayscale(1) contrast(1.35) brightness(1.05) !important}
    body.a11y-underline a{text-decoration:underline !important}
    body.a11y-stop-anim *{animation:none !important;transition:none !important}
    body.a11y-big-cursor,body.a11y-big-cursor *{cursor:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="black" stroke="white" stroke-width="1" d="M4 2l16 8-7 2-2 7z"/></svg>') 0 0, auto !important}
    body.a11y-readable-font,body.a11y-readable-font *{font-family:Arial, sans-serif !important;letter-spacing:0.02em !important}
  `
  document.head.appendChild(style)

  var btn = document.createElement('button')
  btn.id = 'a11y-toggle-btn'
  btn.setAttribute('aria-label', 'תפריט נגישות')
  btn.innerHTML = '♿'

  var panel = document.createElement('div')
  panel.id = 'a11y-panel'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', 'הגדרות נגישות')
  panel.innerHTML = `
    <h3>הגדרות נגישות</h3>
    <div class="a11y-row">
      <span>גודל טקסט</span>
      <div class="a11y-fontctrl">
        <button class="a11y-btn" id="a11y-font-dec">א-</button>
        <button class="a11y-btn" id="a11y-font-inc">א+</button>
      </div>
    </div>
    <div class="a11y-row"><span>ניגודיות גבוהה</span><button class="a11y-btn" id="a11y-contrast">הפעל</button></div>
    <div class="a11y-row"><span>גווני אפור</span><button class="a11y-btn" id="a11y-grayscale">הפעל</button></div>
    <div class="a11y-row"><span>הדגשת קישורים</span><button class="a11y-btn" id="a11y-underline">הפעל</button></div>
    <div class="a11y-row"><span>עצירת אנימציות</span><button class="a11y-btn" id="a11y-stopanim">הפעל</button></div>
    <div class="a11y-row"><span>סמן עכבר גדול</span><button class="a11y-btn" id="a11y-cursor">הפעל</button></div>
    <div class="a11y-row"><span>גופן קריא</span><button class="a11y-btn" id="a11y-readable">הפעל</button></div>
    <button id="a11y-reset">איפוס כל ההגדרות</button>
  `

  document.body.appendChild(btn)
  document.body.appendChild(panel)

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch(e) {}
  }

  function applyAll() {
    document.body.style.fontSize = state.fontScale === 1 ? '' : (state.fontScale * 100) + '%'
    document.body.classList.toggle('a11y-contrast', state.contrast)
    document.body.classList.toggle('a11y-grayscale', state.grayscale)
    document.body.classList.toggle('a11y-underline', state.underlineLinks)
    document.body.classList.toggle('a11y-stop-anim', state.stopAnimations)
    document.body.classList.toggle('a11y-big-cursor', state.bigCursor)
    document.body.classList.toggle('a11y-readable-font', state.readableFont)

    toggleBtnState('a11y-contrast', state.contrast)
    toggleBtnState('a11y-grayscale', state.grayscale)
    toggleBtnState('a11y-underline', state.underlineLinks)
    toggleBtnState('a11y-stopanim', state.stopAnimations)
    toggleBtnState('a11y-cursor', state.bigCursor)
    toggleBtnState('a11y-readable', state.readableFont)
  }

  function toggleBtnState(id, isActive) {
    var el = document.getElementById(id)
    if (!el) return
    el.classList.toggle('active', isActive)
    el.textContent = isActive ? 'כבה' : 'הפעל'
  }

  document.getElementById('a11y-font-inc').onclick = function() {
    state.fontScale = Math.min(1.6, +(state.fontScale + 0.1).toFixed(2))
    applyAll(); save()
  }
  document.getElementById('a11y-font-dec').onclick = function() {
    state.fontScale = Math.max(0.8, +(state.fontScale - 0.1).toFixed(2))
    applyAll(); save()
  }
  document.getElementById('a11y-contrast').onclick = function() { state.contrast = !state.contrast; applyAll(); save() }
  document.getElementById('a11y-grayscale').onclick = function() { state.grayscale = !state.grayscale; applyAll(); save() }
  document.getElementById('a11y-underline').onclick = function() { state.underlineLinks = !state.underlineLinks; applyAll(); save() }
  document.getElementById('a11y-stopanim').onclick = function() { state.stopAnimations = !state.stopAnimations; applyAll(); save() }
  document.getElementById('a11y-cursor').onclick = function() { state.bigCursor = !state.bigCursor; applyAll(); save() }
  document.getElementById('a11y-readable').onclick = function() { state.readableFont = !state.readableFont; applyAll(); save() }

  document.getElementById('a11y-reset').onclick = function() {
    state = { fontScale: 1, contrast: false, grayscale: false, underlineLinks: false, stopAnimations: false, bigCursor: false, readableFont: false }
    applyAll(); save()
  }

  btn.onclick = function() {
    panel.classList.toggle('open')
  }

  document.addEventListener('click', function(e) {
    if (!panel.contains(e.target) && e.target !== btn && panel.classList.contains('open')) {
      panel.classList.remove('open')
    }
  })

  applyAll()
})()
