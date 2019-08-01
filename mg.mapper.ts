

let data = {

    users: [

        {
            username: "GUEBLI",
            photos: ["https://loremflickr.com/100/100/14", "https://loremflickr.com/100/100/5", "https://loremflickr.com/100/100/6", "https://loremflickr.com/100/100/75"]
        },

        {
            username: "LAUBACHER"
        }

    ]

};

window.onload = function () {

    let element = document.getElementById("model");
    let mappedElement = Mapper.map(element, data);

    document.body.append(mappedElement);

    element.remove();
}



/**
    Mapper - used to map json object to a view
*/
class Mapper {

    public static map(element: HTMLElement, obj: any, mappers?: any): HTMLElement {
        if (!element || !obj)
            return;

        let instructionsBuilder = new InstructionsBuilder();

        let instructions = instructionsBuilder.build(element, obj, mappers);

        instructions.forEach((instr) => {
            instr.setup();
        });

        return instructionsBuilder.getMappedElement();
    }
}


/**
    Instructions builder
 */
class InstructionsBuilder {

    private instructions: Array<Instruction> = null;
    private _element: HTMLElement = null;
    private _clone: HTMLElement = null;
    private _mappedElements: Array<HTMLElement> = null;

    private _data: any = null;
    private _mappers: any = null;
    private _ni: NodeInspecter = null;


    /**
     * Build instructions
     * @param element
     * @param data
     * @param mappers
     */
    public build(element: HTMLElement, data: any, mappers?: any): Array<Instruction> {
        this.instructions = [];
        this._element = element;
        this._clone = this._element.cloneNode(true) as HTMLElement;

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
            let loop = new LoopInstruction(this._clone, this._data);
            this.buildLoopInstructions(this._clone.childNodes, loop, true);
        }

        /**
            If element has an If Statement
            TODO!
        */

        else if (this._ni.hasIfStatement(this._clone)) {
            let ifStatement = new IfStatementInstruction(this._clone, this._data);
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
    }


    /**
        Get mapped element;
     */
    public getMappedElement(): HTMLElement {
        return this._clone;
    }


