// Enable Two.js for ESLint and JSDoc (for VSCode)
/* global Two, dat */
/// <reference path="node_modules/two.js/two.extern.js" />

/*
  Constants
*/

const EXPORT_SIZE = 1600;
const MARGIN = 100;
const ASPECT_RATIOS = {
  '16:9': 1.7777777778,
  '4:3': 1.3333333333,
  '1:1': 1,
  '3:4': 0.75,
  '9:16': 0.5625,
};

/*
  DOM elements
*/

const $container = document.getElementById('root');
const $controls = document.getElementById('controls');

/*
  Helper functions
*/

const rand = (min, max) => {
  return Math.random() * (max - min) + min;
};

const randi = (min, max) => Math.floor(rand(min, max));

const randColor = (hue) => {
  return `rgb(${randi(0,255)},${randi(0,255)},${randi(0,255)})`;
};

const download = (filename, text) => {
  const temp = document.createElement('a');
  temp.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  temp.setAttribute('download', filename);

  temp.style.display = 'none';
  document.body.appendChild(temp);

  temp.click();

  document.body.removeChild(temp);
};

const setBackground = (color) => {
  $container.style.backgroundColor = color;
};

const hslToHex = (_, _h, _s, _l) => {
  const h = parseInt(_h) / 360,
        s = parseInt(_s) / 100,
        l = parseInt(_l) / 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHsl = (hex) => {
  const match = hex.match(/#(.{2})(.{2})(.{2})/);

  const r = parseInt(match[1], 16) / 255;
  const g = parseInt(match[2], 16) / 255;
  const b = parseInt(match[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min){
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `hsl(${h},${s}%,${l}%)`;
};

/*
  Config object: contains all config default values
*/

const config = {
  lineCount: 20,
  color: '#000000',
  iterations: 100,
  lineWidth: 1,
  background: '#000000',
  sibWeight: 0.02,
  lineChange: 5,
  aspectRatio: 1,
  slopeWeight: 0.01,
  randomStart: false,
  'Redraw': () => init(),
  'Export Svg File': () => {
    const innerSvg = document.querySelector('#root > svg').innerHTML
    .replace(/hsl\((\d+),(\d+)%,(\d+)%\)/g, hslToHex);
    const svgText = `\
<svg width="${EXPORT_SIZE * config.aspectRatio}" height="${EXPORT_SIZE}" \
viewBox="0 0 ${two.width} ${two.height}" xmlns="http://www.w3.org/2000/svg" version="1.1">
<desc id="json-config">${JSON.stringify(config)}"</desc>
<rect width="100%" height="100%" fill="${config.background}"/>
${innerSvg}
</svg>`;

    download('art.svg', svgText);
  },
};

// Temporary config object that doesn't change while art is animating
let _config;

/*
  Setup two.js
*/

const two = new Two().appendTo($container);

const resize = () => {
  const scale = Math.min($container.offsetWidth / config.aspectRatio, $container.offsetHeight);
  
  two.width = config.aspectRatio * scale;
  two.height = scale;
  two.renderer.setSize(two.width, two.height);
};

// Resize when window resizes and when DOM fully loads
window.onresize = resize;
if (document.readyState !== 'complete') window.onload = resize;

/*
  Render shapes
*/

const shapes = two.makeGroup();
shapes.translation.set(MARGIN, MARGIN);

let iter;

const middleAnchor = (a, a1, a2) => {
  // if (!a) a = new Two.Anchor(0, 0);
  a.x = (a2.x + a1.x) * 0.5;
  a.y = (a2.y + a1.y) * 0.5;
  // a.x *= x * 0.1;
  // a.y *= y * 0.1;
  return a;
};

const makeChild = (parent) => {
  const child = parent.clone();
  const vs = child.vertices;
  const i = randi(0, vs.length); // random index
  const s = Math.random() < 0.5;
  middleAnchor(vs[i], s ? vs[i] : (i === 0 ? vs[vs.length - 1] : vs[i - 1]), s ? (i === vs.length - 1 ? vs[0] : vs[i + 1]) : vs[i]);
  return child;
};

const init = () => {
  // Reset background

  const { lineCount, randomStart } = config;
  const width = two.width - 2 * MARGIN;
  const height = two.height - 2 * MARGIN;
  // const deltaY = height / lineCount;

  // Reset lines
  shapes.remove(shapes.children);
  // for (let i = 0; i < lineCount; i++) { // Add lines to group
  //   const shape = two.makePath(rand(0, height), rand(0, height), rand(0, height), rand(0, height), rand(0, height), rand(0, height), false)
  //   .addTo(shapes);
    
  //   shape.fill = randColor();
  // }
  const parent = two.makePath(0, 0, width, 0, width, height, 0, height, true)
  .addTo(shapes);
  parent.fill = hexToHsl(config.color);

  // shapes.fill = config.color;
  // shapes.noStroke(); 
  shapes.stroke = 'none';
  shapes.cap = 'none';
  // shapes.strokeWeight = config.lineWidth;

  // Create a static copy of config
  _config = Object.assign({}, config);

  iter = 0;
  two.play();
};

const hsl = /hsl\((\d+),(\d+)%,(\d+)%\)/;
const lessColor = (color) => {
  const m = color.match(hsl);
  if (!m) {
    console.log('bad:', color);
    return color;
  }

  const sub = (val, amount, l) => {
    val -= amount;
    if (l) return Math.max(0, val);
    return val < 0 ? val + 360 : val;
  };

  const h = sub(parseInt(m[1]), 2),
        s = parseInt(m[2]),
        l = sub(parseInt(m[3]), randi(1, 3), true);

  return `hsl(${h},${s}%,${l}%)`;
};

const moveLines = () => {
  
  const last = shapes.children[shapes.children.length - 1];
  const child = makeChild(last)
  .addTo(shapes);

  child.fill = lessColor(last.fill);
};

two.bind('update', (frameCount) => {
  // Run a certain number of iterations
  if (iter < _config.iterations) {
    moveLines(iter, frameCount);
    iter++;
  } else if (iter === _config.iterations) {
    two.pause();
    iter++;
  }
});

/*
  Controls
*/

const gui = new dat.GUI({
  autoPlace: false,
  useLocalStorage: true,
  showCloseButton: false,
  width: '_', // invalidate width
});

gui.remember(config);

gui.add(config, 'aspectRatio', ASPECT_RATIOS).name('Aspect Ratio').onFinishChange(() => {
  resize();
  init();
});
gui.addColor(config, 'background').name('Background').onChange(setBackground);
gui.addColor(config, 'color').name('Color').onFinishChange(init);
// .onChange((val) => {
//   shapes.children[0].fill = val;
//   two.render(); // docs say use two.update();
// });
// gui.add(config, 'lineWidth', 1, 10, 1).name('Line Width').onChange((val) => {
//   shapes.linewidth = val;
//   two.render();
// });
// gui.add(config, 'lineCount', 1, 100, 1).name('Lines').onFinishChange(init);
gui.add(config, 'iterations', 0, 200, 1).name('Iterations').onFinishChange(init);
// gui.add(config, 'sibWeight', 0, 1).name('Sibling Weight').onFinishChange(init);
// gui.add(config, 'lineChange', 0, 10).name('Random Noise').onFinishChange(init);
// gui.add(config, 'slopeWeight', 0, 0.5).name('Slope Weight').onFinishChange(init);
// gui.add(config, 'randomStart').name('Random Start').onFinishChange(init);
gui.add(config, 'Redraw');
gui.add(config, 'Export Svg File');

resize();
setBackground(config.background);
init();

// Add gui.DAT element to #controls
$controls.appendChild(gui.domElement);
