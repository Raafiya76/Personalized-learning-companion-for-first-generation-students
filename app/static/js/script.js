import { Application } from 'https://unpkg.com/@splinetool/runtime@1.12.51/build/runtime.js';

const canvas = document.getElementById('spline-canvas');
const spline = new Application(canvas);

spline
  .load('https://prod.spline.design/DnXAqtyKw-iDe3dt/scene.splinecode')
  .then(() => {
    console.log('Spline scene loaded');
  })
  .catch((err) => {
    console.error('Spline failed to load', err);
  });

// Keep canvas sized to the window
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();
