var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
    JustMap - used to map json object to a view
*/
var JustMap = /** @class */ (function () {
    function JustMap() {
    }
    JustMap.map = function (element, obj, mappers) {
        if (!element || !obj)
            return;
        var instructionsBuilder = new InstructionsBuilder();
        var instructions = instructionsBuilder.build(element, obj, mappers);
        instructions.forEach(function (instr) {
            instr.setup();
        });
        return instructionsBuilder.getMappedElement();
    };
    return JustMap;
}());
/**
    Instructions builder
 */
var InstructionsBuilder = /** @class */ (function () {
    function InstructionsBuilder() {
        this.instructions = null;
        this._element = null;
        this._clone = null;
        this._mappedElements = null;
        this._data = null;
        this._mappers = null;
        this._ni = null;
        ///**
        // * Build attributes for loop || if statement
        // * @param node
        // * @param loop
        // */
        //private buildAttributesForInstruction(node: Node, array: Array<Instruction>, data?: any): void {
        //    let attrs: Array<AttributeInstruction> = [];
        //    this._ni.findAttributeInstructions(node, attrs, data);
        //    attrs.forEach((attr) => {
        //        array.push(attr);
        //    });
        //}
    }
    /**
     * Build instructions
     * @param element
     * @param data
     * @param mappers
     */
    InstructionsBuilder.prototype.build = function (element, data, mappers) {
        this.instructions = [];
        this._element = element;
        this._clone = this._element.cloneNode(true);
        this._data = data;
        this._mappers = mappers;
        this._ni = new NodeInspecter();
        /*
            If this element is a loop
            Create a new LoopInstruction based on a cloned version of this element

            Check whether this element is also an attribute, then build its attributes for [loop.instructions]

            Set mappedElements loop's mapped elements
        */
        if (this._ni.isLoop(element)) {
            var loop = new LoopInstruction(this._clone, this._data);
            this.buildLoopInstructions(this._clone.childNodes, loop, true);
        }
        /**
            If element has an If Statement
            TODO!
        */
        else if (this._ni.hasIfStatement(this._clone)) {
            var ifStatement = new IfStatementInstruction(this._clone, this._data);
            this.buildIfStatementInstructions(this._clone.childNodes, ifStatement, true);
        }
        /**
            Build instructions of this element if it's not a loop or an if statement
        */
        else {
            this.buildInstructions(this._clone.childNodes);
        }
        /**
            If this element has attributes build its attribtues
        */
        if (this._ni.isAttribute(this._clone)) {
            this.instructions.push(this._ni.buildAttributeInstruction(this._clone, this._data));
        }
        return this.instructions;
    };
    /**
        Get mapped element;
     */
    InstructionsBuilder.prototype.getMappedElement = function () {
        return this._clone;
    };
    /**
     * Build instructions - Recursive function
     * @param nodes
     */
    InstructionsBuilder.prototype.buildInstructions = function (nodes) {
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes.item(i);
            if (node.nodeType == Node.TEXT_NODE) {
                if (node.nodeValue.match(NodeInspecter.STR_INTERPO_REG_EXP))
                    this.instructions.push(new NodeStringInterpolation(node, this._data));
            }
            else if (node instanceof HTMLElement) {
                if (this._ni.hasIfStatement(node)) {
                    var ifStatement = new IfStatementInstruction(node, this._data);
                    if (this._ni.isAttribute(node))
                        ifStatement.attribute = this._ni.buildAttributeInstruction(node, this._data);
                    this.buildIfStatementInstructions(node.childNodes, ifStatement, true);
                }
                else if (this._ni.isLoop(node)) {
                    var loop = new LoopInstruction(node, this._data);
                    if (this._ni.isAttribute(node))
                        loop.attribute = this._ni.buildAttributeInstruction(node, this._data);
                    this.buildLoopInstructions(node.childNodes, loop, true);
                }
                else if (node.childElementCount > 0) {
                    this.buildInstructions(node.childNodes);
                }
                if (this._ni.isElementString(node)) {
                    var instr = new ElementStringInterpolation(node, this._data);
                    this.instructions.push(instr);
                    if (this._ni.isAttribute(node))
                        instr.attribute = this._ni.buildAttributeInstruction(node, this._data);
                }
                if (this._ni.isAttribute(node)) {
                    this.instructions.push(this._ni.buildAttributeInstruction(node, this._data));
                }
            }
        }
    };
    /**
     * Build loop instructions - Recursive function
     * @param nodes
     * @param loop
     * @param isParent
     */
    InstructionsBuilder.prototype.buildLoopInstructions = function (nodes, loop, isParent) {
        /**
            Loop through all the NodeList
        */
        if (isParent === void 0) { isParent = false; }
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes.item(i);
            /**
                If node is of type TEXT_NODE
            */
            if (node.nodeType == Node.TEXT_NODE) {
                if (node.nodeValue.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    loop.addInstruction(new NodeStringInterpolation(node));
                }
            }
            /**
                If node is an HTMLElement
            */
            else if (node instanceof HTMLElement) {
                /**
                    If node is an if statement
                    Create a new IfStatementInstruction and it to the loop's instructions
                    Build attributes for this node
                    Build instructions for this IfStatemen
                */
                if (this._ni.hasIfStatement(node)) {
                    var ifStatement = new IfStatementInstruction(node);
                    loop.addInstruction(ifStatement);
                    if (this._ni.isAttribute(node))
                        ifStatement.attribute = this._ni.buildAttributeInstruction(node, this._data);
                    this.buildIfStatementInstructions(node.childNodes, ifStatement);
                }
                /**
                    If node is a loop
                    create a new Loop instruction (child loop)
                    And add it to the current loop (loop)
                    Build attributes for this child loop
                    Build loop instructions for this child loop
                */
                else if (this._ni.isLoop(node)) {
                    var childLoop = new LoopInstruction(node);
                    loop.addInstruction(childLoop);
                    if (this._ni.isAttribute(node))
                        childLoop.attribute = this._ni.buildAttributeInstruction(node, this._data);
                    this.buildLoopInstructions(node.childNodes, childLoop);
                }
                /**
                    If this node doesn't have child elements && its content is a string interpolation expression
                    Create a new ElementStringInterpolation for this node
                    Add it to the loop's instructions
                    Build attributes for this instruction
                */
                else if (node.childElementCount == 0 && node.textContent.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    var instr = new ElementStringInterpolation(node);
                    loop.addInstruction(instr);
                    if (this._ni.isAttribute(node))
                        instr.attribute = this._ni.buildAttributeInstruction(node, this._data);
                }
                /**
                    If this node represents an Attribute
                    Build attributes for this node
                */
                else if (this._ni.isAttribute(node)) {
                    var attribute = this._ni.buildAttributeInstruction(node, this._data);
                    loop.instructions.push(attribute);
                }
                /**
                    If this node has children
                    Run buildLoopInstructions for these children
                */
                if (node.childElementCount > 0 && !this._ni.isLoop(node) && !this._ni.hasIfStatement(node)) {
                    this.buildLoopInstructions(node.childNodes, loop);
                }
            }
        }
        /**
            If this loop is a parent
            Add it to Instructions
        */
        if (isParent)
            this.instructions.push(loop);
    };
    /**
     * Build IfStatement instructions
     * @param nodes
     */
    InstructionsBuilder.prototype.buildIfStatementInstructions = function (nodes, ifStatement, isParent) {
        /**
            Loop through all nodes
        */
        if (isParent === void 0) { isParent = false; }
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes.item(i);
            /**
                if node is a TEXT, create a new NodeStringInterpolation
            */
            if (node.nodeType == Node.TEXT_NODE) {
                if (node.nodeValue.match(NodeInspecter.STR_INTERPO_REG_EXP))
                    ifStatement.addInstruction(new NodeStringInterpolation(node));
            }
            /**
                If node is an HTMLElement
            */
            else if (node instanceof HTMLElement) {
                if (this._ni.hasIfStatement(node)) {
                    var childIfStatement = new IfStatementInstruction(node);
                    ifStatement.addInstruction(childIfStatement);
                    if (this._ni.isAttribute(node))
                        childIfStatement.attribute = this._ni.buildAttributeInstruction(node, this._data);
                    if (this._ni.isLoop(node)) {
                        var loop = new LoopInstruction(node, node.parentElement);
                        childIfStatement.addInstruction(loop);
                        this.buildLoopInstructions(node.childNodes, loop);
                    }
                    this.buildIfStatementInstructions(node.childNodes, childIfStatement);
                }
                else if (this._ni.isLoop(node)) {
                    var loop = new LoopInstruction(node, node.parentElement);
                    ifStatement.addInstruction(loop);
                    if (this._ni.isAttribute(node))
                        loop.attribute = this._ni.buildAttributeInstruction(node, this._data);
                    this.buildLoopInstructions(node.childNodes, loop);
                }
                else if (node.childElementCount == 0 && node.textContent.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    var instr = new ElementStringInterpolation(node);
                    ifStatement.addInstruction(instr);
                    if (this._ni.isAttribute(node))
                        instr.attribute = this._ni.buildAttributeInstruction(node, this._data);
                }
                else if (this._ni.isAttribute(node)) {
                    var attribute = this._ni.buildAttributeInstruction(node, this._data);
                    ifStatement.instructions.push(this._ni.buildAttributeInstruction(node, this._data));
                }
                if (node.childElementCount > 0 && !this._ni.isLoop(node) && !this._ni.hasIfStatement(node)) {
                    this.buildIfStatementInstructions(node.childNodes, ifStatement);
                }
            }
        }
        if (isParent)
            this.instructions.push(ifStatement);
    };
    return InstructionsBuilder;
}());
/**
    Base Instruction
*/
var Instruction = /** @class */ (function () {
    function Instruction(node, data) {
        this.node = node;
        this._value = null;
        this.nodeClone = null;
        this._data = data;
        this.nodeClone = node.cloneNode(true);
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
    /**
     * Get node clone
     * */
    Instruction.prototype.getNodeClone = function () {
        return this.nodeClone;
    };
    /**
    * Find a specific node
    * @param nodes
    * @param target
    */
    Instruction.prototype.findNodeString = function (elem, target) {
        var res = null;
        function find(elem, target) {
            for (var i = 0; i < elem.childNodes.length; i++) {
                var node = elem.childNodes.item(i);
                if (node.isEqualNode(target)) {
                    res = node;
                    break;
                }
                if (node instanceof HTMLElement)
                    find(node, target);
            }
        }
        ;
        find(elem, target);
        return res;
    };
    /**
     * Find a specific element
     * @param elems
     * @param target
     */
    Instruction.prototype.findElement = function (container, target) {
        if (container.isEqualNode(target))
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
     * Set node
     * @param node
     */
    Instruction.prototype.setNode = function (node) {
        this.node = node;
    };
    /**
        Prepare data environement
     */
    Instruction.prototype.prepareDataEnvironment = function (data) {
        var params = [];
        var values = [];
        for (var key in data) {
            params.push(key);
            var pData = data[key];
            var value = null;
            if (typeof pData == 'object')
                value = JSON.stringify(pData);
            else if (typeof pData == 'string')
                value = "`" + pData + "`";
            else if (typeof pData == 'number')
                value = pData;
            values.push(value);
        }
        return {
            params: params.join(", "),
            values: values.join(", ")
        };
    };
    /**
     * Execute a statement to get the returned value
     * @param statement
     * @param data
     * @param index
     */
    Instruction.prototype.findValue = function (statement, data, index) {
        if (index === void 0) { index = 0; }
        var dataEnv = this.prepareDataEnvironment(data);
        var func = "(function(" + dataEnv.params + "){ return " + statement + " })(" + dataEnv.values + ");";
        try {
            var value = eval(func);
            if (typeof value == 'object' || typeof value == "string")
                return value;
            else if (typeof value == 'number') {
                return +value;
            }
            else {
                return undefined;
            }
        }
        catch (ex) {
            console.log(ex);
        }
    };
    ;
    /**
     * Find value for a specific expression(expression is represented as an array of its segments)
     * @param segments
     * @param data
     * @param index
     */
    Instruction.prototype.findArray = function (statement, data) {
        var dataEnv = this.prepareDataEnvironment(data);
        var func = "(function(" + dataEnv.params + "){ return " + statement + " })(" + dataEnv.values + ");";
        try {
            var array = eval(func);
            if (Array.isArray(array)) {
                return array;
            }
            return undefined;
        }
        catch (_a) {
            if (dataEnv.params == "")
                console.error(func);
        }
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
            instruction: value.substr(startIndex, (endIndex - startIndex)),
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
        _this.expressions = [];
        return _this;
    }
    ;
    /**
        Setup instruction
     */
    StringInterpolationInstruction.prototype.setup = function () {
        var _this = this;
        this.expressions.forEach(function (expr) {
            var instruction = expr.instruction.replace("{{", "").replace("}}", "");
            expr.value = _this.findValue(instruction, _this._data);
        });
        this.map();
    };
    ;
    /**
     * Map instruction
     * @param node
     */
    StringInterpolationInstruction.prototype.map = function () {
        var _this = this;
        this.expressions.forEach(function (exp) {
            if (_this.node instanceof HTMLElement)
                _this.node.innerHTML = _this.node.innerHTML.replace(exp.instruction, exp.value);
            else
                _this.node.textContent = _this.node.textContent.replace(exp.instruction, exp.value);
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
        _this.initStringInterpolationExpressions(_this._value, _this.expressions);
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
        _this.attribute = null;
        _this._value = _this.node.textContent.trim();
        _this.initStringInterpolationExpressions(_this._value, _this.expressions);
        return _this;
    }
    /**
     * Add attribute to element
     * @param attr
     */
    ElementStringInterpolation.prototype.setAttribute = function (attr) {
        this.attribute = attr;
    };
    /**
        Setup instruction
     */
    ElementStringInterpolation.prototype.setup = function () {
        var _this = this;
        this.expressions.forEach(function (expr) {
            var instruction = expr.instruction.replace("{{", "").replace("}}", "");
            expr.value = _this.findValue(instruction, _this._data);
        });
        if (this.attribute != null) {
            this.attribute.setNode(this.node);
            this.attribute.setData(this._data);
            this.attribute.setup();
        }
        this.map();
    };
    ;
    return ElementStringInterpolation;
}(StringInterpolationInstruction));
/**
    Attribute
 */
var AttributeInstruction = /** @class */ (function (_super) {
    __extends(AttributeInstruction, _super);
    function AttributeInstruction(node, data) {
        var _this = _super.call(this, node, data) || this;
        _this.node = node;
        _this.attributes = [];
        return _this;
    }
    AttributeInstruction.prototype.addAttribute = function (attr) {
        this.attributes.push(attr);
    };
    Object.defineProperty(AttributeInstruction.prototype, "element", {
        get: function () {
            return this.node;
        },
        enumerable: true,
        configurable: true
    });
    AttributeInstruction.prototype.setup = function () {
        var _this = this;
        this.attributes.forEach(function (attr) {
            attr.apply(_this.node);
        });
    };
    return AttributeInstruction;
}(Instruction));
var Attribute = /** @class */ (function () {
    function Attribute(instr, attrName) {
        this.instr = instr;
        this.attr = {
            name: "",
            htmlName: "",
            instruction: "",
            value: null
        };
        this._isStringInterpolation = false;
        this._strIterpolationExpressions = [];
        this.attr = {
            name: attrName,
            htmlName: attrName.substr(1, (attrName.length - 2)),
            instruction: this.instr.element.attributes.getNamedItem(attrName).nodeValue,
            value: null
        };
    }
    /**
        Apply attribute
     */
    Attribute.prototype.apply = function (node) {
        var _this = this;
        if (this.attr.instruction.indexOf("{{") > -1 && this.attr.instruction.indexOf("}}") > -1) {
            this._isStringInterpolation = true;
            this.instr.initStringInterpolationExpressions(this.attr.instruction, this._strIterpolationExpressions);
            this._strIterpolationExpressions.forEach(function (expr) {
                var instruction = expr.instruction.replace("{{", "").replace("}}", "");
                expr.value = _this.instr.findValue(instruction, _this.instr.getData());
            });
        }
        else {
            this.attr.value = this.instr.findValue(this.attr.instruction, this.instr.getData());
        }
        this.map(node);
    };
    /**
        Map attribute
     */
    Attribute.prototype.map = function (node) {
        var attr = document.createAttribute(this.attr.htmlName);
        var element = node;
        if (element.attributes.getNamedItem(this.attr.name)) {
            if (this._isStringInterpolation) {
                var value_1 = element.attributes.getNamedItem(this.attr.name).value;
                this._strIterpolationExpressions.forEach(function (exp) {
                    value_1 = value_1.replace(exp.instruction, exp.value);
                });
                attr.value = value_1;
            }
            else {
                attr.value = element.attributes.getNamedItem(this.attr.name).value.replace(this.attr.instruction, this.attr.value);
            }
        }
        element.attributes.setNamedItem(attr);
        //node.attributes.removeNamedItem(this.attr.name);
    };
    return Attribute;
}());
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
        var element = node;
        for (var i = 0; i < element.attributes.length; i++) {
            if (element.attributes.item(i).name === NodeInspecter.FOR_ATTR)
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
        var element = node;
        for (var i = 0; i < element.attributes.length; i++) {
            if (element.attributes.item(i).name.match(NodeInspecter.ATTR_REG_EXP))
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
        var element = node;
        for (var i = 0; i < element.attributes.length; i++) {
            if (element.attributes.item(i).name === NodeInspecter.IF_ATTR)
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
    NodeInspecter.prototype.buildAttributeInstruction = function (node, data) {
        if (node == null || node.nodeType != Node.ELEMENT_NODE)
            return;
        var element = node;
        var instr = new AttributeInstruction(node, data);
        for (var i = 0; i < element.attributes.length; i++) {
            if (element.attributes.item(i).name.match(NodeInspecter.ATTR_REG_EXP))
                instr.addAttribute(new Attribute(instr, element.attributes.item(i).name));
        }
        return instr;
    };
    /**
     * Check if a node is an element string interpolation
     * @param node
     */
    NodeInspecter.prototype.isElementString = function (node) {
        return (node.childElementCount == 0 && node.textContent.match(NodeInspecter.STR_INTERPO_REG_EXP) != null);
    };
    /**
     * Check if a node is only an attribute instruction
     * @param node
     */
    NodeInspecter.prototype.isOnlyAttribute = function (node) {
        return (this.isAttribute(node) && !this.hasIfStatement(node) && !this.isLoop(node) && !this.isElementString(node));
    };
    NodeInspecter.ATTR_REG_EXP = /\[+[a-zA-A0-9\-]+\]/;
    NodeInspecter.STR_INTERPO_REG_EXP = /.*{{.*}}.*/;
    NodeInspecter.FOR_ATTR = "[*for]";
    NodeInspecter.IF_ATTR = "[*if]";
    return NodeInspecter;
}());
/**
    If statement instruction for elements
 */
var IfStatementInstruction = /** @class */ (function (_super) {
    __extends(IfStatementInstruction, _super);
    function IfStatementInstruction(node, data) {
        var _this = _super.call(this, node, data) || this;
        _this.attribute = null;
        _this.instructions = [];
        _this.statement = null;
        _this.statement = _this.element.attributes.getNamedItem(NodeInspecter.IF_ATTR).value;
        return _this;
    }
    Object.defineProperty(IfStatementInstruction.prototype, "element", {
        get: function () {
            return this.node;
        },
        enumerable: true,
        configurable: true
    });
    IfStatementInstruction.prototype.setup = function () {
        var _this = this;
        var elem = this.node;
        if (this.evaluate()) {
            this.instructions.forEach(function (instr, i) {
                var nestedNode = _this.findNodeString(elem, instr.getNodeClone()) || _this.findElement(elem, instr.getNodeClone());
                instr.setNode(nestedNode);
                instr.setData(_this._data);
                instr.setup();
            });
            if (this.attribute) {
                this.attribute.setNode(this.node);
                this.attribute.setData(this._data);
                this.attribute.setup();
            }
            elem.removeAttribute(NodeInspecter.IF_ATTR);
        }
        else {
            elem.remove();
        }
    };
    /**
        Evaluate if statement
     */
    IfStatementInstruction.prototype.evaluate = function () {
        var data = this.prepareDataEnvironment(this._data);
        var func = "(function(" + data.params + "){ return " + this.statement + " })(" + data.values + ");";
        return eval(func);
    };
    /**
     * Add a new instruction
     * @param instr
     */
    IfStatementInstruction.prototype.addInstruction = function (instr) {
        this.instructions.push(instr);
        return instr;
    };
    /**
     * Add a new attribute
     * @param attrInstr
     */
    IfStatementInstruction.prototype.setAttribute = function (attr) {
        this.attribute = attr;
    };
    return IfStatementInstruction;
}(Instruction));
/**
    Loop
 */
var LoopInstruction = /** @class */ (function (_super) {
    __extends(LoopInstruction, _super);
    function LoopInstruction(node, data) {
        var _this = _super.call(this, node, data) || this;
        _this._shape = null;
        _this._render = null;
        _this._segments = [];
        _this._params = {
            statement: "",
            loopExpression: "",
            wrap: false,
            varName: ""
        };
        _this._ni = null;
        _this.instructions = [];
        _this.instructionsToApply = [];
        _this.attribute = null;
        _this.init();
        _this.clone();
        return _this;
    }
    LoopInstruction.prototype.clone = function () {
        this._render = this.node.cloneNode();
    };
    Object.defineProperty(LoopInstruction.prototype, "element", {
        get: function () {
            return this.node;
        },
        enumerable: true,
        configurable: true
    });
    /**
        Init
     */
    LoopInstruction.prototype.init = function () {
        var expression = this.element.attributes.getNamedItem(NodeInspecter.FOR_ATTR).value.trim().split("|");
        var loopExpression = expression[0];
        var option = expression[1];
        this._segments = loopExpression.split(":");
        this._params = {
            statement: this._segments[0],
            loopExpression: loopExpression,
            wrap: option == "wrap" ? true : false,
            varName: this._segments[1]
        };
        if (this._params.varName == "$index")
            throw new Error("Loops can't export \"$index\" var name, it's a reserved keyword.");
        this._ni = new NodeInspecter();
        /**
            Remove loop attribute
        */
        this.element.attributes.removeNamedItem(NodeInspecter.FOR_ATTR);
    };
    /**
     * Add new node string interpolation to instructions
     * @param instruction
     */
    LoopInstruction.prototype.addInstruction = function (instruction) {
        this.instructions.push(instruction);
        return instruction;
    };
    /**
     * Set attribute to loop, this attribute will be applied to this loop's Element
     * @param attribute
     */
    LoopInstruction.prototype.setAttribute = function (attribute) {
        this.attribute = attribute;
    };
    /**
     * Loop through all instructions and execute them
     * @param loopContainer
     * @param parentContainer
     * @param data
     */
    LoopInstruction.prototype.loop = function (data) {
        var _this = this;
        var array = this.findArray(this._params.statement, data);
        if (array != undefined) {
            array.forEach(function (item, index) {
                var instrs = [];
                if (Array.isArray(item)) {
                    data[_this._params.varName] = {
                        array: item,
                        $index: index
                    };
                }
                else {
                    data[_this._params.varName] = item;
                    data[_this._params.varName]["$index"] = index;
                }
                var shape = _this.node.cloneNode(true);
                _this.instructions.forEach(function (instr, index) {
                    var node = _this.findElement(shape, instr.getNodeClone()) || _this.findNodeString(shape, instr.getNodeClone());
                    var newInstr = null;
                    if (instr instanceof IfStatementInstruction) {
                        var ifInstr = new IfStatementInstruction(node, data);
                        ifInstr.instructions = instr.instructions;
                        ifInstr.attribute = instr.attribute;
                        newInstr = ifInstr;
                    }
                    else if (instr instanceof LoopInstruction) {
                        instr.setNode(node);
                        instr.clone();
                        instr.loop(data);
                    }
                    else if (instr instanceof NodeStringInterpolation) {
                        newInstr = new NodeStringInterpolation(node, data);
                    }
                    else if (instr instanceof ElementStringInterpolation) {
                        newInstr = new ElementStringInterpolation(node, data);
                        newInstr.setData(data);
                    }
                    else if (instr instanceof AttributeInstruction) {
                        var attrInstr = new AttributeInstruction(node, data);
                        attrInstr.attributes = instr.attributes;
                        newInstr = attrInstr;
                    }
                    if (newInstr != null)
                        instrs.push(newInstr);
                });
                /**
                 * Apply instructions
                 * */
                instrs.forEach(function (instr) {
                    instr.setup();
                });
                /**
                    Insert content
                */
                if (_this._params.wrap)
                    _this.node.parentElement.insertBefore(shape, _this.node);
                else
                    _this._render.innerHTML += shape.innerHTML;
            });
            /**
             * If element is wraped, then remove it
             * */
            if (this._params.wrap) {
                var elemToRemove = this.findElement(this.node, this.getNodeClone());
                if (elemToRemove != null)
                    elemToRemove.remove();
            }
            this.node.innerHTML = this._render.innerHTML;
        }
    };
    /**
     * Setup instruction
     * @param parent
     */
    LoopInstruction.prototype.setup = function () {
        this.loop(this._data);
    };
    return LoopInstruction;
}(Instruction));
//# sourceMappingURL=justMapJS.js.map