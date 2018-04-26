// Enable Two.js for ESLint and JSDoc (for VSCode)
/* global Two, dat */
/// <reference path="node_modules/two.js/two.extern.js" />

/*
  Constants
*/

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

// const otherConfig = {
//   marginX: 50, // where to start and stop curving lines
//   marginY: 80, // initial lines are created between these margins
//   segments: 200, // how many segments to draw for each line
//   lines: 80, // number of unique lines
//   w: 600, h: 600, // size of canvas
//   rand: 0.8, // randomizer from segment to segment
//   slopeWeight: 0.5, // weight that a line's slope has on its next value
//   siblingWeight: 0.5, // weight that a line's above sibling's slope has on its next value
//   normalize: 0.002, // exponentially bringing line height back to 0
// };

const config = {
  lines: 20,
  color: '#000000',
  iterations: 100,
  thickness: 1,
  background: '#a9a9a9',
  sibWeight: 0.02,
  lineChange: 5,
  aspectRatio: 1,
  slopeWeight: 0.01,
  'Redraw': () => init(),
  'Export Svg File': () => {
    const innerSvg = document.querySelector('#root > svg').innerHTML;
    const svgText = `<svg
        width="${1600 * config['Aspect Ratio']}" height="1600"
        viewBox="0 0 ${two.width} ${two.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${config.Background}"/>
      ${innerSvg.replace(/fill="transparent"/g, 'fill="none"')}
    </svg>`;

    download('art.svg', svgText);
  },
};

// Temporary config object that doesn't change while art is animating
let _config;

/*
  Setup two.js
*/

const params = {
  width: $container.offsetWidth,
  height: $container.offsetHeight,
};
const two = new Two(params).appendTo($container);

// Resize canvas when window resizes and DOM fully loads
const resize = () => {
  const ratio = config.aspectRatio;
  const scale = Math.min($container.offsetWidth / ratio, $container.offsetHeight);

  two.width = ratio * scale;
  two.height = scale;
  two.renderer.setSize(two.width, two.height);
};
window.onresize = resize;
window.onload = resize;

/*
  Render shapes
*/

const lines = two.makeGroup();
lines.translation.set(MARGIN, MARGIN);

let iter = 0;

const init = () => {
  setBackground(config.background);
  iter = 0;
  lines.remove(lines.children);

  const distBetween = (two.height - 2 * MARGIN) / config.lines;

  for (let i = 0; i < config.lines; i++) { // Add lines to group
    const line = two.makeCurve(0, i * distBetween, true);
    lines.add(line);
  }
  lines.noFill();
  lines.stroke = config.color;

  // Create a static copy of config
  _config = Object.assign({}, config);

  two.play();
};

// const lastY = (line) => line.vertices[line.vertices.length - 1].y;
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
      line.vertices[line.vertices.length - 1].y + rand(-lineChange, lineChange) + weight
    );
    line.vertices.push(v);
  }
};

two.bind('update', (frameCount) => {
  // run for 100 frames
  if (iter < _config.iterations) iter++;
  else if (iter === _config.iterations) {
    two.pause();
    iter++;
    return;
  }
  else return;

  moveLines(iter, frameCount);
}).play();

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
gui.add(config, 'thickness', 1, 20, 1).name('Line Thickness').onChange((val) => {
  lines.linewidth = val;
  two.render();
});
gui.add(config, 'lines', 1, 100, 1).name('Lines').onFinishChange(init);
gui.add(config, 'iterations', 1, 300).name('Iterations').onFinishChange(init);
gui.add(config, 'sibWeight', 0, 1).name('Sibling Weight').onFinishChange(init);
gui.add(config, 'lineChange', 0, 10).name('Random Noise').onFinishChange(init);
gui.add(config, 'slopeWeight', 0, 0.5).name('Slope Weight').onFinishChange(init);
gui.add(config, 'Redraw');
gui.add(config, 'Export Svg File');

init(config.Lines);

// Add gui.DAT element to #controls
$controls.appendChild(gui.domElement);