    /**
     * Build instructions - Recursive function
     * @param nodes
     */
    private buildInstructions(nodes: NodeList): void {

        for (var i = 0; i < nodes.length; i++) {
            let node = nodes.item(i);

            if (node.nodeType == Node.TEXT_NODE) {

                if (node.nodeValue.match(NodeInspecter.STR_INTERPO_REG_EXP))
                    this.instructions.push(new NodeStringInterpolation(node, this._data));

            }

            else if (node instanceof HTMLElement) {

                if (this._ni.hasIfStatement(node)) {
                    let ifStatement = new IfStatementInstruction(node, this._data);

                    if (this._ni.isAttribute(node))
                        ifStatement.attribute = this._ni.buildAttributeInstruction(node, this._data);

                    this.buildIfStatementInstructions(node.childNodes, ifStatement, true);
                }

                else if (this._ni.isLoop(node)) {
                    let loop = new LoopInstruction(node, this._data);

                    if (this._ni.isAttribute(node))
                        loop.attribute = this._ni.buildAttributeInstruction(node, this._data);

                    this.buildLoopInstructions(node.childNodes, loop, true);
                }

                else if (node.childElementCount > 0) {
                    this.buildInstructions(node.childNodes);
                }


                if (this._ni.isElementString(node)) {
                    let instr = new ElementStringInterpolation(node, this._data);
                    this.instructions.push(instr);

                    if (this._ni.isAttribute(node))
                        instr.attribute = this._ni.buildAttributeInstruction(node, this._data);
                }


                if (this._ni.isAttribute(node)) {
                    this.instructions.push(this._ni.buildAttributeInstruction(node, this._data));
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

        /**
            Loop through all the NodeList
        */

        for (var i = 0; i < nodes.length; i++) {

            let node = nodes.item(i);

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
                    let ifStatement = new IfStatementInstruction(node);
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
                    let childLoop = new LoopInstruction(node);
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
                    let instr = new ElementStringInterpolation(node);
                    loop.addInstruction(instr);

                    if (this._ni.isAttribute(node))
                        instr.attribute = this._ni.buildAttributeInstruction(node, this._data);
                }


                /**
                    If this node represents an Attribute
                    Build attributes for this node
                */
                else if (this._ni.isAttribute(node)) {
                    let attribute = this._ni.buildAttributeInstruction(node, this._data);
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
    }


    /**
     * Build IfStatement instructions
     * @param nodes
     */
    private buildIfStatementInstructions(nodes: NodeList, ifStatement: IfStatementInstruction, isParent: boolean = false): void {

        /**
            Loop through all nodes
        */

        for (var i = 0; i < nodes.length; i++) {
            let node = nodes.item(i);


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

                    let childIfStatement = new IfStatementInstruction(node);
                    ifStatement.addInstruction(childIfStatement);

                    if (this._ni.isAttribute(node))
                        childIfStatement.attribute = this._ni.buildAttributeInstruction(node, this._data);

                    if (this._ni.isLoop(node)) {
                        let loop = new LoopInstruction(node, node.parentElement);
                        childIfStatement.addInstruction(loop);
                        this.buildLoopInstructions(node.childNodes, loop);
                    }

                    this.buildIfStatementInstructions(node.childNodes, childIfStatement);
                }

                else if (this._ni.isLoop(node)) {
                    let loop = new LoopInstruction(node, node.parentElement);
                    ifStatement.addInstruction(loop);

                    if (this._ni.isAttribute(node))
                        loop.attribute = this._ni.buildAttributeInstruction(node, this._data);

                    this.buildLoopInstructions(node.childNodes, loop);
                }
                else if (node.childElementCount == 0 && node.textContent.match(NodeInspecter.STR_INTERPO_REG_EXP)) {
                    let instr = new ElementStringInterpolation(node);
                    ifStatement.addInstruction(instr);

                    if (this._ni.isAttribute(node))
                        instr.attribute = this._ni.buildAttributeInstruction(node, this._data);
                }


                else if (this._ni.isAttribute(node)) {

                    let attribute = this._ni.buildAttributeInstruction(node, this._data);
                    ifStatement.instructions.push(this._ni.buildAttributeInstruction(node, this._data));
                }


                if (node.childElementCount > 0 && !this._ni.isLoop(node) && !this._ni.hasIfStatement(node)) {
                    this.buildIfStatementInstructions(node.childNodes, ifStatement);
                }
            }
        }

        if (isParent)
            this.instructions.push(ifStatement);
    }

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
    Base Instruction
*/


abstract class Instruction {

    protected _data: any;
    protected _value: string = null;

    protected nodeClone: Node = null;

    constructor(public node: Node, data?: any) {
        this._data = data;
        this.nodeClone = node.cloneNode(true);
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
     * Get node clone
     * */
    public getNodeClone(): Node {
        return this.nodeClone;
    }

    /**
    * Find a specific node
    * @param nodes
    * @param target
    */

    protected findNodeString(elem: HTMLElement, target: Node): Node {
        let res: Node = null;

        function find(elem: HTMLElement, target: Node) {
            for (var i = 0; i < elem.childNodes.length; i++) {
                let node = elem.childNodes.item(i);

                if (node.isEqualNode(target)) {
                    res = node;
                    break;
                }

                if (node instanceof HTMLElement)
                    find(node, target);
            }
        };

        find(elem, target);

        return res;
    }


    /**
     * Find a specific element
     * @param elems
     * @param target
     */
    protected findElement(container: HTMLElement, target: HTMLElement): HTMLElement {
        if (container.isEqualNode(target))
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
     * Set node
     * @param node
     */
    public setNode(node: Node): void {
        this.node = node;
    }

    /** Setup instruction*/
    public abstract setup(node?: Node): void;



    /**
        Prepare data environement
     */
    protected prepareDataEnvironment(data: any): { params: string, values: any } {
        let params = [];
        let values = [];


        for (var key in data) {
            params.push(key);

            let pData = data[key];
            let value = null;

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

    }


    /**
     * Execute a statement to get the returned value
     * @param statement
     * @param data
     * @param index
     */
    public findValue(statement: string, data: any, index: number = 0): any {
        let dataEnv = this.prepareDataEnvironment(data);
        let func = "(function(" + dataEnv.params + "){ return " + statement + " })(" + dataEnv.values + ");";

        try {
            let value = eval(func);

            if (typeof value == 'object' || typeof value == "string")
                return value;
            else if (typeof value == 'number') {
                return +value;
            }
            else {
                return undefined;
            }

        } catch (ex) {
            console.log(ex);
        }
    };

    /**
     * Find value for a specific expression(expression is represented as an array of its segments)
     * @param segments
     * @param data
     * @param index
     */
    protected findArray(statement: string, data: any): Array<any> {

        let dataEnv = this.prepareDataEnvironment(data);
        let func = "(function(" + dataEnv.params + "){ return " + statement + " })(" + dataEnv.values + ");";

        try {
            let array = eval(func);

            if (Array.isArray(array)) {
                return array;
            }

            return undefined;
        }
        catch{
            if (dataEnv.params == "")
                console.error(func);
        }
    };


    /**
     * Init expressions
     * @param index
     */
    public initStringInterpolationExpressions(value: string, expressions: Array<IStringInterpolationInstruction>, index: number = 0): void {
        let startIndex = value.indexOf("{{", index);
        let endIndex = value.indexOf("}}", startIndex) + 2;

        if (startIndex < 0 || endIndex < 0)
            return;

        expressions.push({
            instruction: value.substr(startIndex, (endIndex - startIndex)),
            value: null
        });

        this.initStringInterpolationExpressions(value, expressions, endIndex);
    };
}


/**
    String Interpolation 
 */

interface IStringInterpolationInstruction {
    instruction: string,
    value: any
}

abstract class StringInterpolationInstruction extends Instruction {

    protected expressions: Array<IStringInterpolationInstruction> = [];

    constructor(node: Node, data?: any) {
        super(node, data);
    };

    /**
        Setup instruction
     */
    public setup(): void {

        this.expressions.forEach((expr) => {
            let instruction = expr.instruction.replace("{{", "").replace("}}", "");

            expr.value = this.findValue(instruction, this._data);
        });

        this.map();
    };

    /**
     * Map instruction
     * @param node
     */
    protected map(): void {
        this.expressions.forEach((exp) => {
            if (this.node instanceof HTMLElement)
                this.node.innerHTML = this.node.innerHTML.replace(exp.instruction, exp.value);
            else
                this.node.textContent = this.node.textContent.replace(exp.instruction, exp.value);
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
        this.initStringInterpolationExpressions(this._value, this.expressions);
    }
}

/**
    Element string interpolation
 */
class ElementStringInterpolation extends StringInterpolationInstruction {


    public attribute: AttributeInstruction = null;

    constructor(node: Node, data?: any) {
        super(node, data);

        this._value = this.node.textContent.trim();
        this.initStringInterpolationExpressions(this._value, this.expressions);
    }

    /**
     * Add attribute to element
     * @param attr
     */
    public setAttribute(attr: AttributeInstruction): void {
        this.attribute = attr;
    }


    /**
        Setup instruction
     */
    public setup(): void {

        this.expressions.forEach((expr) => {
            let instruction = expr.instruction.replace("{{", "").replace("}}", "");

            expr.value = this.findValue(instruction, this._data);
        });

        if (this.attribute != null) {
            this.attribute.setNode(this.node);
            this.attribute.setData(this._data);
            this.attribute.setup();
        }

        this.map();
    };
}


/**
    Attribute
 */


class AttributeInstruction extends Instruction {

    public attributes: Array<Attribute> = [];

    constructor(public node: Node, data?: any) {
        super(node, data);
    }


    public addAttribute(attr: Attribute): void {
        this.attributes.push(attr);
    }

    get element(): HTMLElement {
        return this.node as HTMLElement;
    }

    public setup(): void {

        this.attributes.forEach(attr => {
            attr.apply(this.node);
        });
    }
}


class Attribute {

    public attr = {
        name: "",
        htmlName: "",
        instruction: "",
        value: null
    };

    private _isStringInterpolation: boolean = false;
    private _strIterpolationExpressions: Array<IStringInterpolationInstruction> = [];

    constructor(public instr: AttributeInstruction, attrName: string) {
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
    public apply(node: Node): void {

        if (this.attr.instruction.indexOf("{{") > -1 && this.attr.instruction.indexOf("}}") > -1) {

            this._isStringInterpolation = true;
            this.instr.initStringInterpolationExpressions(this.attr.instruction, this._strIterpolationExpressions);

            this._strIterpolationExpressions.forEach((expr) => {
                let instruction = expr.instruction.replace("{{", "").replace("}}", "");
                expr.value = this.instr.findValue(instruction, this.instr.getData());
            });
        }
        else {
            this.attr.value = this.instr.findValue(this.attr.instruction, this.instr.getData());
        }

        this.map(node);
    }

    /**
        Map attribute 
     */
    private map(node: Node): void {

        let attr: Attr = document.createAttribute(this.attr.htmlName);

        let element = node as HTMLElement;

        if (element.attributes.getNamedItem(this.attr.name)) {
            if (this._isStringInterpolation) {
                let value: string = element.attributes.getNamedItem(this.attr.name).value;

                this._strIterpolationExpressions.forEach((exp) => {
                    value = value.replace(exp.instruction, exp.value);
                });

                attr.value = value;
            }

            else {
                attr.value = element.attributes.getNamedItem(this.attr.name).value.replace(this.attr.instruction, this.attr.value);
            }
        }

        element.attributes.setNamedItem(attr);
        //node.attributes.removeNamedItem(this.attr.name);
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

        let element = node as HTMLElement;

        for (var i = 0; i < element.attributes.length; i++) {
            if (element.attributes.item(i).name === NodeInspecter.FOR_ATTR)
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

        let element = node as HTMLElement;

        for (var i = 0; i < element.attributes.length; i++) {
            if (element.attributes.item(i).name.match(NodeInspecter.ATTR_REG_EXP))
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

        let element = node as HTMLElement;

        for (var i = 0; i < element.attributes.length; i++) {
            if (element.attributes.item(i).name === NodeInspecter.IF_ATTR)
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
    public buildAttributeInstruction(node: Node, data?: any): AttributeInstruction {
        if (node == null || node.nodeType != Node.ELEMENT_NODE)
            return;

        let element = node as HTMLElement;
        let instr = new AttributeInstruction(node, data);

        for (var i = 0; i < element.attributes.length; i++) {
            if (element.attributes.item(i).name.match(NodeInspecter.ATTR_REG_EXP))
                instr.addAttribute(new Attribute(instr, element.attributes.item(i).name));
        }

        return instr;
    }

    /**
     * Check if a node is an element string interpolation
     * @param node
     */
    public isElementString(node: HTMLElement): boolean {
        return (node.childElementCount == 0 && node.textContent.match(NodeInspecter.STR_INTERPO_REG_EXP) != null);
    }

    /**
     * Check if a node is only an attribute instruction
     * @param node
     */
    public isOnlyAttribute(node: HTMLElement): boolean {
        return (this.isAttribute(node) && !this.hasIfStatement(node) && !this.isLoop(node) && !this.isElementString(node))
    }
}



/**
    If statement instruction for elements
 */
class IfStatementInstruction extends Instruction {

    public attribute: AttributeInstruction = null;
    public instructions: Array<Instruction> = [];

    public statement: string = null;

    constructor(node: HTMLElement, data?: any) {
        super(node, data);

        this.statement = this.element.attributes.getNamedItem(NodeInspecter.IF_ATTR).value;
    }

    get element(): HTMLElement {
        return this.node as HTMLElement;
    }

    public setup(): void {
        let elem: HTMLElement = this.node as HTMLElement;

        if (this.evaluate()) {

            this.instructions.forEach((instr, i) => {
                let nestedNode: Node = this.findNodeString(elem, instr.getNodeClone()) || this.findElement(elem, <HTMLElement>instr.getNodeClone());

                instr.setNode(nestedNode);
                instr.setData(this._data);
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
    }


    /**
        Evaluate if statement
     */
    public evaluate(): boolean {
        let data = this.prepareDataEnvironment(this._data);


        let func = "(function(" + data.params + "){ return " + this.statement + " })(" + data.values + ");";

        return eval(func);
    }

    /**
     * Add a new instruction
     * @param instr
     */
    public addInstruction(instr: Instruction): Instruction {
        this.instructions.push(instr);
        return instr;
    }

    /**
     * Add a new attribute
     * @param attrInstr
     */
    public setAttribute(attr: AttributeInstruction): void {
        this.attribute = attr;
    }
}



/**
    Loop
 */
class LoopInstruction extends Instruction {

    private _shape: HTMLElement = null;
    private _render: HTMLElement = null;
    private _segments: Array<string> = [];


    private _params = {
        statement: "",
        loopExpression: "",
        wrap: false,
        varName: ""
    };

    public _ni: NodeInspecter = null;
    public instructions: Array<Instruction> = [];
    public instructionsToApply: Array<Instruction> = [];
    public attribute: AttributeInstruction = null;


    constructor(node: HTMLElement, data?: any) {
        super(node, data);

        this.init();
        this.clone();
    }


    public clone(): void {
        this._render = this.node.cloneNode() as HTMLElement;
    }


    get element(): HTMLElement {
        return this.node as HTMLElement;
    }

    /**
        Init
     */
    private init(): void {
        let expression = this.element.attributes.getNamedItem(NodeInspecter.FOR_ATTR).value.trim().split("|");

        let loopExpression = expression[0];
        let option = expression[1];

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
        //this.node.attributes.removeNamedItem(NodeInspecter.FOR_ATTR);
    }


    /**
     * Add new node string interpolation to instructions
     * @param instruction
     */
    public addInstruction(instruction: Instruction): Instruction {
        this.instructions.push(instruction);
        return instruction;
    }

    /**
     * Set attribute to loop, this attribute will be applied to this loop's Element
     * @param attribute
     */
    public setAttribute(attribute: AttributeInstruction): void {
        this.attribute = attribute;
    }


    /**
     * Loop through all instructions and execute them
     * @param loopContainer
     * @param parentContainer
     * @param data
     */
    private loop(data: any): void {

        let array = this.findArray(this._params.statement, data);


        if (array != undefined) {

            array.forEach((item, index) => {
                let instrs: Array<Instruction> = [];

                if (Array.isArray(item)) {
                    data[this._params.varName] = {
                        array: item,
                        $index: index
                    };
                }
                else {
                    data[this._params.varName] = item;
                    data[this._params.varName]["$index"] = index;
                }


                let shape = this.node.cloneNode(true) as HTMLElement;

                this.instructions.forEach((instr, index) => {

                    let node: Node = this.findElement(shape, <HTMLElement>instr.getNodeClone()) || this.findNodeString(shape, instr.getNodeClone());

                    let newInstr: Instruction = null;

                    if (instr instanceof IfStatementInstruction) {
                        let ifInstr = new IfStatementInstruction(<HTMLElement>node, data);

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
                        let attrInstr = new AttributeInstruction(node, data);
                        attrInstr.attributes = instr.attributes;

                        newInstr = attrInstr;
                    }

                    if (newInstr != null)
                        instrs.push(newInstr);
                });


                /**
                 * Apply instructions
                 * */

                instrs.forEach(instr => {
                    instr.setup();
                });


                /**
                    Insert content    
                */
                if (this._params.wrap)
                    this.node.parentElement.insertBefore(shape, this.node);
                else
                    this._render.innerHTML += shape.innerHTML;

            });

            /**
             * If element is wraped, then remove it
             * */
            if (this._params.wrap) {
                let elemToRemove = this.findElement(<HTMLElement>this.node, <HTMLElement>this.getNodeClone());
                if (elemToRemove != null)
                    elemToRemove.remove();
            }

            (<HTMLElement>this.node).innerHTML = this._render.innerHTML;
        }


    }

    /**
     * Setup instruction
     * @param parent
     */
    public setup(): void {
        this.loop(this._data);
    }
}
