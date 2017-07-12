"use strict";

const request = require("../request-config");

request("sites").then(res => {
    console.log(res.body);
});
