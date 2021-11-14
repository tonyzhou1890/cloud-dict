import Handlebars from "handlebars"

var mimetypes = {
  'jpeg': 'image/jpeg',
  'JPEG': 'image/jpeg',
  'jpg': 'image/jpeg',
  'JPG': 'image/jpeg',
  'bmp': 'image/bmp',
  'BMP': 'image/bmp',
  'png': 'image/png',
  'PNG': 'image/png',
  'svg': 'image/svg+xml',
  'SVG': 'image/svg+xml',
  'gif': 'image/gif',
  'GIF': 'image/gif',
  'otf': 'font/otf',
  'OTF': 'font/otf',
  'ttf': 'font/ttf',
  'TTF': 'font/ttf'
};

Handlebars.registerHelper('extension', function (str) {
  return ext(str);
});

Handlebars.registerHelper('mimetype', function (str) {
  return mimetypes[ext(str)];
});

export function ext(str) {
  return str.substr(str.lastIndexOf('.') + 1);
}