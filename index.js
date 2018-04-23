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

const init = () => {
  iter = 0;
  lines.remove(lines.children);

  for (let i = 0; i < config.Lines; i++) { // add 20 lines
    const line = two.makeCurve(0, i * 22, true);
    lines.add(line);
  }
  lines.noFill();

  two.play();
};

const addLines = () => {
  // if (iter < 100) iter++;
  // else if (iter === 100) {
  //   two.pause();
  //   iter++;
  //   return;
  // }
  // else return;
  // moveLines();

  // for (const line of lines.children) {
  //   const v = new Two.Vector(iter * 5, line.vertices[line.vertices.length-1].y + rand(-5, 5));
  //   line.vertices.push(v);
  // }
};

const moveLines = () => {
  if (iter < 100) iter++;
  else if (iter === 100) {
    two.pause();
    iter++;
    return;
  }
  else return;

  for (let i = 0; i < lines.children.length; i++) {
    let weight = 0;
    const imp = config['Sibling Weight'];
    if (i > 0) {
      const prev = lines.children[i - 1];
      weight -= imp * prev.vertices[prev.vertices.length - 1].y;
      console.log(prev.vertices[prev.vertices.length - 1].y);
    }

    if (i < lines.children.length - 1) {
      const next = lines.children[i + 1];
      weight += imp * next.vertices[next.vertices.length - 1].y;
      console.log(next.vertices[next.vertices.length - 1].y);
    }

    const line = lines.children[i];
    const v = new Two.Vector(iter * 5, line.vertices[line.vertices.length-1].y + rand(-5, 5) + weight);
    line.vertices.push(v);
  }
};

two.bind('update', (frameCount) => { // run for 100 frames
  // addLines();
  moveLines();
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
  'Sibling Weight': 0.1,
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

gui.add(config, 'Lines', 0, 100, 1).onFinishChange(() => {
  init();
});
gui.addColor(config, 'Color').onChange((val) => {
  lines.stroke = val;
  two.render(); // docs say use two.update();
});
gui.add(config, 'ConsoleLog');
gui.add(config, 'IsGood');
gui.add(config, 'Speed', { Stopped: 0, Slow: 0.1, Fast: 5 } );
gui.add(config, 'Sibling Weight').min(0).max(1).onFinishChange(() => {
  init();
});

init(config.Lines);

// Add gui.DAT element to #controls
$controls.appendChild(gui.domElement);
