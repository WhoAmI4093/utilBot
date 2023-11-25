"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keepAlive = void 0;
const express = require('express');
const server = express();
server.all(/.*/, (req, res) => {
    res.send(`Result: [OK].`);
});
function keepAlive() {
    server.listen(3000, () => {
        console.log(`Server is now ready! | ` + Date.now());
    });
}
exports.keepAlive = keepAlive;
module.exports = keepAlive;
