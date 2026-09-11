let mobile = false;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.spine-artwork').forEach(initSpineArtwork);
  
  const firstLoadSize = document.querySelector("body").getBoundingClientRect().width;
  console.log(firstLoadSize);
  if (firstLoadSize <= 800) {
    mobile=true;
    createPopupLink();
  } else {
    mobile=false;
    createPopupLink();
  }
});

function createPopupLink () {
  const overlay = document.getElementById("popupOverlay");
  const projectFrame = document.getElementById("projFrame");
  const closeBtn = document.getElementById("closePopup");
  const notice = document.getElementById("projNotice");
  const playbtn = document.getElementById("redirectbtn");
  const playlink = playbtn.querySelector("a");

  const projects = [
    "bantrung",
    "lichviet",
    "noithu",
    "banbong",
    "kyvuong",
    "thachdau",
    "jumpingirl",
    "bongso",
    "baskethit"
  ];

  const links = {
    "bantrung": "https://www.facebook.com/gaming/play/2492644277420233?source=fb_gg_url&ext=1788704903&hash=AedmK95W_r2twmeqZxLbVROJYPE",
    "lichviet": "https://play.google.com/store/apps/details?id=com.ctv.vn.lichviet&hl=vi",
    "noithu": "https://www.facebook.com/gaming/play/220801932630391/?source=fb_gg_url&ext=1788704584&hash=AeegcFLN1a9woRkuHuJ0DK2nAck",
    "banbong": "https://www.facebook.com/gaming/play/227788504726017/?source=fb_gg_url&ext=1788704710&hash=AedGSVpGDSBJ7QhJzlLUunkrrPc",
    "kyvuong": "",
    "thachdau": "",
    "jumpingirl": "https://www.facebook.com/gaming/play/347909499499999/?source=www_games_hub_recently_played",
    "bongso": "https://www.facebook.com/gaming/play/134374228549110?source=fb_gg_url&ext=1788704944&hash=Aec4BRE-TvFBY44ctxcVoaV21P8",
    "baskethit": "https://www.facebook.com/gaming/play/1224362211248752?source=fb_gg_url&ext=1788704979&hash=Aec99lnakuhm0HdTaDeOJ0rMmJg"
  };

  projects.forEach(project => {
    const projLink = document.getElementById(project);
    const projLogo = document.getElementById("logo" + project);
    
    projLink.addEventListener('click', (event) => {
      if (!mobile) {
        event.preventDefault();
        projectFrame.src = "/LoanProfile/projects/"+ project + ".html?t=" + Date.now();
        closeNotice();
        openModal();
      } else {
        projectFrame.src = "";
        if (links[project]) {
          playbtn.classList.remove("hidden");
          playlink.href=links[project];
        } else {
          playbtn.classList.add("hidden");
        }
        openNotice();
        openModal();
      }
    });

    projLogo.addEventListener('click', (event) => {
      if (!mobile) {
        event.preventDefault();
        projectFrame.src = "/LoanProfile/projects/"+ project + ".html?t=" + Date.now();
        closeNotice();
        openModal();
      } else {
        projectFrame.src = "";
        if (links[project]) {
          playbtn.classList.remove("hidden");
          playlink.href=links[project];
        } else {
          playbtn.classList.add("hidden");
        }
        openNotice();
        openModal();
      }
    });
  });

  function openModal() {
    overlay.classList.remove("hidden");
    document.body.classList.add("modal-open"); // Locks base page scroll
  }

  function closeModal() {
    overlay.classList.add("hidden");
    document.body.classList.remove("modal-open"); // Restores base page scroll
    projectFrame.src = ""; // Unloads iframe
  }

  function openNotice() {
    notice.classList.remove("hidden");
    /*projectFrame.classList.add("hidden");*/
  }

  function closeNotice() {
    notice.classList.add("hidden");
    /*projectFrame.classList.add("hidden");*/
  }

  closeBtn.addEventListener('click', closeModal);

  // Close if clicking outside the modal box
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === "Escape" && !overlay.classList.contains("hidden")) {
      closeModal();
    }
  });
}

