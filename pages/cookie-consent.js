/* ============================================================
   ניקוד★ – באנר אישור קוקיז (Cookie Consent)
   קובץ עצמאי. שימוש: <script src="cookie-consent.js"></script>
   זוכר את בחירת המשתמש ולא מציג שוב.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'nikud_cookie_consent';

  // אם כבר יש בחירה קודמת - לא מציגים שוב
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved === 'accepted' || saved === 'declined') {
    // אפשר להריץ כאן קוד טעינה של סקריפטים אנליטיים אם המשתמש אישר
    // if (saved === 'accepted') { /* load analytics here */ }
    return;
  }

  // ---------- עיצוב ----------
  var css = ''
    + '#nikudCookie{position:fixed;left:20px;bottom:20px;z-index:9999;max-width:380px;'
    + 'font-family:"Heebo",system-ui,-apple-system,sans-serif;direction:rtl;'
    + 'background:rgba(255,255,255,0.82);backdrop-filter:blur(22px) saturate(1.5);'
    + '-webkit-backdrop-filter:blur(22px) saturate(1.5);'
    + 'border:1px solid rgba(8,14,40,0.08);border-radius:22px;'
    + 'box-shadow:0 10px 28px rgba(8,14,40,0.09),0 34px 84px rgba(18,42,120,0.16),inset 0 1px 0 rgba(255,255,255,0.85);'
    + 'padding:20px 22px;transform:translateY(140%);opacity:0;'
    + 'transition:transform 0.55s cubic-bezier(0.22,1,0.36,1),opacity 0.45s;}'
    + '#nikudCookie.show{transform:translateY(0);opacity:1;}'
    + '#nikudCookie .ck-title{font-family:"Rubik",system-ui,sans-serif;font-weight:700;'
    + 'font-size:1.02rem;color:#080E28;margin:0 0 8px;display:flex;align-items:center;gap:8px;}'
    + '#nikudCookie .ck-text{font-size:0.85rem;line-height:1.6;color:#3E466A;margin:0 0 16px;}'
    + '#nikudCookie .ck-text a{color:#2E5BFF;text-decoration:underline;}'
    + '#nikudCookie .ck-btns{display:flex;gap:10px;}'
    + '#nikudCookie button{flex:1;cursor:pointer;font-family:"Rubik",system-ui,sans-serif;'
    + 'font-weight:600;font-size:0.9rem;padding:11px 16px;border-radius:999px;'
    + 'transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s,color 0.2s;}'
    + '#nikudCookie .ck-accept{border:none;color:#fff;'
    + 'background:linear-gradient(135deg,#2E5BFF,#1636BE);box-shadow:0 12px 30px rgba(46,91,255,0.30);}'
    + '#nikudCookie .ck-accept:hover{transform:translateY(-2px);box-shadow:0 18px 44px rgba(46,91,255,0.42);}'
    + '#nikudCookie .ck-decline{background:rgba(255,255,255,0.6);color:#3E466A;'
    + 'border:1px solid rgba(8,14,40,0.10);}'
    + '#nikudCookie .ck-decline:hover{border-color:rgba(46,91,255,0.4);color:#2E5BFF;transform:translateY(-2px);}'
    + '@media(max-width:520px){#nikudCookie{left:12px;right:12px;bottom:12px;max-width:none;}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- HTML ----------
  var box = document.createElement('div');
  box.id = 'nikudCookie';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'הודעת עוגיות');
  box.innerHTML =
      '<div class="ck-title">🍪 אנחנו משתמשים בעוגיות</div>'
    + '<p class="ck-text">האתר משתמש בעוגיות (cookies) כדי לשפר את חוויית הגלישה ולנתח שימוש. '
    + 'תוכל לאשר או לדחות. למידע נוסף ראה <a href="privacy.html">מדיניות הפרטיות</a>.</p>'
    + '<div class="ck-btns">'
    + '<button class="ck-accept" type="button">אשר</button>'
    + '<button class="ck-decline" type="button">דחה</button>'
    + '</div>';

  function mount() {
    document.body.appendChild(box);
    // הופעה עם דיליי קטן כדי שהאנימציה תרוץ
    setTimeout(function () { box.classList.add('show'); }, 600);
  }

  function save(choice) {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch (e) {}
  }

  function close() {
    box.classList.remove('show');
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 600);
  }

  box.querySelector('.ck-accept').addEventListener('click', function () {
    save('accepted');
    // אם יש לך אנליטיקס/פיקסל - זה המקום להפעיל אותו:
    // loadAnalytics();
    close();
  });

  box.querySelector('.ck-decline').addEventListener('click', function () {
    save('declined');
    close();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
