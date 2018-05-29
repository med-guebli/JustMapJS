
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
    name: (obj) => {
        return "Are you retard";
    }
};


window.onload = () => {
    Mapper.map($(".medias-test")[0], obj, mappers);
};



/**
    Mapper - used to map json object to a view
 */
class Mapper {
    public static map(element: HTMLElement, obj: any, mappers: any): void {
        let instructions: Array<Instruction> = new InstructionsBuilder().build(element, obj, mappers);

        instructions.forEach((instr) => {
            instr.setup();
        });
    }
}


/**
    Instructions builder
 */
class InstructionsBuilder {

    private _instructions: Array<Instruction> = null;
    private _element: HTMLElement = null;
    private _data: any = null;
    private _mappers: any = null;

    private _ni: NodeInspecter = null;


    /**
     * Build instructions
     * @param element
     * @param data
     * @param mappers
     */
    public build(element: HTMLElement, data: any, mappers: any): Array<Instruction> {
        this._instructions = [];
        this._element = element;
        this._data = data;
        this._mappers = mappers;
        this._ni = new NodeInspecter();

        this.buildInstructions(this._element.childNodes);

        console.log(this._instructions);

        return this._instructions;
    }


    private buildInstructions(nodes: NodeList): void {

        for (var i = 0; i < nodes.length; i++) {
            let node = nodes.item(i);

            if (node.nodeType == Node.TEXT_NODE) {
                if (node.nodeValue.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    this._instructions.push(new NodeStringInterpolation(node, this._data));
                }
            }
            else if (node instanceof HTMLElement) {

                if (this._ni.isLoop(node)) {
                    let loop = new LoopInstruction(node, this._data);

                    if (this._ni.isAttribute(node)) {

                        let attrs: Array<AttributeInstruction> = [];
                        this._ni.findAttributeInstructions(node, attrs);

                        attrs.forEach((attr) => {
                            loop.addAttribute(attr);
                        });
                    }

                    this.buildLoopInstructions(node.childNodes, loop, true);
                }
                else if (this._ni.isAttribute(node)) {
                    this._ni.findAttributeInstructions(node, this._instructions, this._data);
                }
                else if (node.childElementCount == 0 && node.textContent.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    this._instructions.push(new ElementStringInterpolation(node, this._data));
                }
                else {
                    this.buildInstructions(node.childNodes);
                }
            }
        }

    }

    /**
     * Build loop instructions - Recursive function
     * @param nodes
     * @param loop
     * @param isParent
     */
    private buildLoopInstructions(nodes: NodeList, loop: LoopInstruction, isParent: boolean = false): void {

        for (var i = 0; i < nodes.length; i++) {

            let node = nodes.item(i);


            if (node.nodeType == Node.TEXT_NODE) {
                if (node.nodeValue.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    loop.addInstruction(new NodeStringInterpolation(node));
                }
            }
            else if (node instanceof HTMLElement) {
                if (this._ni.isLoop(node)) {
                    let childLoop = <LoopInstruction>loop.addInstruction(new LoopInstruction(node));

                    if (this._ni.isAttribute(node)) {

                        let attrs: Array<AttributeInstruction> = [];

                        this._ni.findAttributeInstructions(node, attrs);
                        attrs.forEach((attr) => {
                            childLoop.addAttribute(attr);
                        });
                    }

                    this.buildLoopInstructions(node.childNodes, childLoop, false);
                }
                else if (this._ni.isAttribute(node) && !this._ni.isLoop(node)) {
                    let attrs: Array<AttributeInstruction> = [];

                    this._ni.findAttributeInstructions(node, attrs);
                    attrs.forEach((attr) => {
                        loop.addInstruction(attr);
                    });
                }
                else if (node.childElementCount == 0 && node.textContent.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    loop.addInstruction(new ElementStringInterpolation(node));
                }
                else {
                    this.buildLoopInstructions(node.childNodes, loop);
                }
            }
        }

        if (isParent)
            this._instructions.push(loop);
    }
}


/**
    Base Instruction
*/


abstract class Instruction {

    protected _data: any;
    protected _mapped: boolean = false;
    protected _value: string = null;
    protected _ifStatement: IfStatement = null;

    constructor(public node: Node, data?: any) {
        this._data = data;
    }

    /**
     * Set data
     * @param data
     */
    public setData(data: any): void {
        this._data = data;
    }

    /**
     * Get data
     */
    public getData(): any {
        return this._data;
    }

