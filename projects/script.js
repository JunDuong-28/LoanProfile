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
  let width = container.getBoundingClientRect().width;
  let height = container.getBoundingClientRect().height;
  console.log ("Original: " + width + " x " + height);
  console.log ("Forced: " + forcedWidth + " x " + forcedHeight);

  if (forcedWidth) {
    container.style.width = /^\d+$/.test(forcedWidth) ? `${forcedWidth}px` : forcedWidth;
    //container.style.aspectRatio = 'auto';
  }
  if (forcedHeight) {
    container.style.height = /^\d+$/.test(forcedHeight) ? `${forcedHeight}px` : forcedHeight;
    //container.style.aspectRatio = 'auto';
  }
  
  width = container.getBoundingClientRect().width;
  height = container.getBoundingClientRect().height;
  console.log ("Result: " + width + " x " + height);

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

      if (!animations.length) {
        console.warn('Spine JSON loaded but contains no animations:', jsonFile);
        return;
      }

      const targetAnim = parseInt(container.dataset.spineAnim, 10) || 0;
      const firstAnimation = animations[targetAnim];
      
      const firstSkin = skins.length ? skins[0] : 'default';

      console.info(`Spine skeleton "${jsonFile}" — animations found:`, animations, '— using skin:', firstSkin);

      // By default, leave viewport sizing to the player: SpinePlayer.calculateAnimationViewport()
      // samples the whole animation across 100 timesteps and unions every bone's bounding box,
      // so it auto-zooms to keep the entire moving rig in frame. That's the correct, desired
      // behavior for most looping UI animations (a spinning wheel, a bouncing icon, a coin
      // that scales up) — the framing tracks the motion.
      //
      // A few skeletons (e.g. "Me fabulous") have some out-of-frame motion in their timeline
      // (often something that grows large while fully transparent, then pops back to normal
      // size the instant it becomes visible — a common "invisible flourish" authoring trick)
      // that inflates the auto-computed viewport into something much bigger than the actual
      // "card", making the artwork render tiny inside its container. For those specific cases,
      // opt in per-instance with data-spine-viewport="setup" on the container: this uses the
      // skeleton's real setup-pose bounding box instead of the dynamic per-animation bounds.
      // Do NOT enable this by default — it clips animations whose motion legitimately extends
      // beyond the setup pose (e.g. starter-pack's 240° rotation, wheel's spin), cutting them
      // off instead of framing them.
      //
      // IMPORTANT: we do NOT trust skeletonData.skeleton.x/y/width/height from the JSON header
      // for this. That field can be stale — several of these skeletons were exported from a
      // shared multi-asset Spine project, and their header position is leftover from that
      // project's shared canvas (e.g. x around -1700 to -2600) while every actual bone in the
      // file sits near local (0,0). Using it verbatim points the camera at empty space far from
      // the real content, making the artwork disappear entirely rather than just render small.
      // Instead, once the player has loaded the skeleton, we compute the setup-pose bounding
      // box ourselves from the live bone transforms (always correct) and re-apply it.
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

          if (!useSetupPoseBounds) return;

          const skeleton = player.skeleton;
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
