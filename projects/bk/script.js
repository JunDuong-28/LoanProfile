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
