var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var obj = {
    user: {
        id: 56,
        username: "guebli.med",
        email: "guebli.med@gmail.com"
    },
    descriptif: "It's a publication",
    medias: [
        {
            id: 55,
            url: "/api/medias/1",
            tags: [
                {
                    id: 1,
                    name: "tag1"
                },
                {
                    id: 2,
                    name: "tag2"
                }
            ]
        },
        {
            id: 60,
            url: "/api/medias/2",
            tags: [
                {
                    id: 1,
                    name: "tag1",
                    keywords: ["tard", "noob"]
                },
                {
                    id: 2,
                    name: "tag2",
                    keywords: ["tt", "zz"]
                },
            ]
        },
        {
            id: 58,
            url: "/api/medias/3",
            tags: [
                {
                    id: 1,
                    name: "tag1"
                },
                {
                    id: 2,
                    name: "tag2"
                }
            ]
        }
    ]
};
var mappers = {
    name: function (obj) {
        return "Are you retard";
    }
};
window.onload = function () {
    Mapper.map($(".medias-test")[0], obj, mappers);
};
/**
    Mapper - used to map json object to a view
 */
var Mapper = /** @class */ (function () {
    function Mapper() {
    }
    Mapper.map = function (element, obj, mappers) {
        var instructions = new InstructionsBuilder().build(element, obj, mappers);
        instructions.forEach(function (instr) {
            instr.setup();
        });
    };
    return Mapper;
}());
/**
    Instructions builder
 */
