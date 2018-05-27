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
    const innerSvg = document.querySelector('#root > svg').innerHTML;
    const svgText = `\
<svg width="${EXPORT_SIZE * config.aspectRatio}" height="${EXPORT_SIZE}" \
viewBox="0 0 ${two.width} ${two.height}" xmlns="http://www.w3.org/2000/svg">
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
resize();

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
  parent.fill = `hsl(${randi(0, 360)},100%,50%)`;

  // shapes.fill = config.color;
  shapes.stroke = 'none';
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

  const h = (parseInt(m[1]) - 2),
        s = parseInt(m[2]),
        l = parseInt(m[3]);
  // console.log(h,s,l);
  return `hsl(${h < 0 ? h + 360 : h},${s}%,${l}%)`;
};

const moveLines = (iter) => {
  
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
gui.addColor(config, 'color').name('Color').onChange((val) => {
  shapes.children[0].fill = val;
  two.render(); // docs say use two.update();
});
gui.add(config, 'lineWidth', 1, 10, 1).name('Line Width').onChange((val) => {
  shapes.linewidth = val;
  two.render();
});
gui.add(config, 'lineCount', 1, 100, 1).name('Lines').onFinishChange(init);
gui.add(config, 'iterations', 0, 200, 1).name('Iterations').onFinishChange(init);
gui.add(config, 'sibWeight', 0, 1).name('Sibling Weight').onFinishChange(init);
gui.add(config, 'lineChange', 0, 10).name('Random Noise').onFinishChange(init);
gui.add(config, 'slopeWeight', 0, 0.5).name('Slope Weight').onFinishChange(init);
gui.add(config, 'randomStart').name('Random Start').onFinishChange(init);
gui.add(config, 'Redraw');
gui.add(config, 'Export Svg File');

setBackground(config.background);
init();

// Add gui.DAT element to #controls
$controls.appendChild(gui.domElement);
