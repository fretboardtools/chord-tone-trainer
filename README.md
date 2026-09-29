# Chord Tone Trainer

Free unlocktheguitar.net tool. Pick a progression, key and five-fret area of the neck; the chord tones show on the fretboard in time with a backing that plays the changes.

Plain HTML, CSS and JavaScript, built with Vite. No framework, no runtime dependencies. All audio is synthesised in the browser with the Web Audio API, so there are no sample files.

## Run locally

```
npm install
npm run dev
```

## Deploy on Vercel

Import the repo in Vercel. It detects Vite automatically: build command `npm run build`, output directory `dist`.

## Embed on the site

Paste into a Custom HTML block. Change the `src` to the Vercel URL.

```html
<iframe id="utg-ctt" src="https://chord-tone-trainer.vercel.app/?embed=1" title="Chord Tone Trainer" loading="lazy" allow="autoplay" style="width:100%;height:900px;border:0;display:block"></iframe>
<script>
window.addEventListener('message',function(e){
  if(e.data && e.data.type==='utg-tool-height' && e.data.id==='chord-tone-trainer'){
    document.getElementById('utg-ctt').style.height = e.data.height + 'px';
  }
});
</script>
```

When the tool is inside an iframe (or opened with `?embed=1`) it hides its own title and the three how-to cards, since the page supplies those, and it reports its height so the iframe resizes to fit.

Theme: embedded, it defaults to light. Add `&theme=dark` to the `src` for dark. Opened directly, it follows the visitor's system setting.

## Where things live

- `src/main.js`: progressions (`PROGS`), chord qualities, fretboard drawing, audio voices, playback timing.
- `src/style.css`: colour tokens at the top, light and dark.
- To add a progression, add an entry to `PROGS`: `[roman numeral, semitones above the key, chord quality, beats]`. Totals must come to whole bars of 4/4.

Settings (progression, key, tempo, sound and so on) are remembered in the visitor's browser.