    /**
     * Set mapped
     * @param bool
     */
    public set mapped(bool: boolean) {
        this._mapped = bool;
    }

    /**
    * Get mapped
    */
    public get mapped(): boolean {
        return this._mapped;
    }

    /**
     * Set if statement
     * @param ifStatement
     */
    public setIfStatement(ifStatement: IfStatement): void {
        this._ifStatement = ifStatement;
    }

    /**
     * Set node
     * @param node
     */
    public setNode(node: Node): void {
        this.node = node;
    }

    /** Setup instruction*/
    public abstract setup(): void;


    /**
     * Find value for a specific expression(expression is represented as an array of its segments)
     * @param segments
     * @param data
     * @param index
     */
    protected findValue(segments: Array<string>, data: any, index: number = 0): any {

        if (segments[index] == undefined || data[segments[index]] == undefined)
            return undefined;

        let value = data[segments[index]];

        if (typeof value == 'object')
            return this.findValue(segments, value, ++index);

        else if (typeof value == 'string')
            return value;

        else if (typeof value == 'number')
            return +value;

        else if (typeof value == 'undefined')
            return undefined;
    };

    /**
     * Find value for a specific expression(expression is represented as an array of its segments)
     * @param segments
     * @param data
     * @param index
     */
    protected findArray(segments: Array<string>, data: any, index: number = 0): Array<any> {

        if (segments[index] == undefined || data[segments[index]] == undefined)
            return undefined;

        let value = data[segments[index]];


        if (typeof value == 'object' && !Array.isArray(value))
            return this.findArray(segments, value, ++index);

        else if (Array.isArray(value))
            return value;

        else
            return undefined;
    };


    /**
     * Init expressions
     * @param index
     */
    protected initStringInterpolationExpressions(value: string, expressions: Array<IStringInterpolationExpression>, index: number = 0): void {
        let startIndex = value.indexOf("{{", index);
        let endIndex = value.indexOf("}}", startIndex) + 2;

        if (startIndex < 0 || endIndex < 0)
            return;

        expressions.push({
            expression: value.substr(startIndex, (endIndex - startIndex)),
            value: null
        });

        this.initStringInterpolationExpressions(value, expressions, endIndex);
    };
}


/**
    String Interpolation 
 */

interface IStringInterpolationExpression {
    expression: string,
    value: any
}

abstract class StringInterpolationInstruction extends Instruction {

    protected _expressions: Array<IStringInterpolationExpression> = [];

    constructor(node: Node, data?: any) {
        super(node, data);
    };


    /**
        Setup instruction
     */
    public setup(node?: Node): void {

        this._expressions.forEach((expr) => {
            let segments = expr.expression.replace("{{", "").replace("}}", "").split(".");

            expr.value = this.findValue(segments, this._data);
        });

        this.map(node);
    };

    /**
     * Map instruction
     * @param node
     */
    private map(node?: Node): void {
        let n: Node = node ? node : this.node;

        this._expressions.forEach((exp) => {
            n.textContent = n.textContent.replace(exp.expression, exp.value);
        });
    }
}

/**
    Node string interpolation
 */
class NodeStringInterpolation extends StringInterpolationInstruction {

    constructor(node: Node, data?: any) {
        super(node, data);

        this._value = this.node.textContent.trim();
        this.initStringInterpolationExpressions(this._value, this._expressions);
    }
}

/**
    Element string interpolation
 */
class ElementStringInterpolation extends StringInterpolationInstruction {

    constructor(node: Node, data?: any) {
        super(node, data);

        this._value = this.node.textContent.trim();
        this.initStringInterpolationExpressions(this._value, this._expressions);
    }
}


/**
    Attribute
 */

class AttributeInstruction extends Instruction {

    public attr = {
        name: null,
        htmlName: null,
        expression: null,
        value: null
    };

    private _isStringInterpolation: boolean = false;
    private _strIterpolationExpressions: Array<IStringInterpolationExpression> = [];

    constructor(public node: Node, attrName: string, data?: any) {
        super(node, data);

        this.attr = {
            name: attrName,
            htmlName: attrName.substr(1, (attrName.length - 2)),
            expression: this.node.attributes.getNamedItem(attrName).nodeValue,
            value: null
        };
    }

