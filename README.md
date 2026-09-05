# Loan Nguyễn Portfolio — Home page

Plain HTML/CSS/JS recreation of the Figma "Home" frame.

## Files
- `index.html` — page markup
- `styles.css` — layout, colors, and type matching the Figma design
- `script.js` — boots the Spine WebGL player for the animated artwork
- `assets/json/ProfileWebJson/ProfileAvatar/` — put your exported Spine files here

## About the Spine artwork

The Figma component **"Spine Artwork 01"** contains a text node with the
value:

```
json/ProfileWebJson/ProfileAvatar
```

That's the local folder the design expects the exported Spine skeleton to
live in. In `index.html`, the container for it looks like this:

```html
<div id="spine-artwork-01"
     class="spine-artwork"
     data-spine-dir="json/ProfileWebJson/ProfileAvatar"
     data-spine-json="ProfileAvatar.json"
     data-spine-atlas="ProfileAvatar.atlas">
  <div class="spine-artwork__fallback">json/ProfileWebJson/ProfileAvatar</div>
</div>
```

`script.js` reads those `data-*` attributes, looks for
`assets/json/ProfileWebJson/ProfileAvatar/ProfileAvatar.json` (+ `.atlas` +
texture), and mounts a Spine WebGL player there once it finds them. Until
then, it just shows the directory label so the layout stays intact.

### To wire up the real animation
1. In the Spine editor, export the skeleton as **JSON** with an **atlas** +
   texture image.
2. Copy the exported files into:
   `assets/json/ProfileWebJson/ProfileAvatar/`
3. If your exported file isn't named `ProfileAvatar.json` /
   `ProfileAvatar.atlas`, update the `data-spine-json` / `data-spine-atlas`
   attributes on the container in `index.html` to match.
4. Open `index.html` in a browser (serving it over `http://` rather than
   `file://` avoids CORS issues with the atlas texture load).

## Opening the page
Just open `index.html` in a browser, or serve the folder with any static
file server, e.g.:

```
npx serve .
```
