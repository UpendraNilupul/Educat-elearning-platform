const { exec } = require('child_process');
const fs = require('fs');
exec('npm run build', (error, stdout, stderr) => {
    fs.writeFileSync('build_log.txt', stdout + '\n\n--- STDERR ---\n\n' + stderr);
});
