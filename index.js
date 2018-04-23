// Enable Two.js for ESLint and JSDoc (for VSCode)
/* global Two, dat */
/// <reference path="node_modules/two.js/two.extern.js" />

/*
  Helper functions
*/

const rand = (min, max) => {
  return Math.random() * (max - min) + min;
};

/*
  DOM elements
*/

const $container = document.getElementById('root');
const $controls = document.getElementById('controls');

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
  two.width = $container.offsetWidth;
  two.height = $container.offsetHeight;
  two.renderer.setSize($container.offsetWidth, $container.offsetHeight);
};
window.onresize = resize;
window.onload = resize;

/*
  Render shapes
*/

const lines = two.makeGroup();
lines.translation.set(100, 100);

let iter = 0;

const init = (amount) => {
  iter = 0;
  lines.remove(lines.children);

  for (let i = 0; i < amount; i++) { // add 20 lines
    const line = two.makeCurve(0, i * 22, true);
    lines.add(line);
  }
  lines.noFill();

  two.play();
};

two.bind('update', (frameCount) => { // run for 100 frames
  if (iter < 100) iter++;
  else if (iter === 100) {
    two.pause();
    iter++;
    return;
  }
  else return;

  for (const line of lines.children) {
    const v = new Two.Vector(iter * 5, line.vertices[line.vertices.length-1].y + rand(-5, 5));
    line.vertices.push(v);
  }
}).play();

/*
  Controls
*/

const config = {
  Lines: 20,
  Color: '#000000',
  ConsoleLog: () => console.log('Yes!'),
  IsGood: false,
  Speed: 0.1,
};

const gui = new dat.GUI({
  name: 'My GUI',
  autoPlace: false,
  useLocalStorage: true,
  lightTheme: true,
  showCloseButton: false,
  width: '_', // invalidate width
});

gui.remember(config);

gui.add(config, 'Lines', 0, 100, 1).onFinishChange((val) => {
  init(val);
});
gui.addColor(config, 'Color').onChange((val) => {
  lines.stroke = val;
  two.render(); // docs say use two.update();
});
gui.add(config, 'ConsoleLog');
gui.add(config, 'IsGood');
gui.add(config, 'Speed', { Stopped: 0, Slow: 0.1, Fast: 5 } );

init(config.Lines);

// Add gui.DAT element to #controls
$controls.appendChild(gui.domElement);
