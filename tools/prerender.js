import { projectPath } from './settings';
import path from 'path';
import fs from 'fs';

const url = require("url");
const { run } = require("react-snap/index.js");

function removeHttpLink(fileName) {
  const content = require('fs').readFileSync(fileName, 'utf-8');
  const updated = content.replace('<link href="http://localhost:4000/" rel="canonical">', '');
  require('fs').writeFileSync(fileName, updated);
}

function embedResize(fileName) {
  const content = require('fs').readFileSync(fileName, 'utf-8');
  const updated = content.replace('<script src="./main', `
   <script>
               const el = document.querySelector('.landscape-wrapper');
               if (el) {
                   var height = el.parentElement.clientHeight + window.innerHeight - document.body.offsetHeight;
                   el.style.height = height + "px";
                   el.addEventListener('click', function(evt) {
                      if (document.querySelector('html').classList.contains('react-snap')) {;
                        const href = evt.target.getAttribute('data-href');
                          if (href) {
                              window.location.href = "./selected=" + href;
                          }
                        }
                   }, true);
               }
  </script>
  <script src="./main`);
  require('fs').writeFileSync(fileName, updated);
}

async function main() {
  const file200 = path.resolve(projectPath, 'dist', '200.html');
  const fileIndex = path.resolve(projectPath, 'dist', 'index.html');
  const filePrerender = path.resolve(projectPath, 'dist', 'prerender.html');
  const source = path.resolve(projectPath, 'dist');
  console.info(file200, fileIndex, filePrerender, source);
  if (fs.existsSync(file200)) {
    fs.copyFileSync(file200, fileIndex);
    fs.unlinkSync(file200);
  }
  try {
    await run({
      externalServer: true,
      port: 4000,
      publicPath: "/",
      crawl: false,
      source: path.relative('.', source),
      puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
      skipThirdPartyRequests: true
    });
  } catch(error) {
    console.info('Boom');
    console.error(error);
    process.exit(1);
  }
  fs.copyFileSync(fileIndex, filePrerender);
  fs.copyFileSync(file200, fileIndex);
  removeHttpLink(filePrerender);
  embedResize(filePrerender);
};
main().catch(function(ex) {
  console.error(ex);
  process.exit(1);
});

