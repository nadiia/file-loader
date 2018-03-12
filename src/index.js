/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const path = require('path');
const loaderUtils = require('loader-utils');
const storageSingleton = require('./storage-singleton').default;

module.exports = function fileLoader(content) {
  if (!this.emitFile) throw new Error('emitFile is required from module system');

  const options = loaderUtils.getOptions(this) || {};

  const config = {
    publicPath: undefined,
    useRelativePath: false,
    name: '[hash].[ext]',
    storeFile: false,
    storeFileTarget: null,
  };

  // options takes precedence over config
  Object.keys(options).forEach((attr) => {
    config[attr] = options[attr];
  });

  const context = options.context || this.rootContext || (this.options && this.options.context);
  let url = loaderUtils.interpolateName(this, config.name, {
    context,
    content,
    regExp: config.regExp,
  });

  let outputPath = '';
  if (config.outputPath) {
    // support functions as outputPath to generate them dynamically
    outputPath = typeof config.outputPath === 'function' ? config.outputPath(url) : config.outputPath;
  }

  const filePath = this.resourcePath;
  if (config.useRelativePath) {
    // eslint-disable-next-line no-mixed-operators
    const issuerContext = (this._module && this._module.issuer && this._module.issuer.context) || context;
    const relativeUrl =
      issuerContext &&
      path
        .relative(issuerContext, filePath)
        .split(path.sep)
        .join('/');
    const relativePath = relativeUrl && `${path.dirname(relativeUrl)}/`;
    // eslint-disable-next-line no-bitwise
    if (~relativePath.indexOf('../')) {
      // eslint-disable-line no-bitwise
      outputPath = path.posix.join(outputPath, relativePath, url);
    } else {
      outputPath = relativePath + url;
    }
    url = relativePath + url;
  } else if (config.outputPath) {
    // support functions as outputPath to generate them dynamically
    outputPath = typeof config.outputPath === 'function' ? config.outputPath(url) : config.outputPath + url;
    url = outputPath;
  } else {
    outputPath = url;
  }

  let publicPath = `__webpack_public_path__ + ${JSON.stringify(url)}`;
  if (config.publicPath !== undefined) {
    // support functions as publicPath to generate them dynamically
    publicPath = JSON.stringify(typeof config.publicPath === 'function' ? config.publicPath(url) : config.publicPath + url);
  }

  const storage = storageSingleton.getStorage();
  const { storeFile, storeFileTarget } = config;
  if (options.emitFile === undefined || options.emitFile) {
    // when storeFile param is passed we don't emit a file
    // but store it to be added added later as an additional asset to a compilation
    // it allows adding these files in a different compilation
    if (storeFile && (!storeFileTarget || this.target === storeFileTarget)) {
      storage.addFile(outputPath, content);
    } else {
      this.emitFile(outputPath, content);
    }
  }

  return `module.exports = ${publicPath};`;
};

module.exports.raw = true;