    /**
        Setup instruction
     */
    public setup(node?: Node): void {

        if (this.attr.expression.indexOf("{{") > -1 && this.attr.expression.indexOf("}}") > -1) {

            this._isStringInterpolation = true;
            this.initStringInterpolationExpressions(this.attr.expression, this._strIterpolationExpressions);

            this._strIterpolationExpressions.forEach((expr) => {
                let segments = expr.expression.replace("{{", "").replace("}}", "").split(".");
                expr.value = this.findValue(segments, this._data);
            });
        }
        else {
            let segments = this.attr.expression.split(".");
            this.attr.value = this.findValue(segments, this._data);
        }

        this.map(node);
    }

    /**
        Map instruction to its node or to a specific node
     */
    private map(node?: Node): void {
        let attr: Attr = document.createAttribute(this.attr.htmlName);
        let n = node ? node : this.node;

        if (this._isStringInterpolation) {
            let value: string = n.attributes.getNamedItem(this.attr.name).value;

            this._strIterpolationExpressions.forEach((exp) => {
                value = value.replace(exp.expression, exp.value);
            });

            attr.value = value;
        }

        else {
            attr.value = n.attributes.getNamedItem(this.attr.name).value.replace(this.attr.expression, this.attr.value);
        }

        n.attributes.removeNamedItem(this.attr.name);
        n.attributes.setNamedItem(attr);
    }
}


/**
    Node Inspected
 */
class NodeInspecter {

    public static ATTR_REG_EXP: RegExp = /\[+[a-zA-A0-9\-]+\]/;
    public static STR_INTERPO_REG_EXP: RegExp = /.*{{.*}}.*/;
    public static FOR_ATTR: string = "[*for]";
    public static IF_ATTR: string = "[*if]";

    /**
     * Check if node representes a lopp
     * @param node
     */
    public isLoop(node: Node): boolean {
        if (node == null || node.nodeType != Node.ELEMENT_NODE) return;

        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes.item(i).name == NodeInspecter.FOR_ATTR)
                return true;
        }
        return false;
    }

    /**
     * Check if node representes an if statement
     * @param node
     */
    public isIf(node: Node): boolean {
        if (node == null || node.nodeType != Node.ELEMENT_NODE) return;

        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes.item(i).name == NodeInspecter.IF_ATTR)
                return true;
        }
        return false;
    }

    /**
     * Check if a node representes a string interpolation
     * @param node
     */
    public isStringInterpolation(node: Node): boolean {

        if (node.nodeType == Node.TEXT_NODE && node.nodeValue.match(NodeInspecter.STR_INTERPO_REG_EXP))
            return true;
        else if (node.nodeType == Node.ELEMENT_NODE && node.textContent.match(NodeInspecter.STR_INTERPO_REG_EXP))
            return true;

        return false;
    }

    /**
     * Check if a node representes an attribute
     * @param node
     */
    public isAttribute(node: Node): boolean {
        if (node == null || node.nodeType != node.ELEMENT_NODE)
            return false;

        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes.item(i).name.match(NodeInspecter.ATTR_REG_EXP))
                return true;
        }

        return false;
    }

    /**
     * Check if node has an if statement
     * @param node
     */
    public hasIfStatement(node: Node): boolean {
        if (node == null || node.nodeType != node.ELEMENT_NODE)
            return false;

        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes.item(i).name.match(NodeInspecter.IF_ATTR))
                return true;
        }

        return false;
    }

    /**
     * Check if node and of its children is str, attr, loopinstruction
     * @param node
     */
    public hasNoInstruction(node: Node, result: boolean = true): boolean {

        for (var i = 0; i < node.childNodes.length; i++) {
            let n = node.childNodes.item(i);

            if (this.isStringInterpolation(n) || this.isAttribute(n) || this.isLoop(n))
                return false;
            else
                this.hasNoInstruction(n);
        }

        return result;
    }

    /**
     * find attribute instructions
     * @param node
     * @param instructions
     */
    public findAttributeInstructions(node: Node, instructions: Array<Instruction>, data?: any): void {
        if (node == null || node.nodeType != Node.ELEMENT_NODE)
            return;

        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes.item(i).name.match(NodeInspecter.ATTR_REG_EXP))
                instructions.push(new AttributeInstruction(node, node.attributes.item(i).name, data));
        }
    }
}



/**
    If statement for instructions
 */
class IfStatement {

    private _statement: string = null;

    constructor(public node?: Node) {
    }