var InstructionsBuilder = /** @class */ (function () {
    function InstructionsBuilder() {
        this._instructions = null;
        this._element = null;
        this._data = null;
        this._mappers = null;
        this._ni = null;
    }
    /**
     * Build instructions
     * @param element
     * @param data
     * @param mappers
     */
    InstructionsBuilder.prototype.build = function (element, data, mappers) {
        this._instructions = [];
        this._element = element;
        this._data = data;
        this._mappers = mappers;
        this._ni = new NodeInspecter();
        this.buildInstructions(this._element.childNodes);
        console.log(this._instructions);
        return this._instructions;
    };
    InstructionsBuilder.prototype.buildInstructions = function (nodes) {
        var _loop_1 = function () {
            var node = nodes.item(i);
            if (node.nodeType == Node.TEXT_NODE) {
                if (node.nodeValue.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    this_1._instructions.push(new NodeStringInterpolation(node, this_1._data));
                }
            }
            else if (node instanceof HTMLElement) {
                if (this_1._ni.isLoop(node)) {
                    var loop_1 = new LoopInstruction(node, this_1._data);
                    if (this_1._ni.isAttribute(node)) {
                        var attrs = [];
                        this_1._ni.findAttributeInstructions(node, attrs);
                        attrs.forEach(function (attr) {
                            loop_1.addAttribute(attr);
                        });
                    }
                    this_1.buildLoopInstructions(node.childNodes, loop_1, true);
                }
                else if (this_1._ni.isAttribute(node)) {
                    this_1._ni.findAttributeInstructions(node, this_1._instructions, this_1._data);
                }
                else if (node.childElementCount == 0 && node.textContent.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    this_1._instructions.push(new ElementStringInterpolation(node, this_1._data));
                }
                else {
                    this_1.buildInstructions(node.childNodes);
                }
            }
        };
        var this_1 = this;
        for (var i = 0; i < nodes.length; i++) {
            _loop_1();
        }
    };
    /**
     * Build loop instructions - Recursive function
     * @param nodes
     * @param loop
     * @param isParent
     */
    InstructionsBuilder.prototype.buildLoopInstructions = function (nodes, loop, isParent) {
        if (isParent === void 0) { isParent = false; }
        var _loop_2 = function () {
            var node = nodes.item(i);
            if (node.nodeType == Node.TEXT_NODE) {
                if (node.nodeValue.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    loop.addInstruction(new NodeStringInterpolation(node));
                }
            }
            else if (node instanceof HTMLElement) {
                if (this_2._ni.isLoop(node)) {
                    var childLoop_1 = loop.addInstruction(new LoopInstruction(node));
                    if (this_2._ni.isAttribute(node)) {
                        var attrs = [];
                        this_2._ni.findAttributeInstructions(node, attrs);
                        attrs.forEach(function (attr) {
                            childLoop_1.addAttribute(attr);
                        });
                    }
                    this_2.buildLoopInstructions(node.childNodes, childLoop_1, false);
                }
                else if (this_2._ni.isAttribute(node) && !this_2._ni.isLoop(node)) {
                    var attrs = [];
                    this_2._ni.findAttributeInstructions(node, attrs);
                    attrs.forEach(function (attr) {
                        loop.addInstruction(attr);
                    });
                }
                else if (node.childElementCount == 0 && node.textContent.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    loop.addInstruction(new ElementStringInterpolation(node));
                }
                else {
                    this_2.buildLoopInstructions(node.childNodes, loop);
                }
            }
        };
        var this_2 = this;
        for (var i = 0; i < nodes.length; i++) {
            _loop_2();
        }
        if (isParent)
            this._instructions.push(loop);
    };
    return InstructionsBuilder;
}());
/**
    Base Instruction
*/
var Instruction = /** @class */ (function () {
    function Instruction(node, data) {
        this.node = node;
        this._mapped = false;
        this._value = null;
        this._ifStatement = null;
        this._data = data;
    }
    /**
     * Set data
     * @param data
     */
    Instruction.prototype.setData = function (data) {
        this._data = data;
    };
    /**
     * Get data
     */
    Instruction.prototype.getData = function () {
        return this._data;
    };
    Object.defineProperty(Instruction.prototype, "mapped", {
        /**
        * Get mapped
        */
        get: function () {
            return this._mapped;
        },
        /**
         * Set mapped
         * @param bool
         */
        set: function (bool) {
            this._mapped = bool;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Set if statement
     * @param ifStatement
     */
    Instruction.prototype.setIfStatement = function (ifStatement) {
        this._ifStatement = ifStatement;
    };
    /**
     * Set node
     * @param node
     */
    Instruction.prototype.setNode = function (node) {
        this.node = node;
    };
    /**
     * Find value for a specific expression(expression is represented as an array of its segments)
     * @param segments
     * @param data
     * @param index
     */
    Instruction.prototype.findValue = function (segments, data, index) {
        if (index === void 0) { index = 0; }
        if (segments[index] == undefined || data[segments[index]] == undefined)
            return undefined;
        var value = data[segments[index]];
        if (typeof value == 'object')
            return this.findValue(segments, value, ++index);
        else if (typeof value == 'string')
            return value;
        else if (typeof value == 'number')
            return +value;
        else if (typeof value == 'undefined')
            return undefined;
    };
    ;
    /**
     * Find value for a specific expression(expression is represented as an array of its segments)
     * @param segments
     * @param data
     * @param index
     */
    Instruction.prototype.findArray = function (segments, data, index) {
        if (index === void 0) { index = 0; }
        if (segments[index] == undefined || data[segments[index]] == undefined)
            return undefined;
        var value = data[segments[index]];
        if (typeof value == 'object' && !Array.isArray(value))
            return this.findArray(segments, value, ++index);
        else if (Array.isArray(value))
            return value;
        else
            return undefined;
    };
    ;
    /**
     * Init expressions
     * @param index
     */
    Instruction.prototype.initStringInterpolationExpressions = function (value, expressions, index) {
        if (index === void 0) { index = 0; }
        var startIndex = value.indexOf("{{", index);
        var endIndex = value.indexOf("}}", startIndex) + 2;
        if (startIndex < 0 || endIndex < 0)
            return;
        expressions.push({
            expression: value.substr(startIndex, (endIndex - startIndex)),
            value: null
        });
        this.initStringInterpolationExpressions(value, expressions, endIndex);
    };
    ;
    return Instruction;
}());
var StringInterpolationInstruction = /** @class */ (function (_super) {
    __extends(StringInterpolationInstruction, _super);
    function StringInterpolationInstruction(node, data) {
        var _this = _super.call(this, node, data) || this;
        _this._expressions = [];
        return _this;
    }
    ;
    /**
        Setup instruction
     */
    StringInterpolationInstruction.prototype.setup = function (node) {
        var _this = this;
        this._expressions.forEach(function (expr) {
            var segments = expr.expression.replace("{{", "").replace("}}", "").split(".");
            expr.value = _this.findValue(segments, _this._data);
        });
        this.map(node);
    };
    ;
    /**
     * Map instruction
     * @param node
     */
    StringInterpolationInstruction.prototype.map = function (node) {
        var n = node ? node : this.node;
        this._expressions.forEach(function (exp) {
            n.textContent = n.textContent.replace(exp.expression, exp.value);
        });
    };
    return StringInterpolationInstruction;
}(Instruction));
/**
    Node string interpolation
 */
var NodeStringInterpolation = /** @class */ (function (_super) {
    __extends(NodeStringInterpolation, _super);
    function NodeStringInterpolation(node, data) {
        var _this = _super.call(this, node, data) || this;
        _this._value = _this.node.textContent.trim();
        _this.initStringInterpolationExpressions(_this._value, _this._expressions);
        return _this;
    }
    return NodeStringInterpolation;
}(StringInterpolationInstruction));
/**
    Element string interpolation
 */
var ElementStringInterpolation = /** @class */ (function (_super) {
    __extends(ElementStringInterpolation, _super);
    function ElementStringInterpolation(node, data) {
        var _this = _super.call(this, node, data) || this;
        _this._value = _this.node.textContent.trim();
        _this.initStringInterpolationExpressions(_this._value, _this._expressions);
        return _this;
    }
    return ElementStringInterpolation;
}(StringInterpolationInstruction));
/**
    Attribute
 */
var AttributeInstruction = /** @class */ (function (_super) {
    __extends(AttributeInstruction, _super);
    function AttributeInstruction(node, attrName, data) {
        var _this = _super.call(this, node, data) || this;
        _this.node = node;
        _this.attr = {
            name: null,
            htmlName: null,
            expression: null,
            value: null
        };
        _this._isStringInterpolation = false;
        _this._strIterpolationExpressions = [];
        _this.attr = {
            name: attrName,
            htmlName: attrName.substr(1, (attrName.length - 2)),
            expression: _this.node.attributes.getNamedItem(attrName).nodeValue,
            value: null
        };
        return _this;
    }
    /**
        Setup instruction
     */
    AttributeInstruction.prototype.setup = function (node) {
        var _this = this;
        if (this.attr.expression.indexOf("{{") > -1 && this.attr.expression.indexOf("}}") > -1) {
            this._isStringInterpolation = true;
            this.initStringInterpolationExpressions(this.attr.expression, this._strIterpolationExpressions);
            this._strIterpolationExpressions.forEach(function (expr) {
                var segments = expr.expression.replace("{{", "").replace("}}", "").split(".");
                expr.value = _this.findValue(segments, _this._data);
            });
        }
        else {
            var segments = this.attr.expression.split(".");
            this.attr.value = this.findValue(segments, this._data);
        }
        this.map(node);
    };
    /**
        Map instruction to its node or to a specific node
     */
    AttributeInstruction.prototype.map = function (node) {
        var attr = document.createAttribute(this.attr.htmlName);
        var n = node ? node : this.node;
        if (this._isStringInterpolation) {
            var value_1 = n.attributes.getNamedItem(this.attr.name).value;
            this._strIterpolationExpressions.forEach(function (exp) {
                value_1 = value_1.replace(exp.expression, exp.value);
            });
            attr.value = value_1;
        }
        else {
            attr.value = n.attributes.getNamedItem(this.attr.name).value.replace(this.attr.expression, this.attr.value);
        }
        n.attributes.removeNamedItem(this.attr.name);
        n.attributes.setNamedItem(attr);
    };
    return AttributeInstruction;
}(Instruction));
/**
    Node Inspected
 */
var NodeInspecter = /** @class */ (function () {
    function NodeInspecter() {
    }
    /**
     * Check if node representes a lopp
     * @param node
     */
    NodeInspecter.prototype.isLoop = function (node) {
        if (node == null || node.nodeType != Node.ELEMENT_NODE)
            return;
        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes.item(i).name == NodeInspecter.FOR_ATTR)
                return true;
        }
        return false;
    };
    /**
     * Check if node representes an if statement
     * @param node
     */
    NodeInspecter.prototype.isIf = function (node) {
        if (node == null || node.nodeType != Node.ELEMENT_NODE)
            return;
        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes.item(i).name == NodeInspecter.IF_ATTR)
                return true;
        }
        return false;
    };
    /**
     * Check if a node representes a string interpolation
     * @param node
     */
    NodeInspecter.prototype.isStringInterpolation = function (node) {
        if (node.nodeType == Node.TEXT_NODE && node.nodeValue.match(NodeInspecter.STR_INTERPO_REG_EXP))
            return true;
        else if (node.nodeType == Node.ELEMENT_NODE && node.textContent.match(NodeInspecter.STR_INTERPO_REG_EXP))
            return true;
        return false;
    };
    /**
     * Check if a node representes an attribute
     * @param node
     */
    NodeInspecter.prototype.isAttribute = function (node) {
        if (node == null || node.nodeType != node.ELEMENT_NODE)
            return false;
        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes.item(i).name.match(NodeInspecter.ATTR_REG_EXP))
                return true;
        }
        return false;
    };
    /**
     * Check if node has an if statement
     * @param node
     */
    NodeInspecter.prototype.hasIfStatement = function (node) {
        if (node == null || node.nodeType != node.ELEMENT_NODE)
            return false;
        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes.item(i).name.match(NodeInspecter.IF_ATTR))
                return true;
        }
        return false;
    };
    /**
     * Check if node and of its children is str, attr, loopinstruction
     * @param node
     */
    NodeInspecter.prototype.hasNoInstruction = function (node, result) {
        if (result === void 0) { result = true; }
        for (var i = 0; i < node.childNodes.length; i++) {
            var n = node.childNodes.item(i);
            if (this.isStringInterpolation(n) || this.isAttribute(n) || this.isLoop(n))
                return false;
            else
                this.hasNoInstruction(n);
        }
        return result;
    };
    /**
     * find attribute instructions
     * @param node
     * @param instructions
     */
    NodeInspecter.prototype.findAttributeInstructions = function (node, instructions, data) {
        if (node == null || node.nodeType != Node.ELEMENT_NODE)
            return;
        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes.item(i).name.match(NodeInspecter.ATTR_REG_EXP))
                instructions.push(new AttributeInstruction(node, node.attributes.item(i).name, data));
        }
    };
    NodeInspecter.ATTR_REG_EXP = /\[+[a-zA-A0-9\-]+\]/;
    NodeInspecter.STR_INTERPO_REG_EXP = /.*{{.*}}.*/;
    NodeInspecter.FOR_ATTR = "[*for]";
    NodeInspecter.IF_ATTR = "[*if]";
    return NodeInspecter;
}());
/**
    If statement for instructions
 */
