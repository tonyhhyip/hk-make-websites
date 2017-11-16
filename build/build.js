const path = require('path');
const fs = require('fs');
const marked = require('marked');
const { Environment, FileSystemLoader } = require('nunjucks');
const glob = require('glob');
const shell = require('shelljs');
const moment = require('moment');

const assetsPath = 'dist';
shell.rm('-rf', assetsPath);
shell.mkdir('-p', assetsPath);
shell.config.silent = true;

const env = new Environment([new FileSystemLoader('template')]);

function getContentFiles() {
  return new Promise((resolve, reject) => {
    glob('content/*.md', (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    })
  })
}

function getFileContent(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (e, content) => {
      if (e) {
        reject(e)
      } else {
        resolve(marked(content))
      }
    })
  });
}

function createBuildParameters(files) {
  const promises = files.map(getFileContent);
  return Promise.all(promises)
    .then(contents => contents.reduce((obj, content, idx) => {
      const key = path.basename(files[idx], '.md');
      obj[key] = content;
      return obj;
    }, {}));
}

function renderToFile(parameters) {
  parameters.update = moment().format('YYYY-M-D HH:mm');
  return new Promise((resolve, reject) => {
    const content = env.render('index.jinja', parameters);
    fs.writeFile('dist/index.html', content, (e) => {
      if (e) {
        reject(e)
      } else {
        resolve();
      }
    })
  });
}

getContentFiles()
  .then(createBuildParameters)
  .then(renderToFile)
  .catch(console.error);