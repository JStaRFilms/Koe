const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'assets', 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// 32x32 solid blue PNG (Base64)
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsEAAA7BAbiRa+0AAAAySURBVFhH7c2xEQAgDAPAA1D/pWEEo2DkI3L3k2VpP8/7BwAAAAAAAAAAAAAAAAAAAHg388wAgJ/HXXkAAAAASUVORK5CYII==';

fs.writeFileSync(path.join(dir, 'tray-icon.png'), Buffer.from(base64Png, 'base64'));
console.log('Tray icon created at', path.join(dir, 'tray-icon.png'));
