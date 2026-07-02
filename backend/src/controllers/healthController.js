"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthStatus = void 0;
const express_1 = require("express");
const getHealthStatus = (req, res) => {
    res.json({
        status: 'OK',
        backend: 'running'
    });
};
exports.getHealthStatus = getHealthStatus;
//# sourceMappingURL=healthController.js.map