function initSpineArtwork(container) {

  const baseDir = container.dataset.spineDir;
  const jsonFile = container.dataset.spineJson;
  const atlasFile = container.dataset.spineAtlas;
  const forcedWidth = container.parentElement.getBoundingClientRect().width;
  const forcedHeight = container.parentElement.getBoundingClientRect().height*1.45;

  const fitMode = container.dataset.spineFit || 'contain';

  if (!baseDir || !jsonFile || !atlasFile) return;

  if (forcedWidth) {
    container.style.width = /^\d+$/.test(forcedWidth) ? `${forcedWidth}px` : forcedWidth;
    container.style.aspectRatio = 'auto';
    console.log (container.style.width);
  }
  if (forcedHeight) {
    container.style.height = /^\d+$/.test(forcedHeight) ? `${forcedHeight}px` : forcedHeight;
    container.style.aspectRatio = 'auto';
  }

  const assetBase = `${baseDir}/`;

  if (typeof spine === 'undefined' || !spine.SpinePlayer) {
    console.warn('Spine runtime not available, showing directory label instead.');
    return;
  }

  fetch(assetBase + jsonFile)
    .then((res) => {
      if (!res.ok) throw new Error('not found');
      return res.json();
    })
    .then((skeletonData) => {
      const animations = skeletonData.animations ? Object.keys(skeletonData.animations) : [];
      const skins = skeletonData.skins
        ? skeletonData.skins.map((s) => (typeof s === 'string' ? s : s.name))
        : [];

      if (!animations.length) {
        console.warn('Spine JSON loaded but contains no animations:', jsonFile);
        return;
      }

      const firstAnimation = animations[0];
      const firstSkin = skins.length ? skins[0] : 'default';

      console.info(`Spine skeleton "${jsonFile}" — animations found:`, animations, '— using skin:', firstSkin);

      container.innerHTML = '';

      new spine.SpinePlayer(container, {
        jsonUrl: assetBase + jsonFile,
        atlasUrl: assetBase + atlasFile,
        alpha: true,
        showControls: false,
        backgroundColor: '#00000000',
        premultipliedAlpha: true,
        skin: firstSkin,
        animation: firstAnimation,
        loop: true,
        
        viewport: fitMode === 'cover'
          ? { padLeft: '0%', padRight: '0%', padTop: '0%', padBottom: '0%' }
          : { padLeft: '5%', padRight: '5%', padTop: '5%', padBottom: '5%' },
        success: (player) => {
          console.info('Spine player mounted successfully.');
        },
        error: (player, msg) => {
          console.error('Spine player failed to load:', msg);
          
          container.innerHTML = `<div class="spine-artwork__fallback">${baseDir}</div>`;
        },
      });
    })
    .catch(() => {
      
    });
}


(function () {
  const toggle = document.getElementById('menuToggle');
  const dropmenu = document.getElementById('dropmenu');
  if (!toggle || !dropmenu) return;

  function closeMenu() {
    dropmenu.classList.remove('is-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    const isOpen = dropmenu.classList.toggle('is-open');
    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // close after tapping a link
  dropmenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // close on outside tap
  document.addEventListener('click', (e) => {
    if (!dropmenu.contains(e.target) && e.target !== toggle) {
      closeMenu();
    }
  });

  // close if resized back to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMenu();
  });

  /* -------------------------------------------------------
  --------------- Switch languages -------------------------
  --------------------------------------------------------*/

  const DICT_URL = 'translations.json';
 
  let dict = null;
 
  // Pulls the dictionary once per page load.
  async function loadDictionary() {
    const res = await fetch(DICT_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load ' + DICT_URL);
    return res.json();
  }
 
  // Applies a language to every element carrying data-i18n.
  function applyLanguage(lang) {
    if (!dict || !dict[lang]) return;
 
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const value = dict[lang][key];
      if (value === undefined) return; // key not translated, leave as-is
 
      if (el.dataset.i18nHtml === 'true') {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });
 
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
 
    // Sync the flag buttons' active state.
    document.querySelectorAll('.flag-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });
  }
 
  async function initLanguageSwitcher() {
    try {
      dict = await loadDictionary();
    } catch (err) {
      console.error('i18n: could not load translations', err);
      return;
    }
 
    const saved = localStorage.getItem('lang');
    const initialLang = saved || document.documentElement.lang || 'vi';
    applyLanguage(initialLang);
 
    document.querySelectorAll('.flag-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyLanguage(btn.dataset.lang);
      });
    });
  }
 
  document.addEventListener('DOMContentLoaded', initLanguageSwitcher);

  const mediaQuery = window.matchMedia('(max-width: 800px)');

  function handleScreenChange(e) {
    if (e.matches) {
      console.log("Viewport dropped under 800px");
      mobile = true;
      createPopupLink();
    } else {
      console.log("Viewport is wider than 800px");
      mobile = false;
      createPopupLink();
    }
  }

  mediaQuery.addEventListener('change', handleScreenChange);

  //handleScreenChange(mediaQuery);
})();