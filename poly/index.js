// Enable Two.js for ESLint and JSDoc (for VSCode)
/* global Two, dat */
/// <reference path="node_modules/two.js/two.extern.js" />

/*
  Constants
*/

const EXPORT_SIZE = 1600;
const MARGIN = 50;
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

/*
  Color helper functions
*/

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

const _hexToHsl = (hex) => {
  const match = hex.match(/#(.{2})(.{2})(.{2})/);

  const r = parseInt(match[1], 16) / 255;
  const g = parseInt(match[2], 16) / 255;
  const b = parseInt(match[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

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

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hexToHsl = (hex) => {
  const { h, s, l } = _hexToHsl(hex);
  return `hsl(${h},${s}%,${l}%)`;
};

const lerpColor = ({ h, s, l }, lerp) => {
  if (config.random) {
    h += randi(-40, 40);
    s += randi(-40, 40);
    l -= randi(-20, 20);
    l = Math.max(Math.min(l, 100), 0);
  } else {
    h -= lerp * 180;
    s -= lerp * 80;
  }

  h = h < 0 ? h + 360 : h;
  s = Math.max(Math.min(s, 100), 0);

  return hslToHex(null, h, s, l);
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

/*
  Config object: contains all config default values
*/

const config = {
  color: '#ff7100',
  background: '#000000',
  stroke: '#000000',
  showStroke: true,
  random: false,
  iterations: 100,
  aspectRatio: 1,
  type: 'grid',
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
  const scale = Math.min(($container.offsetWidth - 2 * MARGIN) / config.aspectRatio, 
    $container.offsetHeight - 2 * MARGIN);
  
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
  middleAnchor(vs[i],
    s ? vs[i] : (i === 0 ? vs[vs.length - 1] : vs[i - 1]),
    s ? (i === vs.length - 1 ? vs[0] : vs[i + 1]) : vs[i]);
  return child;
};

const TYPES = {

  tunnel: {
    init() {
      const parent = two.makePath(0, 0, two.width, 0, two.width, two.height, 0, two.height, true)
      .addTo(shapes);
      parent.fill = hexToHsl(config.color);
      parent.stroke = 'none';
    },
    update() {
      const last = shapes.children[shapes.children.length - 1];
      const child = makeChild(last)
      .addTo(shapes);
    
      child.fill = lessColor(last.fill);
      child.stroke = 'none';
    },
  },

  grid: {
    init() {

      const { showStroke, stroke } = config;

      const amountY = 12,
            amountX = Math.round(amountY * config.aspectRatio);

      const spacing = two.width / amountX;
      const ratio = 1 / (amountX * amountX + amountY * amountY);

      this.points = [];

      const color = _hexToHsl(config.color);

      const P = (x, y) => (x > 0 && x < amountX && y > 0 && y < amountY) ?
        this.points[y - 1][x - 1] :
        new Two.Anchor(x * spacing, y * spacing);

      for (let i = 1; i <= amountY; i++) {
        const row = [];
        this.points.push(row);
        for (let j = 1; j <= amountX; j++) {
          row.push(new Two.Anchor(j * spacing, i * spacing));

          const triangle = two.makePath([], true)
          .addTo(shapes);
          triangle.vertices.push(P(j - 1, i - 1), P(j, i - 1), P(j, i));
          triangle.fill = lerpColor(color, ratio * (j * j + i * i));
          triangle.stroke = showStroke ? stroke : triangle.fill;

          const triangle2 = two.makePath([], false)
          .addTo(shapes);
          triangle2.vertices.push(P(j - 1, i - 1), P(j - 1, i), P(j, i));
          triangle2.fill = lerpColor(color, ratio * (j * j + i * i) + 0.02);
          triangle2.stroke = showStroke ? stroke : triangle2.fill;
        }
      }
    },
    update() {
      const VEL = 10;
      for (const row of this.points) {
        for (const point of row) {
          point.x += rand(-VEL, VEL);
          point.y += rand(-VEL, VEL);
        }
      }
    },
  },

};

const init = () => {

  conf1.display = conf2.display = conf3.display = config.type === 'tunnel' ? 'none' : 'block';

  // Reset lines
  shapes.remove(shapes.children);

  TYPES[config.type].init();

  // Create a static copy of config
  _config = Object.assign({}, config);

  iter = 0;
  two.play();
};

two.bind('update', (frameCount) => {

  // Only render every 3 frames
  if (frameCount % 3 !== 0) return;

  // Run a certain number of iterations
  if (iter < _config.iterations) {
    TYPES[_config.type].update(iter, frameCount);
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
gui.addColor(config, 'color').name('Fill').onFinishChange(init);
const conf1 = gui.addColor(config, 'stroke').name('Stroke').onFinishChange(init)
.domElement.parentElement.parentElement.style;
const conf2 = gui.add(config, 'showStroke').name('Show Stroke?').onFinishChange(init)
.domElement.parentElement.parentElement.style;
const conf3 = gui.add(config, 'random').name('Random Color?').onFinishChange(init)
.domElement.parentElement.parentElement.style;
gui.add(config, 'iterations', 0, 100, 1).name('Iterations').onFinishChange(init);
gui.add(config, 'type', Object.keys(TYPES)).name('Algorithm Type').onFinishChange(init);
gui.add(config, 'Redraw');
gui.add(config, 'Export Svg File');

// Setup
resize();
setBackground(config.background);
init();

// Add gui.DAT element to #controls
$controls.appendChild(gui.domElement);
