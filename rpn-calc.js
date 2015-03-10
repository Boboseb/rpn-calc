"use strict";

function loggamma(x)  { /* log gamma */
    var v = 1;
    var w = 0;
    var z = 0;
    while (x < 8) {
        v *= x;
        x++
    }
    w = 1 / (x * x);
    return ((((((((-3617/122400) * w + 7/1092) * w - 691/360360) * w + 5/5940) * w - 1/1680) * w + 1/1260) * w - 1/360) * w + 1/12)/x
        + 0.5 * Math.log(2 * Math.PI) - Math.log(v) - x + (x-0.5) * Math.log(x);
}

function gamma(x) {  /* gamma */
    if (x <= 0) {
        if (Math.abs(x) - Math.floor(Math.abs(x)) == 0) {
            return 1 / 0;
        }
        else {
            return Math.PI / (Math.sin(Math.PI * x) * Math.exp(loggamma(1 - x)));
        }
    }
    else {
        return Math.exp(loggamma(x));
    }
}

function factorial(n) {  /* factorial */
    if (n < 0) { /* if negative */
        return gamma(n + 1);
    }
    else if ((n == 0) || (n == 1)) {
        return 1;
    }
    else if (Math.abs(n) - Math.floor(Math.abs(n)) == 0) { /* if positive integer */
        return n * factorial(n - 1);
    }
    else {        /* if non-integer */
        return gamma(n + 1);
    }
}

function CalcModel() {
    this.stack = [];
    this.trigoUnit = "rad";
    this.input = "";
    this.alt = false;
}

function CalcController(document) {
    this.model = new CalcModel();
    
    this.stackDisplay = document.getElementById("stack");
    this.inputDisplay = document.getElementById("input");
    this.buttonsDisplay = document.getElementById("buttons");
    this.flags = {};
    var flags = document.querySelectorAll("[data-flag]");
    var flagName;
    
    for (var i = 0; i < flags.length; ++i) {
        flagName = flags[i].getAttribute("data-flag");
        this.flags[flagName] = this.flags[flagName] || [];
        this.flags[flagName].push(flags[i]);
    }
    
    // restore storage
    this.loadModel();
    
    // update
    this.updateView();
    
    var self = this;
    document.addEventListener("click", function (e) {
        var dataset = e.target.dataset;
        
        if (dataset.action) {
            self.callAction(dataset.action, dataset.param);
            self.updateView();
        }    
    }, false);
}

