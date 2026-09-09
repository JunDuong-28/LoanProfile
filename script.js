/**
 * Spine artwork loader
 * ---------------------
 * In the Figma file, the component named "Spine Artwork 01" contains a text
 * node whose content is the LOCAL DIRECTORY where the exported Spine assets
 * for that artwork live:
 *
 *      json/ProfileWebJson/ProfileAvatar
 *
 * This script reads that path straight off the container's data attributes
 * and tries to boot a Spine WebGL player pointed at it. If the exported
 * .json / .atlas / .png files aren't there yet, it just keeps showing the
 * fallback label so the layout still looks right.
 *
 * To make this work on your machine:
 *   1. Export your Spine skeleton (Spine editor -> Export -> JSON + atlas + texture).
 *   2. Drop the exported files into: ./assets/json/ProfileWebJson/ProfileAvatar/
 *      so you end up with, e.g.:
 *        assets/json/ProfileWebJson/ProfileAvatar/ProfileAvatar.json
 *        assets/json/ProfileWebJson/ProfileAvatar/ProfileAvatar.atlas
 *        assets/json/ProfileWebJson/ProfileAvatar/ProfileAvatar.png
 *   3. Reload the page — the fallback label will be replaced by the animation.
 *
 * If your exported file names differ from "ProfileAvatar", just edit the
 * data-spine-json / data-spine-atlas attributes on the container in index.html.
 *
 * FORCING A FIXED SIZE
 * ---------------------
 * By default the container's size comes from styles.css (currently locked
 * to the hero image's aspect ratio via `aspect-ratio`). To force the
 * animation into an exact box instead, add width/height data attributes to
 * the container in index.html:
 *
 *   <div class="spine-artwork"
 *        data-spine-dir="json/ProfileWebJson/ProfileAvatar"
 *        data-spine-json="ProfileAvatar.json"
 *        data-spine-atlas="ProfileAvatar.atlas"
 *        data-spine-width="400"
 *        data-spine-height="400">
 *
 * Accepts a bare number (treated as px) or any CSS length ("50%", "20rem",
 * "400px"). The player then auto-fits the skeleton's bounds inside that
 * exact box each frame — it scales uniformly and letterboxes whichever axis
 * doesn't match, so the artwork is never stretched/distorted. If you
 * instead want it to fill the box edge-to-edge even if that means cropping
 * or slightly distorting, set data-spine-fit="cover" (default is "contain").
 */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.spine-artwork').forEach(initSpineArtwork);

  const overlay = document.getElementById("popupOverlay");
  const projectFrame = document.getElementById("projFrame");
  const closeBtn = document.getElementById("closePopup");

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

  projects.forEach(project => {
    const projLink = document.getElementById(project);
    const projLogo = document.getElementById("logo" + project);
    
    projLink.addEventListener('click', (event) => {
      event.preventDefault();
      projectFrame.src = "/LoanProfile/projects/"+ project + ".html";
      openModal();
    });

    projLogo.addEventListener('click', (event) => {
      event.preventDefault();
      projectFrame.src = "/LoanProfile/projects/"+ project + ".html";
      openModal();
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
});

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
