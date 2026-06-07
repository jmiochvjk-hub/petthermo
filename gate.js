/* PetThermo 访问密码门（纯静态「软门禁」）
   —— 两页共用同一密码；输对后记到 localStorage，跨页跳转不再重复输。
   —— 注意：纯前端校验，懂技术的人查看源码可绕过，仅用于展示场景挡住随便点进来的人。
   —— 要改密码：改下面这一行 PASS 即可（改后已解锁的人需重新输入）。 */
(function () {
  var PASS  = 'petthermo';            // ← 访问密码（要改就改这里）
  var KEY   = 'petthermo-auth';       // localStorage 键
  var TOKEN = 'v1:' + PASS;           // 解锁标记（绑定密码：改密码后旧标记自动失效）

  function unlocked() {
    try { return localStorage.getItem(KEY) === TOKEN; } catch (e) { return false; }
  }
  if (unlocked()) return;             // 已解锁：什么都不做，正常显示页面

  /* 1) 同步加锁：给 <html> 加类 + 注入样式，先把内容藏住，避免闪现 */
  document.documentElement.classList.add('pt-locked');
  var style = document.createElement('style');
  style.textContent =
    'html.pt-locked,html.pt-locked body{background:#0E1A2B!important;overflow:hidden!important;height:100%}' +
    'html.pt-locked body>*:not(#ptGate){display:none!important}' +
    '#ptGate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;' +
      'background:radial-gradient(80% 60% at 50% 0%,#15263d,#0E1A2B 70%);' +
      'font-family:"Sora",-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",system-ui,sans-serif}' +
    '#ptGate .pt-card{width:100%;max-width:360px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);' +
      'border-radius:24px;padding:34px 26px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);' +
      'box-shadow:0 30px 80px -30px rgba(0,0,0,.7);text-align:center;color:#fff}' +
    '#ptGate .pt-lock{width:60px;height:60px;border-radius:50%;margin:0 auto 18px;display:grid;place-items:center;' +
      'background:linear-gradient(135deg,#FF6B35,#FF9E4D);box-shadow:0 12px 30px -10px rgba(255,107,53,.6)}' +
    '#ptGate h2{font-size:20px;font-weight:700;margin:0 0 6px;letter-spacing:-.01em}' +
    '#ptGate p{font-size:13px;line-height:1.5;opacity:.7;margin:0 0 20px}' +
    '#ptGate input{width:100%;height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.18);box-sizing:border-box;' +
      'background:rgba(255,255,255,.08);color:#fff;font-size:16px;text-align:center;letter-spacing:.08em;outline:none;' +
      'transition:border-color .2s;font-family:inherit}' +
    '#ptGate input:focus{border-color:#FF9E4D}' +
    '#ptGate input::placeholder{color:rgba(255,255,255,.4);letter-spacing:0}' +
    '#ptGate button{width:100%;height:48px;margin-top:14px;border-radius:14px;border:none;cursor:pointer;' +
      'background:linear-gradient(135deg,#FF6B35,#FF9E4D);color:#fff;font-size:16px;font-weight:700;font-family:inherit}' +
    '#ptGate button:active{transform:translateY(1px)}' +
    '#ptGate .pt-err{min-height:18px;margin-top:12px;font-size:12.5px;color:#FF9E8A;opacity:0;transition:opacity .2s}' +
    '#ptGate .pt-err.show{opacity:1}' +
    '@keyframes ptShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}' +
      '30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}' +
    '#ptGate .pt-card.shake{animation:ptShake .5s}';
  (document.head || document.documentElement).appendChild(style);

  /* 2) 文案：跟随上次选择的语言（中/韩），自带文案不依赖 i18n 字典。
        优先读 localStorage（持久真值）；PTI18N.lang 在 head 阶段可能还是默认值，不能先信它。 */
  function lang() {
    try {
      var v = localStorage.getItem('petthermo-lang');
      if (v) return v;
      if (window.PTI18N && PTI18N.lang) return PTI18N.lang;
    } catch (e) {}
    return 'zh';
  }
  function texts() {
    return lang() === 'ko'
      ? { h: '액세스 인증', p: 'PetThermo를 보려면 비밀번호를 입력하세요', ph: '비밀번호', btn: '입장', err: '비밀번호가 올바르지 않습니다. 다시 시도해 주세요' }
      : { h: '访问验证', p: '请输入密码以查看 PetThermo', ph: '访问密码', btn: '进入', err: '密码不正确，请重试' };
  }

  /* 3) DOM 就绪后挂载浮层（此时再取语言，localStorage 已是最新） */
  function mount() {
    if (document.getElementById('ptGate')) return;
    var TXT = texts();
    var g = document.createElement('div');
    g.id = 'ptGate';
    g.setAttribute('role', 'dialog');
    g.setAttribute('aria-modal', 'true');
    g.innerHTML =
      '<div class="pt-card" id="ptCard">' +
        '<div class="pt-lock"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>' +
        '<h2>' + TXT.h + '</h2>' +
        '<p>' + TXT.p + '</p>' +
        '<input id="ptInput" type="password" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + TXT.ph + '" aria-label="' + TXT.ph + '"/>' +
        '<button id="ptBtn" type="button">' + TXT.btn + '</button>' +
        '<div class="pt-err" id="ptErr">' + TXT.err + '</div>' +
      '</div>';
    document.body.appendChild(g);

    var input = g.querySelector('#ptInput'),
        btn   = g.querySelector('#ptBtn'),
        err   = g.querySelector('#ptErr'),
        card  = g.querySelector('#ptCard');

    function fail() {
      err.classList.add('show');
      card.classList.remove('shake');
      void card.offsetWidth;          // 重启动画
      card.classList.add('shake');
      input.value = '';
      input.focus();
    }
    function submit() {
      if (input.value === PASS) {
        try { localStorage.setItem(KEY, TOKEN); } catch (e) {}
        document.documentElement.classList.remove('pt-locked');
        g.remove();
        style.remove();
      } else {
        fail();
      }
    }
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    input.addEventListener('input', function () { err.classList.remove('show'); });
    setTimeout(function () { input.focus(); }, 60);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
