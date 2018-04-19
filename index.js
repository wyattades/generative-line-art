
const $container = document.getElementById('root');

const params = {
  width: $container.offsetWidth,
  height: $container.offsetHeight,
};
const two = new Two(params).appendTo($container);

window.onresize = () => {
  two.renderer.setSize($container.offsetWidth, $container.offsetHeight);
}

const rect = two.makeRectangle(100, 50, 120, 30);
rect.fill = 'rgb(0, 200, 255)';

two.update();
