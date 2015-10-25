'use strict';

var DIRECTION_GPIOA = 0x00,
    DIRECTION_GPIOB = 0x01,
    FROM_GPIOA = 0x12,
    FROM_GPIOB = 0x13,
    TO_GPIOA = 0x14,
    TO_GPIOB = 0x15,
    MCP23017_GPPUA = 0x0C;
    //MCP23017_GPPUB = 0x0D;

var MCP23017 = (function() {

    function MCP23017 (board) {
        this.mode = this.INPUT;
        this.debug = false;

        if (!(this instanceof MCP23017)) {
            return new MCP23017(board);
        }
        this.io = board.io;
        // This is required to enable I2C
        this.io.i2cConfig();
        this._initGpioA();
        this._initGpioB();
    }

    MCP23017.prototype.HIGH     = 1;
    MCP23017.prototype.LOW      = 0;
    MCP23017.prototype.INPUT    = 1;
    MCP23017.prototype.OUTPUT   = 0;

    MCP23017.prototype.address = 0x20; //if the mcp has all adress lines pulled low

    MCP23017.prototype.oldADir = 0x00; //initial state of GPIO A
    MCP23017.prototype.oldBDir = 0x00; //initial state of GPIO A

    MCP23017.prototype.oldGpioA = 0x0; //initial state of GPIO A
    MCP23017.prototype.oldGpioB = 0x01; //initial state of GPIO B

    //inits both registers as an input
    MCP23017.prototype.reset = function () {
        this.oldBDir = 0xff;
        this.oldADir = 0xff;
        this._initGpioA();
        this._initGpioB();
    };

    /*
     sets an pin as an INPUT or OUTPUT
     */
    MCP23017.prototype.pinMode = function (pin, dir) {
        if (dir !== this.INPUT && dir !== this.OUTPUT) {
            console.error('invalid value', dir);
            return;
        }
        if (isNaN(pin)) {
            console.error('pin is not a number:', pin);
            return;
        } else if (pin > 15 || pin < 0) {
            console.error('invalid pin:', pin);
        }

        //delegate to function that handles low level stuff
        this._setGpioDir(pin >= 8 ? pin - 8 : pin, dir, pin >= 8 ? DIRECTION_GPIOB : DIRECTION_GPIOA);
    };

    /*
     internally used to set the direction registers
     */
    MCP23017.prototype._setGpioDir = function (pin, dir, register) {
        var pinHexMask = Math.pow(2, pin),
            registerValue;

        if (register === DIRECTION_GPIOA) {
            registerValue = this.oldADir;
            if (dir === this.OUTPUT) {
                if ((this.oldADir & pinHexMask) === pinHexMask) {
                    this.log('setting pin \'' + pin + '\' as an OUTPUT');
                    this.oldADir = this.oldADir ^ pinHexMask;
                    registerValue = this.oldADir;
                } else {
                    this.log('pin \'' + pin + '\' already an OUTPUT');
                }
            } else if (dir === this.INPUT) {
                if ((this.oldADir & pinHexMask) !== pinHexMask) {
                    this.log('setting pin \'' + pin + '\' as an INPUT');
                    this.oldADir = this.oldADir ^ pinHexMask;
                    registerValue = this.oldADir;
                } else {
                    this.log('pin \'' + pin + '\' already an INPUT');
                }
            }
        } else if (register === DIRECTION_GPIOB) {
            registerValue = this.oldBDir;
            if (dir === this.OUTPUT) {
                if ((this.oldBDir & pinHexMask) === pinHexMask) {
                    this.log('setting pin \'' + pin + '\' as an OUTPUT');
                    this.oldBDir = this.oldBDir ^ pinHexMask;
                    registerValue = this.oldBDir;
                } else {
                    this.log('pin \'' + pin + '\' already an OUTPUT');
                }
            } else if (dir === this.INPUT) {
                if ((this.oldBDir & pinHexMask) !== pinHexMask) {
                    this.log('setting pin \'' + pin + '\' as an INPUT');
                    this.oldBDir = this.oldBDir ^ pinHexMask;
                    registerValue = this.oldBDir;
                } else {
                    this.log('pin \'' + pin + '\' already an INPUT');
                }
            }
        }
        this._send(register, [registerValue]);
        //this.log('register: 0x' + register.toString(16) + ', value: 0x' + registerValue.toString(16));
        this.log('register: 0x' + register + ', value: 0x' + registerValue);
    };

    MCP23017.prototype._setGpioAPinValue = function (pin, value) {
        var pinHexMask = Math.pow(2, pin);
        if (value === 0) {
            if ((this.oldGpioA & pinHexMask) === pinHexMask) {
                this.oldGpioA = this.oldGpioA ^ pinHexMask;
                this._send(TO_GPIOA, [this.oldGpioA]);
            }
        }
        if (value === 1) {
            if ((this.oldGpioA & pinHexMask) !== pinHexMask) {
                this.oldGpioA = this.oldGpioA ^ pinHexMask;
                this._send(TO_GPIOA, [this.oldGpioA]);
            }
        }
    };

    MCP23017.prototype._setGpioBPinValue = function (pin, value) {
        var pinHexMask = Math.pow(2, pin);
        if (value === 0) {
            if ((this.oldGpioB & pinHexMask) === pinHexMask) {
                this.oldGpioB = this.oldGpioB ^ pinHexMask;
                this._send(TO_GPIOB, [this.oldGpioB]);
            }
        }
        if (value === 1) {
            if ((this.oldGpioB & pinHexMask) !== pinHexMask) {
                this.oldGpioB = this.oldGpioB ^ pinHexMask;
                this._send(TO_GPIOB, [this.oldGpioB]);
            }
        }
    };

    var allowedValues = [0, 1, true, false];
    MCP23017.prototype.digitalWrite = function (pin, value) {
        if (allowedValues.indexOf(value) < 0) {
            console.error('invalid value', value);
            return;
        } else if (value === false) {
            value = this.LOW;
        } else if (value === true) {
            value = this.HIGH;
        }

        if (isNaN(pin)) {
            console.error('pin is not a number:', pin);
            return;
        } else if (pin > 15 || pin < 0) {
            console.error('invalid pin:', pin);
        } else if (pin < 8 ) {
            //Port A
            this._setGpioAPinValue(pin, value);
        } else {
            //Port B
            pin -= 8;
            this._setGpioBPinValue(pin, value);
        }
    };

    MCP23017.prototype.digitalRead = function (pin, callback) {
        var register = pin >= 8 ? FROM_GPIOB : FROM_GPIOA; //get the register to read from
        pin = pin >= 8 ? pin - 8 : pin; //remap the pin to internal value
        var pinHexMask = Math.pow(2, pin); //create a hexMask

        var preValue = 0;
        var value;
        //read one byte from the right register (A or B)
        this._read(register, 1, function (registerValue) {
            value = registerValue & pinHexMask;
            if(parseInt(preValue) !== parseInt(value)) {
                if (value === pinHexMask) {
                     //Check if the requested bit is set in the byte returned from the register
                     callback(pin, true);
                } else {
                     callback(pin, false);
                }
                preValue = value;
            }
        });

    };

    MCP23017.prototype._initGpioA = function () {
        this._send(DIRECTION_GPIOA, [this.oldADir]); //Set Direction to Input
        this._send(TO_GPIOA, [0xff]); //set high all Input states
        this._send(MCP23017_GPPUA, [0xff]); //enable all Input Pull-Up internal 100K resistor
    };

    MCP23017.prototype._initGpioB = function () {
        this._send(DIRECTION_GPIOB, [this.oldBDir]); //Set Direction to Output
        this._send(TO_GPIOB, [0x01]); //set GBP0 high clear other Input states
    };

    MCP23017.prototype._send = function (cmd, values) {
        // Write the register
        this.io.i2cWrite(this.address, cmd, values);
    };

    MCP23017.prototype._read = function (cmd, length, callback) {
        // read the current GPINTEN
        this.io.i2cRead(this.address, cmd, length, function (res) {
            callback(res);
        });
    };

    MCP23017.prototype.log = function (msg) {
        if (this.debug) {
            console.log(msg);
        }
    };

    return MCP23017;

})();

module.exports = MCP23017;
