'use strict';

const { join } = require('path');
const fs = require('hexo-fs');

hexo.extend.filter.register('after_generate', function() {
  const sourceGameDir = join(this.source_dir, 'game');
  const publicGameDir = join(this.public_dir, 'game');

  return fs.exists(sourceGameDir).then(exists => {
    if (!exists) return;

    return fs.exists(publicGameDir)
      .then(destExists => {
        if (destExists) return fs.rmdir(publicGameDir);
      })
      .then(() => fs.copyDir(sourceGameDir, publicGameDir, { ignoreHidden: false }))
      .then(() => {
        this.log.info('Copied /game static output into public/game');
      });
  });
});
