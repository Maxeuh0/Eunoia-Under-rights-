const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.default = async function (context) {
    const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
    const iconPath = path.join(__dirname, 'build', 'icon.ico');
    const rceditPath = path.join(__dirname, 'node_modules', 'electron-winstaller', 'vendor', 'rcedit.exe');

    if (fs.existsSync(exePath) && fs.existsSync(iconPath) && fs.existsSync(rceditPath)) {
        console.log(`Injecting icon into ${exePath}...`);
        try {
            execSync(`"${rceditPath}" "${exePath}" --set-icon "${iconPath}"`, { stdio: 'inherit' });
            console.log('Icon injected successfully!');
        } catch (error) {
            console.error('Failed to inject icon:', error.message);
        }
    } else {
        console.log('Skipping icon injection - files not found');
        console.log('  exe:', fs.existsSync(exePath));
        console.log('  icon:', fs.existsSync(iconPath));
        console.log('  rcedit:', fs.existsSync(rceditPath));
    }
};
