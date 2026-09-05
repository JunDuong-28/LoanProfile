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
 */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.spine-artwork').forEach(initSpineArtwork);
});

function initSpineArtwork(container) {
  const baseDir = container.dataset.spineDir;      // e.g. "json/ProfileWebJson/ProfileAvatar"
  const jsonFile = container.dataset.spineJson;     // e.g. "ProfileAvatar.json"
  const atlasFile = container.dataset.spineAtlas;   // e.g. "ProfileAvatar.atlas"

  if (!baseDir || !jsonFile || !atlasFile) return;

  const assetBase = `${baseDir}/`; // local folder, resolved relative to index.html

  if (typeof spine === 'undefined' || !spine.SpinePlayer) {
    // Spine runtime script hasn't loaded (e.g. offline) — keep the fallback label.
    console.warn('Spine runtime not available, showing directory label instead.');
    return;
  }

  // Quick existence check before handing off to the player, so we don't spam
  // errors in the console when the assets haven't been added yet.
  fetch(assetBase + jsonFile, { method: 'HEAD' })
    .then((res) => {
      if (!res.ok) throw new Error('not found');

      // Clear the fallback label and mount the player.
      container.innerHTML = '';

      new spine.SpinePlayer(container, {
        jsonUrl: assetBase + jsonFile,
        atlasUrl: assetBase + atlasFile,
        alpha: true,
        showControls: false,
        backgroundColor: '#00000000',
        premultipliedAlpha: false,
        // Add viewport setting:
        viewport: {
          x: -841.19,
          y: -697.97,
          width: 1842.85,
          height: 1547.69
        },
        success: (player) => {
          const skeleton = player.skeleton;
          if (skeleton && skeleton.data.animations.length) {
            player.setAnimation(skeleton.data.animations[0].name, true);
          }
        },
        error: (player, msg) => {
          console.error('Spine player failed to load:', msg);
        },
      });
    })
    .catch(() => {
      // Assets not present yet — leave the directory label visible so it's
      // obvious where to drop the exported Spine files.
    });
}