CalcController.extend = function() {
    var options, name, copy, target = arguments[0] || {};

    for (var i = 1 ; i < arguments.length; i++ ) {
        // Only deal with non-null/undefined values
        if ((options = arguments[i]) != null) {
            // Extend the base object
            for (name in options) {
                copy = options[name];

                // Don't bring in undefined values
                if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }

    // Return the modified object
    return target;
};

CalcController.callAction = function (action, model, param) {
    CalcController.actions[action].call(model, param);
}

CalcController.checkArgsCount = function (model, numArgs) {
    if (model.input != "") {
        CalcController.callAction("enter", model);
    }
    return model.stack.length >= numArgs;
}

CalcController.actions = {
    inputKey: function (key) {
        if (key == '.' && (this.input == "" || this.input.indexOf('.') != -1 || this.input.indexOf('E') != -1)) {
            return;
        }
        if (key == 'E' && (this.input == "" || this.input.indexOf('E') != -1)) {
            return;
        }
        this.input += key;
    },
    alt: function () {
        this.alt = !this.alt;  
    },
    rad: function () {
        this.trigoUnit = this.trigoUnit == "rad" ? "deg" : "rad";
    },
    enter: function () {
        if (this.input != "") {
            this.stack.push(JSON.parse(this.input));
            this.input = "";
        } else {
            var entry = this.stack.pop();
            if (entry) {
                this.stack.push(entry);
                this.stack.push(entry);
            }
        }
    },
    drop: function () {
        if (this.input != "") {
            this.input = this.input.slice(0, -1);
        } else {
            this.stack.pop();
        }
    },
    clear: function () {
        if (this.input != "") {
            // nothing
        } else {
            this.stack.length = 0;
        }
    },
    add: function () {
        if (CalcController.checkArgsCount(this, 2)) {
            var right = this.stack.pop();
            var left = this.stack.pop();
            this.stack.push(left + right);
        }
    },
    sub: function () {
        if (CalcController.checkArgsCount(this, 2)) {
            var right = this.stack.pop();
            var left = this.stack.pop();
            this.stack.push(left - right);
        }
    },
    mul: function () {
        if (CalcController.checkArgsCount(this, 2)) {
            var right = this.stack.pop();
            var left = this.stack.pop();
            this.stack.push(left * right);
        }
    },
    div: function () {
        if (CalcController.checkArgsCount(this, 2)) {
            var right = this.stack.pop();
            var left = this.stack.pop();
            this.stack.push(left / right);
        }
    },
    neg: function () {
        if (this.input != "") {
            var posE = this.input.indexOf('E');
            if (posE == -1) {
                if (this.input.startsWith('-')) {
                    this.input = this.input.substr(1);
                }
                else {
                    this.input = '-' + this.input;
                }
            }
            else {
                if (this.input.startsWith('-', posE + 1)) {
                    this.input = this.input.substr(0, posE + 1) + this.input.substr(posE + 2);
                }
                else {
                    this.input = this.input.substr(0, posE + 1) + '-' + this.input.substr(posE + 1);
                }
            }
        }
        else if (CalcController.checkArgsCount(this, 1)) {
            this.stack.push(-this.stack.pop())
        }
    },
    inv: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            this.stack.push(1 / this.stack.pop())
        }
    },
    swap: function () {
        if (CalcController.checkArgsCount(this, 2)) {
            var item1 = this.stack.pop();
            var item2 = this.stack.pop();
            this.stack.push(item1);
            this.stack.push(item2);
        }
    },
    rotu: function () {
        if (CalcController.checkArgsCount(this, 2)) {
            var item = this.stack.shift();
            this.stack.push(item);
        }
    },
    rotd: function () {
        if (CalcController.checkArgsCount(this, 2)) {
            var item = this.stack.pop();
            this.stack.unshift(item);
        }
    },
    pi: function () {
        CalcController.checkArgsCount(this, 0);
        this.stack.push(Math.PI);
    },
    e: function () {
        CalcController.checkArgsCount(this, 0);
        this.stack.push(Math.E);
    },
    sqr: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            this.stack.push(item * item);
        }
    },
    sqrt: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            this.stack.push(Math.sqrt(item));
        }
    },
    pow: function () {
        if (CalcController.checkArgsCount(this, 2)) {
            var x = this.stack.pop();
            var y = this.stack.pop();
            this.stack.push(Math.pow(y, x));
        }
    },
    nthrt: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var x = this.stack.pop();
            var y = this.stack.pop();
            this.stack.push(Math.pow(y, 1 / x));
        }
    },
    ln: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            this.stack.push(Math.log(item));
        }
    },
    log: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            this.stack.push(Math.log(item)/Math.log(10));
        }
    },
    exp: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            this.stack.push(Math.exp(item));
        }
    },
    alog: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            this.stack.push(Math.pow(10, item));
        }
    },
    fact: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            var result = item;
            this.stack.push(factorial(item));
        }
    },
    sin: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            if (this.trigoUnit == "deg") {
                item = item * Math.PI / 180;
            }
            this.stack.push(Math.sin(item));
        }
    },
    cos: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            if (this.trigoUnit == "deg") {
                item = item * Math.PI / 180;
            }
            this.stack.push(Math.cos(item));
        }
    },
    tan: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            if (this.trigoUnit == "deg") {
                item = item * Math.PI / 180;
            }
            this.stack.push(Math.tan(item));
        }
    },
    asin: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            item = Math.asin(item);
            if (this.trigoUnit == "deg") {
                item = item * 180 / Math.PI;
            }
            this.stack.push(item);
        }
    },
    acos: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            item = Math.acos(item);
            if (this.trigoUnit == "deg") {
                item = item * 180 / Math.PI;
            }
            this.stack.push(item);
        }
    },
    atan: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            item = Math.atan(item);
            if (this.trigoUnit == "deg") {
                item = item * 180 / Math.PI;
            }
            this.stack.push(item);
        }
    },
    sinh: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            item = (Math.exp(item) - Math.exp(-item)) / 2;
            this.stack.push(item);
        }
    },
    cosh: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            item = (Math.exp(item) + Math.exp(-item)) / 2;
            this.stack.push(item);
        }
    },
    tanh: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            item = (Math.exp(item) - Math.exp(-item)) / (Math.exp(item) + Math.exp(-item));
            this.stack.push(item);
        }
    },
    asinh: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            item = Math.log(item + Math.sqrt(item * item + 1));
            this.stack.push(item);
        }
    },
    acosh: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            item = Math.log(item + Math.sqrt(item * item - 1));
            this.stack.push(item);
        }
    },
    atanh: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            item = Math.log((1 + item) / (1 - item)) / 2;
            this.stack.push(item);
        }
    },
    mod: function () {
        if (CalcController.checkArgsCount(this, 2)) {
            var right = this.stack.pop();
            var left = this.stack.pop();
            this.stack.push(left % right);
        }
    },
    floor: function () {
        if (CalcController.checkArgsCount(this, 1)) {
            var item = this.stack.pop();
            this.stack.push(Math.floor(item));
        }
    }
}

CalcController.prototype.loadModel = function () {
    var newModel = window.localStorage.getItem("state");
    if (newModel) {
        CalcController.extend(this.model, JSON.parse(newModel));
    }
}

CalcController.prototype.saveModel = function () {
    window.localStorage.setItem("state", JSON.stringify(this.model));
}

CalcController.prototype.callAction = function (action, param) {
    CalcController.callAction(action, this.model, param);
    this.saveModel();
}

CalcController.prototype.updateView = function () {
    var items = this.stackDisplay.getElementsByTagName("output");
    var stack = this.model.stack;
    
    for (var i = 0; i < items.length; ++i) {
        items[items.length - i - 1].textContent = (stack.length > i) ? stack[stack.length - i - 1].toPrecision(13).replace(/\.?0+$/, "") : " ";
    }
    
    this.inputDisplay.value = this.model.input;
    this.inputDisplay.hidden = this.model.input == "";
    this.stackDisplay.style.marginTop = this.inputDisplay.hidden ? "" : "-2rem";
    
    if (this.flags.rad) {
        for (i = 0; i < this.flags.rad.length; ++i) {
            this.flags.rad[i].hidden = this.model.trigoUnit != "rad";
        }
    }
    if (this.flags.deg) {
        for (i = 0; i < this.flags.deg.length; ++i) {
            this.flags.deg[i].hidden = this.model.trigoUnit != "deg";
        }
    }
    
    if (this.model.alt) {
        this.buttonsDisplay.classList.add("alt");
    }
    else {
        this.buttonsDisplay.classList.remove("alt");
    }
}

var controller;

document.addEventListener("DOMContentLoaded", function (e) {
    if (window.location.hash == "") {
        window.location.hash = "#panel1";
    }
    controller = new CalcController(document);
}, false);
