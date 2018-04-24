// Enable Two.js for ESLint and JSDoc (for VSCode)
/* global Two, dat */
/// <reference path="node_modules/two.js/two.extern.js" />

/*
  Constants
*/

const MARGIN = 100;

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

const otherConfig = {
  marginX: 50, // where to start and stop curving lines
  marginY: 80, // initial lines are created between these margins
  segments: 200, // how many segments to draw for each line
  lines: 80, // number of unique lines
  w: 600, h: 600, // size of canvas
  rand: 0.8, // randomizer from segment to segment
  slopeWeight: 0.5, // weight that a line's slope has on its next value
  siblingWeight: 0.5, // weight that a line's above sibling's slope has on its next value
  normalize: 0.002, // exponentially bringing line height back to 0
};

const config = {
  'Lines': 20,
  'Color': '#000000',
  'Iterations': 100,
  'Background': '#a9a9a9',
  'Sibling Weight': 0.02,
  'Line Change': 5,
  'Aspect Ratio': 1,
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
  const w = config['Aspect Ratio'], h = 1;

  const scale = Math.min($container.offsetWidth / w, $container.offsetHeight / h);

  two.width = w * scale;
  two.height = h * scale;
  two.renderer.setSize(two.width, two.height);
  console.log(two.width, two.height);
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
  setBackground(config.Background);
  iter = 0;
  lines.remove(lines.children);

  const distBetween = (two.height - 2 * MARGIN) / config.Lines;

  for (let i = 0; i < config.Lines; i++) { // Add lines to group
    const line = two.makeCurve(0, i * distBetween, true);
    lines.add(line);
  }
  lines.noFill();
  lines.stroke = config.Color;

  two.play();
};

const lastY = (line) => line.vertices[line.vertices.length - 1].y;

const moveLines = (iter) => {

  const sibWeight = config['Sibling Weight'],
        lineChange = config['Line Change'],
        speed = (two.width - 2 * MARGIN) / config['Iterations'];

  for (let i = 0; i < lines.children.length; i++) {
    const line = lines.children[i];

    let weight = 0;
    
    if (i > 0) {
      const prev = lines.children[i - 1];
      weight -= sibWeight * (lastY(line) - lastY(prev));
    } else if (i < lines.children.length - 1) {
      const next = lines.children[i + 1];
      weight += sibWeight * (lastY(next) - lastY(line));
    }

    const v = new Two.Vector(
      iter * speed,
      line.vertices[line.vertices.length-1].y + rand(-lineChange, lineChange) + weight
    );
    line.vertices.push(v);
  }
};

two.bind('update', (frameCount) => {
  // run for 100 frames
  if (iter < config['Iterations']) iter++;
  else if (iter === config['Iterations']) {
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
  name: 'My GUI',
  autoPlace: false,
  useLocalStorage: true,
  lightTheme: true,
  showCloseButton: false,
  width: '_', // invalidate width
});

gui.remember(config);

gui.add(config, 'Aspect Ratio', { '4:3': 1.333, '1:1': 1, '3:4': 0.75 }).onFinishChange(() => {
  resize();
  init();
});
gui.add(config, 'Lines', 1, 100, 1).onFinishChange(init);
gui.addColor(config, 'Color').onChange((val) => {
  lines.stroke = val;
  two.render(); // docs say use two.update();
});
gui.addColor(config, 'Background').onChange(setBackground);
gui.add(config, 'Iterations', 1, 300).onFinishChange(init);
gui.add(config, 'Sibling Weight', 0, 1).onFinishChange(init);
gui.add(config, 'Line Change', 0, 10).onFinishChange(init);
gui.add(config, 'Redraw');
gui.add(config, 'Export Svg File');

init(config.Lines);

// Add gui.DAT element to #controls
$controls.appendChild(gui.domElement);