    public result(node?: Node): boolean {
        let n = this.node != null ? this.node : node;
        let statement = n.attributes.getNamedItem(NodeInspecter.IF_ATTR).value;

        return eval(statement);
    }
}


/**
    Loop
 */
class LoopInstruction extends Instruction {

    private _segments: Array<string> = [];
    private _params = {
        expression: "",
        arrayName: [],
        varName: ""
    };

    public _ni: NodeInspecter = null;
    public _instructions: Array<Instruction> = [];
    public _attributes: Array<AttributeInstruction> = [];


    constructor(node: Node, data?: any) {
        super(node, data);

        let expression = node.attributes.getNamedItem(NodeInspecter.FOR_ATTR).value.trim();

        this._segments = expression.split(":");

        if (this._segments.length != 2)
            throw new Error("Loop : Incorrect syntax, it should be like [*for]=\"arrayName:varName\"");

        this._params = {
            expression: expression,
            arrayName: this._segments[0].split("."),
            varName: this._segments[1]
        };

        this._ni = new NodeInspecter();
    }


    /**
     * Add new node string interpolation to instructions
     * @param instruction
     */
    public addInstruction(instruction: Instruction): Instruction {
        this._instructions.push(instruction);
        return instruction;
    }

    /**
     * Add attribute to loop, this attribute will be applied to this loop's Element
     * @param attribute
     */
    public addAttribute(attribute: AttributeInstruction): AttributeInstruction {
        this._attributes.push(attribute);
        return attribute;
    }

    /**
     * Find a specific node
     * @param nodes
     * @param target
     */
    public findNodeString(elem: HTMLElement, target: Node): Node {

        for (var i = 0; i < elem.childNodes.length; i++) {
            let node = elem.childNodes.item(i);

            if (node.isEqualNode(target))
                return node;

            if (node instanceof HTMLElement)
                return this.findNodeString(node, target);
        }
    }

    /**
     * Find a specific element
     * @param elems
     * @param target
     */
    public findElement(container: HTMLElement, target: HTMLElement): HTMLElement {
        if (container != null && container.isEqualNode(target))
            return container;

        let elems = container.querySelectorAll("*");
        for (var i = 0; i < elems.length; i++) {
            let elem = <HTMLElement>elems.item(i);

            if (elem.isEqualNode(target)) {
                return elem;
            }
        }
        return null;
    }

    /**
     * Loop through all instructions and execute them
     * @param loopContainer
     * @param parentContainer
     * @param data
     */
    private loop(loopContainer: HTMLElement, parentContainer: HTMLElement, data: any): void {
        let array = this.findArray(this._params.arrayName, data);

        if (array != undefined) {

            array.forEach((item, index) => {

                let data: any = { "#index": index };

                data[this._params.varName] = item

                let container = <HTMLElement>loopContainer.cloneNode(true);

                this._instructions.forEach((instr, index) => {

                    if (instr instanceof LoopInstruction) {
                        // find loop's container
                        let elem: HTMLElement = this.findElement(container, <HTMLElement>instr.node);
                        // prepare data for this loop
                        let data: any = {};
                        data[this._params.varName] = item;

                        /**
                            Apply loop's attribute instructions
                        */
                        //instr._attributes.forEach((attr) => {
                        //    attr.setData(data);
                        //    attr.setNode(elem);
                        //    attr.setup();
                        //});

                        // loop through all instructions
                        console.log(data);
                        instr.loop(elem, container, data);
                    }
                    else if (instr instanceof NodeStringInterpolation) {
                        let foundedNode = this.findNodeString(container, <HTMLElement>instr.node);

                        instr.setData(data);
                        instr.setup(foundedNode);
                    }
                    else if (instr instanceof ElementStringInterpolation || instr instanceof AttributeInstruction) {
                        let foundedNode = this.findElement(container, <HTMLElement>instr.node);

                        instr.setData(data);
                        instr.setup(foundedNode);
                    }

                    instr.mapped = true;
                });

                parentContainer.insertBefore(container, loopContainer);
            });

            loopContainer.remove();

        } else {

            let loop = this.findElement(parentContainer, <HTMLElement>this.node);

            if (loop)
                loop.remove();
        }
    }

    /**
     * Setup instruction
     * @param parent
     */
    public setup(parent?: HTMLElement): void {
        let container: HTMLElement = (<HTMLElement>this.node);
        let pcontainer: HTMLElement = parent ? parent : container.parentElement;

        this.loop(container, pcontainer, this._data);
    }
}
