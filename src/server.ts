const express = require('express');
const server = express();

server.all(/.*/, (req: any, res: any) => {
    res.send(`Result: [OK].`);
});

export function keepAlive() {
    server.listen(3000, () => {
        console.log(`Server is now ready! | ` + Date.now());
    });
}

module.exports = keepAlive;