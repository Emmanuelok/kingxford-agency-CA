import test from 'node:test';
import assert from 'node:assert/strict';
import { PHOTO_SCENES, fittedPhotoArea, inverseTransform, photoSceneFor, quadTransform, transformPoint } from '../lib/next/photo-scenes.ts';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test('perspective transform maps all source corners to the inspected card surface', () => {
  const quad = photoSceneFor('cards').area;
  const matrix = quadTransform(quad);
  for (const [index, point] of [[0, [0, 0]], [1, [1, 0]], [2, [1, 1]], [3, [0, 1]]]) {
    const result = transformPoint(matrix, ...point);
    near(result[0], quad[index][0]); near(result[1], quad[index][1]);
  }
  const inverse = inverseTransform(matrix);
  for (const [x, y] of [[0, 0], [.17, .81], [.5, .5], [.96, .04], [1, 1]]) {
    const projected = transformPoint(matrix, x, y);
    const restored = transformPoint(inverse, ...projected);
    near(restored[0], x); near(restored[1], y);
  }
});

test('photographic print areas remain inside the original images and poster/tee retain physical aspect', () => {
  for (const scene of PHOTO_SCENES) {
    for (const [x, y] of scene.area) {
      assert.ok(x >= 0 && x <= scene.width);
      assert.ok(y >= 0 && y <= scene.height);
    }
  }
  for (const [product, aspect] of [['poster', 457 / 610], ['tee', 254 / 305]]) {
    const scene = photoSceneFor(product), area = fittedPhotoArea(scene, aspect);
    const width = Math.hypot(area[1][0] - area[0][0], area[1][1] - area[0][1]);
    const height = Math.hypot(area[3][0] - area[0][0], area[3][1] - area[0][1]);
    near(width / height, aspect);
    for (const [x, y] of area) {
      assert.ok(x >= scene.area[0][0] - 1e-7 && x <= scene.area[1][0] + 1e-7);
      assert.ok(y >= scene.area[0][1] - 1e-7 && y <= scene.area[3][1] + 1e-7);
    }
  }
  assert.equal(photoSceneFor('mug'), undefined);
});

test('degenerate photo geometry is rejected instead of producing invalid pixel coordinates', () => {
  assert.throws(() => quadTransform([[0, 0], [0, 0], [0, 0], [0, 0]]), /invalid/);
  assert.throws(() => inverseTransform([0, 0, 0, 0, 0, 0, 0, 0, 0]), /cannot be projected/);
  assert.throws(() => fittedPhotoArea(photoSceneFor('poster'), 0), /proportions/);
});
