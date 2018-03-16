'use strict';

var fs = require('fs');
var path = require('path');
var JsonML = require('jsonml.js/lib/utils');
var Prism = require('node-prismjs');
var nunjucks = require('nunjucks');
nunjucks.configure({ autoescape: false });
var demoConfigs = require(path.join(process.cwd(), 'examples/site/demo.config.js'));

var tmpl = fs.readFileSync(path.join(__dirname, 'template.html')).toString();

module.exports = function (markdownData, isBuild, noPreview, babelConfig) {
  var meta = markdownData.meta;
  meta.id = meta.filename.replace(/\.md$/, '').split('\/').pop();
  var contentChildren = JsonML.getChildren(markdownData.content);
  var demoConfig = demoConfigs[meta.id];
  var demoContent = [];

  if (demoConfig) {
    try {
      if (demoConfig.file) {
        demoContent = demoConfig.file.map(f => {
          return {
            filename: f,
            content: fs.readFileSync(path.join(process.cwd(), 'examples/ui/' + meta.id + '/' + f)).toString().replace(/\.\.\/\.\.\/\.\.\/srn/g, '@souche-ui/srn-ui'),
          };
        });
      } else {
        demoContent.push({
          filename: 'index.js',
          content: fs.readFileSync(path.join(process.cwd(), 'examples/ui/' + meta.id + '/index.js')).toString().replace(/\.\.\/\.\.\/\.\.\/srn/g, '@souche-ui/srn-ui'),
        });
      }
    } catch (e) {}
  }

  var apiStartIndex = contentChildren.findIndex(function (node) {
    return JsonML.getTagName(node) === 'h2' && /^API/.test(JsonML.getChildren(node)[0]);
  });

  if (apiStartIndex > -1) {
    var content = contentChildren.slice(0, apiStartIndex);
    markdownData.content = ['section'].concat(content);

    var api = contentChildren.slice(apiStartIndex);
    markdownData.api = ['section'].concat(api);
  }

  if (demoConfig) {
    markdownData.highlightedCode = demoContent.map(d => {
      return {
        filename: d.filename,
        image: demoConfig.image,
        content: ['section'].concat([['pre', { lang: 'jsx', highlighted: Prism.highlight(d.content, Prism.languages['jsx']) }, ['code', d.content]]])
      };
    });;
    markdownData.demoConfig = demoConfig;

    markdownData.hasDemo = true;
  }

  return markdownData;
};