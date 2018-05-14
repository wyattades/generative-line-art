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
  background: '#a9a9a9',
  sibWeight: 0.02,
  lineChange: 5,
  aspectRatio: 1,
  slopeWeight: 0.01,
  randomStart: false,
  curved: true,
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

const lines = two.makeGroup();
lines.translation.set(MARGIN, MARGIN);

let iter;

const init = () => {
  // Reset background

  const { lineCount, curved, randomStart } = config;
  const height = two.height - 2 * MARGIN;
  const deltaY = height / lineCount;

  // Reset lines
  lines.remove(lines.children);
  for (let i = 0; i < lineCount; i++) { // Add lines to group
    const line = two.makePath(0, randomStart ? rand(0, height) : deltaY * i, true)
    .addTo(lines);
    line.curved = curved;
  }
  lines.cap = 'round';
  lines.fill = 'none';
  lines.stroke = config.color;
  lines.linewidth = config.lineWidth;

  // Create a static copy of config
  _config = Object.assign({}, config);

  iter = 0;
  two.play();
};

const lastY = (line) => line.vertices[line.vertices.length - 1].y;
const getVel = (line) => {
  const verts = line.vertices;
  const length = verts.length;

  if (length < 2) return 0;

  return verts[length - 1].y - verts[length - 2].y;
};

const moveLines = (iter) => {

  const { sibWeight, lineChange, slopeWeight, iterations } = _config;
  const deltaX = (two.width - 2 * MARGIN) / iterations;

  for (let i = 0; i < lines.children.length; i++) {
    const line = lines.children[i];

    let weight = 0;
    
    if (i > 0) {
      const prev = lines.children[i - 1];
      // weight -= sibWeight * (lastY(line) - lastY(prev));
      weight += sibWeight * getVel(prev);
    } else if (i < lines.children.length - 1) {
      const next = lines.children[i + 1];
      // weight += sibWeight * (lastY(next) - lastY(line));
      weight -= sibWeight * getVel(next);
    }

    if (line.vertices.length > 1) {
      weight += slopeWeight * getVel(line);
    }

    const v = new Two.Vector(
      iter * deltaX,
      lastY(line) + rand(-lineChange, lineChange) + weight
    );
    line.vertices.push(v);
  }
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
  lightTheme: true,
  showCloseButton: false,
  width: '_', // invalidate width
});

gui.remember(config);

gui.add(config, 'aspectRatio', ASPECT_RATIOS).name('Aspect Ratio').onFinishChange(() => {
  resize();
  init();
});
gui.addColor(config, 'background').name('Background').onChange(setBackground);
gui.addColor(config, 'color').name('Line Color').onChange((val) => {
  lines.stroke = val;
  two.render(); // docs say use two.update();
});
gui.add(config, 'lineWidth', 1, 10, 1).name('Line Width').onChange((val) => {
  lines.linewidth = val;
  two.render();
});
gui.add(config, 'lineCount', 1, 100, 1).name('Lines').onFinishChange(init);
gui.add(config, 'iterations', 1, 300, 1).name('Iterations').onFinishChange(init);
gui.add(config, 'sibWeight', 0, 1).name('Sibling Weight').onFinishChange(init);
gui.add(config, 'lineChange', 0, 10).name('Random Noise').onFinishChange(init);
gui.add(config, 'slopeWeight', 0, 0.5).name('Slope Weight').onFinishChange(init);
gui.add(config, 'randomStart').name('Random Start').onFinishChange(init);
gui.add(config, 'curved').name('Curved').onFinishChange(init);
gui.add(config, 'Redraw');
gui.add(config, 'Export Svg File');

setBackground(config.background);
init();

// Add gui.DAT element to #controls
$controls.appendChild(gui.domElement);
