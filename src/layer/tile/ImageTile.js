import Tile from './Tile';
import BoxHelper from '../../vendor/BoxHelper';
import THREE from 'three';

class ImageTile extends Tile {
  constructor(quadcode, path, layer) {
    super(quadcode, path, layer);
  }

  // Request data for the tile
  requestTileAsync() {
    // Making this asynchronous really speeds up the LOD framerate
    setTimeout(() => {
      if (!this._mesh) {
        this._mesh = this._createMesh();
        this._requestTexture();
      }
    }, 0);
  }

  destroy() {
    // Cancel any pending requests
    this._abortRequest();

    // Clear image reference
    this._image = null;

    super.destroy();
  }

  _createMesh() {
    // Something went wrong and the tile
    //
    // Possibly removed by the cache before loaded
    if (!this._center) {
      return;
    }

    var mesh = new THREE.Object3D();
    var geom = new THREE.PlaneBufferGeometry(this._side, this._side, 1);

    var material = new THREE.MeshBasicMaterial({
      depthWrite: false
    });

    var localMesh = new THREE.Mesh(geom, material);
    localMesh.rotation.x = -90 * Math.PI / 180;

    mesh.add(localMesh);

    mesh.position.x = this._center[0];
    mesh.position.z = this._center[1];

    var box = new BoxHelper(localMesh);
    mesh.add(box);

    mesh.add(this._createDebugMesh());

    return mesh;
  }

  _createDebugMesh() {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    var context = canvas.getContext('2d');
    context.font = 'Bold 20px Helvetica Neue, Verdana, Arial';
    context.fillStyle = '#ff0000';
    context.fillText(this._quadcode, 20, canvas.width / 2 - 5);
    context.fillText(this._tile.toString(), 20, canvas.width / 2 + 25);

    var texture = new THREE.Texture(canvas);

    // Silky smooth images when tilted
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    // TODO: Set this to renderer.getMaxAnisotropy() / 4
    texture.anisotropy = 4;

    texture.needsUpdate = true;

    var material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });

    var geom = new THREE.PlaneBufferGeometry(this._side, this._side, 1);
    var mesh = new THREE.Mesh(geom, material);

    mesh.rotation.x = -90 * Math.PI / 180;
    mesh.position.y = 0.1;

    return mesh;
  }

  _requestTexture() {
    var urlParams = {
      x: this._tile[0],
      y: this._tile[1],
      z: this._tile[2]
    };

    var url = this._getTileURL(urlParams);

    var image = document.createElement('img');

    image.addEventListener('load', event => {
      var texture = new THREE.Texture();

      texture.image = image;
      texture.needsUpdate = true;

      // Silky smooth images when tilted
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipMapLinearFilter;

      // TODO: Set this to renderer.getMaxAnisotropy() / 4
      texture.anisotropy = 4;

      texture.needsUpdate = true;

      // Something went wrong and the tile or its material is missing
      //
      // Possibly removed by the cache before the image loaded
      if (!this._mesh || !this._mesh.children[0] || !this._mesh.children[0].material) {
        return;
      }

      this._mesh.children[0].material.map = texture;
      this._mesh.children[0].material.needsUpdate = true;

      this._texture = texture;
      this._ready = true;
    }, false);

    // image.addEventListener('progress', event => {}, false);
    // image.addEventListener('error', event => {}, false);

    image.crossOrigin = '';

    // Load image
    image.src = url;

    this._image = image;
  }

  _abortRequest() {
    if (!this._image) {
      return;
    }

    this._image.src = '';
  }
}

// Initialise without requiring new keyword
export default function(quadcode, path, layer) {
  return new ImageTile(quadcode, path, layer);
};