var IfStatement = /** @class */ (function () {
    function IfStatement(node) {
        this.node = node;
        this._statement = null;
    }
    IfStatement.prototype.result = function (node) {
        var n = this.node != null ? this.node : node;
        var statement = n.attributes.getNamedItem(NodeInspecter.IF_ATTR).value;
        return eval(statement);
    };
    return IfStatement;
}());
/**
    Loop
 */
var LoopInstruction = /** @class */ (function (_super) {
    __extends(LoopInstruction, _super);
    function LoopInstruction(node, data) {
        var _this = _super.call(this, node, data) || this;
        _this._segments = [];
        _this._params = {
            expression: "",
            arrayName: [],
            varName: ""
        };
        _this._ni = null;
        _this._instructions = [];
        _this._attributes = [];
        var expression = node.attributes.getNamedItem(NodeInspecter.FOR_ATTR).value.trim();
        _this._segments = expression.split(":");
        if (_this._segments.length != 2)
            throw new Error("Loop : Incorrect syntax, it should be like [*for]=\"arrayName:varName\"");
        _this._params = {
            expression: expression,
            arrayName: _this._segments[0].split("."),
            varName: _this._segments[1]
        };
        _this._ni = new NodeInspecter();
        return _this;
    }
    /**
     * Add new node string interpolation to instructions
     * @param instruction
     */
    LoopInstruction.prototype.addInstruction = function (instruction) {
        this._instructions.push(instruction);
        return instruction;
    };
    /**
     * Add attribute to loop, this attribute will be applied to this loop's Element
     * @param attribute
     */
    LoopInstruction.prototype.addAttribute = function (attribute) {
        this._attributes.push(attribute);
        return attribute;
    };
    /**
     * Find a specific node
     * @param nodes
     * @param target
     */
    LoopInstruction.prototype.findNodeString = function (elem, target) {
        for (var i = 0; i < elem.childNodes.length; i++) {
            var node = elem.childNodes.item(i);
            if (node.isEqualNode(target))
                return node;
            if (node instanceof HTMLElement)
                return this.findNodeString(node, target);
        }
    };
    /**
     * Find a specific element
     * @param elems
     * @param target
     */
    LoopInstruction.prototype.findElement = function (container, target) {
        if (container != null && container.isEqualNode(target))
            return container;
        var elems = container.querySelectorAll("*");
        for (var i = 0; i < elems.length; i++) {
            var elem = elems.item(i);
            if (elem.isEqualNode(target)) {
                return elem;
            }
        }
        return null;
    };
    /**
     * Loop through all instructions and execute them
     * @param loopContainer
     * @param parentContainer
     * @param data
     */
    LoopInstruction.prototype.loop = function (loopContainer, parentContainer, data) {
        var _this = this;
        var array = this.findArray(this._params.arrayName, data);
        if (array != undefined) {
            array.forEach(function (item, index) {
                var data = { "#index": index };
                data[_this._params.varName] = item;
                var container = loopContainer.cloneNode(true);
                _this._instructions.forEach(function (instr, index) {
                    if (instr instanceof LoopInstruction) {
                        // find loop's container
                        var elem = _this.findElement(container, instr.node);
                        // prepare data for this loop
                        var data_1 = {};
                        data_1[_this._params.varName] = item;
                        /**
                            Apply loop's attribute instructions
                        */
                        //instr._attributes.forEach((attr) => {
                        //    attr.setData(data);
                        //    attr.setNode(elem);
                        //    attr.setup();
                        //});
                        // loop through all instructions
                        console.log(data_1);
                        instr.loop(elem, container, data_1);
                    }
                    else if (instr instanceof NodeStringInterpolation) {
                        var foundedNode = _this.findNodeString(container, instr.node);
                        instr.setData(data);
                        instr.setup(foundedNode);
                    }
                    else if (instr instanceof ElementStringInterpolation || instr instanceof AttributeInstruction) {
                        var foundedNode = _this.findElement(container, instr.node);
                        instr.setData(data);
                        instr.setup(foundedNode);
                    }
                    instr.mapped = true;
                });
                parentContainer.insertBefore(container, loopContainer);
            });
            loopContainer.remove();
        }
        else {
            var loop = this.findElement(parentContainer, this.node);
            if (loop)
                loop.remove();
        }
    };
    /**
     * Setup instruction
     * @param parent
     */
    LoopInstruction.prototype.setup = function (parent) {
        var container = this.node;
        var pcontainer = parent ? parent : container.parentElement;
        this.loop(container, pcontainer, this._data);
    };
    return LoopInstruction;
}(Instruction));
