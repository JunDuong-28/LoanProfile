/**
 * Spine artwork loader
 * ---------------------
 * */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.spine-artwork').forEach(initSpineArtwork);
});




function initSpineArtwork(container) {

  const baseDir = container.dataset.spineDir;
  const jsonFile = container.dataset.spineJson;
  const atlasFile = container.dataset.spineAtlas;
  const fitMode = container.dataset.spineFit || 'contain';
  
  const forcedWidth = container.parentElement.getBoundingClientRect().width;
  const forcedHeight = container.parentElement.getBoundingClientRect().height;

  if (forcedWidth) {
    container.style.width = /^\d+$/.test(forcedWidth) ? `${forcedWidth}px` : forcedWidth;
  }
  if (forcedHeight) {
    container.style.height = /^\d+$/.test(forcedHeight) ? `${forcedHeight}px` : forcedHeight;
  }
  

  if (!baseDir || !jsonFile || !atlasFile) return;

  const assetBase = `../${baseDir}/`;
  console.log (assetBase + jsonFile);

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

      console.log (skins);

      if (!animations.length) {
        console.warn('Spine JSON loaded but contains no animations:', jsonFile);
        return;
      }

      const targetAnim = parseInt(container.dataset.spineAnim, 10) || 0;
      const firstAnimation = animations[targetAnim];

      // Skin selection mirrors animation selection: data-spine-skin can be a
      // numeric index into the skins array (like data-spine-anim), the skin's
      // actual name (e.g. "Skin1"), or a COMMA-SEPARATED LIST of either to merge
      // multiple skins together (e.g. "default,Skin1" or "0,1"). Some skeletons
      // (e.g. one where decoration lives in "default" but the actual characters
      // and other set pieces only exist in "Skin1"/"Skin2") split their content
      // across skins rather than putting everything in one — a single skin name
      // alone silently omits any slot whose only attachment lives in a different
      // skin, no error, just an incomplete render. Listing more than one entry
      // here builds a combined skin from all of them instead of picking just one.
      function resolveSkinEntry(entry) {
        const trimmed = entry.trim();
        if (!trimmed) return null;
        if (/^\d+$/.test(trimmed)) {
          const idx = parseInt(trimmed, 10);
          const name = skins[idx];
          if (!name) {
            console.warn(`Spine skeleton "${jsonFile}" — data-spine-skin index ${idx} out of range (available skins: ${skins.join(', ')}).`);
          }
          return name || null;
        }
        if (skins.includes(trimmed)) return trimmed;
        console.warn(`Spine skeleton "${jsonFile}" — data-spine-skin "${trimmed}" not found (available skins: ${skins.join(', ')}).`);
        return null;
      }

      const skinAttr = container.dataset.spineSkin;
      let skinsToUse = [];
      if (skinAttr !== undefined && skinAttr !== '') {
        skinsToUse = skinAttr.split(',').map(resolveSkinEntry).filter(Boolean);
      }
      if (!skinsToUse.length) {
        skinsToUse = skins.length ? [skins[0]] : ['default'];
      }
      // Player construction needs one starting skin name; if we're merging,
      // the success callback below replaces it with the combined skin right
      // after mount, so this initial pick just needs to be valid, not final.
      const firstSkin = skinsToUse[0];
      const skinsToMerge = skinsToUse;

      console.info(`Spine skeleton "${jsonFile}" — animations found:`, animations, '— skins found:', skins, skinsToMerge.length > 1 ? `— merging skins: ${skinsToMerge}` : `— using skin: ${firstSkin}`);
      
      const useSetupPoseBounds = container.dataset.spineViewport === 'setup';

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

          const skeleton = player.skeleton;

          // Build and apply the combined skin when more than one was requested.
          if (skeleton && skinsToMerge.length > 1 && typeof spine.Skin === 'function') {
            const skeletonData = skeleton.data;
            const combined = new spine.Skin('combined-' + jsonFile);
            skinsToMerge.forEach((skinName) => {
              const skinObj = skeletonData.findSkin(skinName);
              if (skinObj) {
                combined.addSkin(skinObj);
              } else {
                console.warn(`Spine skeleton "${jsonFile}" — skin "${skinName}" not found at apply time, skipping.`);
              }
            });
            skeleton.setSkin(combined);
            skeleton.setSlotsToSetupPose();

            // CRITICAL: the player already computed its camera viewport BEFORE
            // this callback ran, using only the first skin (skinsToMerge[0]). If
            // that starting skin doesn't contain the full artwork, the camera
            // locks onto that smaller bounding box, and merging in the rest of
            // the content afterwards doesn't grow the frame — anything outside
            // the original small box gets cropped, especially with fit="cover"
            // (0% padding = hard crop). So we recompute bounds ourselves AFTER
            // merging, sampling across the whole animation duration (not just
            // the setup pose, since elements may move) — the same technique
            // SpinePlayer uses internally to auto-size its viewport.
            const animationObj = skeletonData.findAnimation(firstAnimation);
            if (animationObj && typeof skeleton.getBounds === 'function') {
              const duration = animationObj.duration || 0;
              const steps = 50;
              const offset = new spine.Vector2();
              const size = new spine.Vector2();
              const temp = [];
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              for (let i = 0; i <= steps; i++) {
                const t = duration * (i / steps);
                skeleton.setToSetupPose();
                animationObj.apply(skeleton, 0, t, false, null, 1, spine.MixBlend.setup, spine.MixDirection.in);
                skeleton.updateWorldTransform();
                skeleton.getBounds(offset, size, temp);
                if (size.x > 0 && size.y > 0 && !isNaN(offset.x) && !isNaN(offset.y)) {
                  minX = Math.min(minX, offset.x);
                  minY = Math.min(minY, offset.y);
                  maxX = Math.max(maxX, offset.x + size.x);
                  maxY = Math.max(maxY, offset.y + size.y);
                }
              }
              if (isFinite(minX) && isFinite(minY) && maxX > minX && maxY > minY) {
                player.config.viewport.x = minX;
                player.config.viewport.y = minY;
                player.config.viewport.width = maxX - minX;
                player.config.viewport.height = maxY - minY;
                console.info(`Spine skeleton "${jsonFile}" — recomputed post-merge viewport:`, {
                  x: minX, y: minY, width: maxX - minX, height: maxY - minY,
                });
              } else {
                console.warn(`Spine skeleton "${jsonFile}" — post-merge viewport recompute produced invalid bounds; leaving viewport as-is.`);
              }
            }

            // Re-apply the current animation so track state (and any viewport
            // override we just set) picks up the newly filled-in slot
            // attachments right away rather than on next loop.
            player.setAnimation(firstAnimation, true);
            console.info(`Spine skeleton "${jsonFile}" — applied combined skin from:`, skinsToMerge);
          }

          if (!useSetupPoseBounds) return;

          if (!skeleton || typeof skeleton.getBounds !== 'function') {
            console.warn(`Spine skeleton "${jsonFile}" — data-spine-viewport="setup" requested but player.skeleton is unavailable; leaving the auto-calculated viewport in place.`);
            return;
          }

          // Compute the ACTUAL setup-pose bounding box from live bone transforms —
          // never from the (possibly stale) JSON header.
          skeleton.setToSetupPose();
          skeleton.updateWorldTransform();
          const offset = new spine.Vector2();
          const size = new spine.Vector2();
          skeleton.getBounds(offset, size);

          if (isNaN(offset.x) || isNaN(offset.y) || isNaN(size.x) || isNaN(size.y) || size.x <= 0 || size.y <= 0) {
            console.warn(`Spine skeleton "${jsonFile}" — computed setup-pose bounds are invalid; leaving the auto-calculated viewport in place.`);
            return;
          }

          console.info(`Spine skeleton "${jsonFile}" — computed real setup-pose bounds:`, {
            x: offset.x, y: offset.y, width: size.x, height: size.y,
          });

          player.config.viewport.x = offset.x;
          player.config.viewport.y = offset.y;
          player.config.viewport.width = size.x;
          player.config.viewport.height = size.y;
          // Re-apply the current animation so setAnimation() picks up the viewport override
          // we just set on player.config.viewport (it checks these fields every call).
          player.setAnimation(firstAnimation, true);
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