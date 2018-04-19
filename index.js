// Enable Two.js for ESLint and JSDoc (for VSCode)
/* global Two */
/// <reference path="./lib/two.d.js" />

/*
  Helper functions
*/
const rand = (min, max) => {
  return Math.random() * (max - min) + min;
};

/*
  Setup DOM interactions
*/

const $container = document.getElementById('root');
const $controls = document.getElementById('controls');

const control = (key, onChange) => {
  const $el = $controls.elements[key];
  if (!$el) throw new Error('Invalid control key: ' + key);

  $el.addEventListener('change', onChange);
  return () => {
    $el.removeEventListener('change', onChange);
  };
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
for (let i = 0; i < 20; i++) { // add 20 lines
  const line = two.makeCurve(0, i * 22, true);
  lines.add(line);
}
lines.noFill();

let iter = 0;
two.bind('update', (frameCount) => { // run for 100 frames
  if (iter++ > 100) two.pause();

  for (const line of lines.children) {
    const v = new Two.Vector(iter * 5, line.vertices[line.vertices.length-1].y + rand(-5, 5));
    line.vertices.push(v);
  }
}).play();

control('color', (e) => {
  lines.stroke = e.target.value;
  two.update();
});
