elation.component.add('janusweb.elements.raycaster', {
  createChildren() {
    this.lasthitobject = null;
  },
  update() {
    var hits = this.raycast(null, null, this.class);
    if (hits.length > 0) {
      var hit = hits[0],
          hitobject = hit.object;
      
      if (hitobject != this.lasthitobject) {
        if (this.lasthitobject) {
          this.dispatchEvent({type: 'raycastleave', data: {object: this.lasthitobject, intersection: hit}});
        }
        this.dispatchEvent({type: 'raycastenter', data: {object: hit.object, intersection: hit}});
        this.lasthitobject = hitobject;
      }
    }
  }
}, elation.janusweb.janusbase);
