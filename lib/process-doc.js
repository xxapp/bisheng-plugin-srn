'use strict';

var fs = require('fs');
var path = require('path');
var JsonML = require('jsonml.js/lib/utils');
var Prism = require('node-prismjs');
var nunjucks = require('nunjucks');
nunjucks.configure({ autoescape: false });

var tmpl = fs.readFileSync(path.join(__dirname, 'template.html')).toString();

module.exports = function (markdownData, isBuild, noPreview, babelConfig) {
  var meta = markdownData.meta;
  meta.id = meta.filename.replace(/\.md$/, '').split('\/').pop();
  var contentChildren = JsonML.getChildren(markdownData.content);
  var demoContent;

  try {
    demoContent = fs.readFileSync(path.join(process.cwd(), 'examples/ui/' + meta.id + '/index.js')).toString();
  } catch (e) {}

  var apiStartIndex = contentChildren.findIndex(function (node) {
    return JsonML.getTagName(node) === 'h2' && /^API/.test(JsonML.getChildren(node)[0]);
  });

  if (apiStartIndex > -1) {
    var content = contentChildren.slice(0, apiStartIndex);
    markdownData.content = ['section'].concat(content);

    var api = contentChildren.slice(apiStartIndex);
    markdownData.api = ['section'].concat(api);
  }

  if (demoContent) {
    markdownData.highlightedCode = ['section'].concat([['pre', { lang: 'jsx', highlighted: Prism.highlight(demoContent, Prism.languages['jsx']) }, ['code', demoContent]]]);
  
    var html = nunjucks.renderString(tmpl, {
      id: meta.id,
      style: markdownData.style,
      reactRouter: meta.reactRouter === 'react-router' ? 'react-router@3/umd/ReactRouter' : meta.reactRouter === 'react-router-dom' ? 'react-router-dom@4/umd/react-router-dom' : false
    });
    var fileName = 'demo-' + Math.random() + '.html';
    fs.writeFile(path.join(process.cwd(), '_site', fileName), html, function () {});
    markdownData.src = path.join('/', fileName);
    markdownData.hasDemo = true;
  } else {
    markdownData.hasDemo = false;
  }

  return markdownData;
};