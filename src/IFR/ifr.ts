/**
 * Represents an Interactive FapRoulette game including the structure of the event space and necessary game logic.
 */
export class IFR {
    title: string;
    description: string;
    fr_link: string;
    fr_img: string;
    variables: Array<Variable> = [];
    stages: Array<Stage> = new Array();

    constructor(title: string, fr_link: string = "", fr_img: string = "") {
        this.title = title;
        this.fr_link = fr_link;
        this.fr_img = fr_img;
    }

    addVariable = function (variable: Variable) {
        for (const v of this.variables) {
            if (v.name == variable.name) { return false }
        }

        this.variables.push(variable)
        return true
    }

    addStage = function (stage: Stage) {
        for (const s of this.stages) {
            if (s.title == stage.title) { return false }
        }

        this.stages.push(stage);
        return true;
    }

}

export class Stage {
    eventSpaces: Array<Event | EventGroup> = [];
    title: string;
    subtitle: string;
    description: string;
    minComplete: number = 0;
    maxComplete: number = this.eventSpaces.length;
    progress: Map<Condition | ConditionGroup | "Default", Stage> = new Map();

    constructor(title: string, subtitle: string = "", description: string = "", minComplete: number, maxComplete: number) {
        this.title = title;
        this.subtitle = subtitle;
        this.description = description;
        this.minComplete = minComplete;
        this.maxComplete = maxComplete;
    }

    addEventSpace = function (eventSpace: Event | EventGroup) {
        if (this.checkDependencies(eventSpace)) {
            this.eventSpaces.push(eventSpace);
            return true;
        }
        return false;
    }

    addProgression = function (condition: Condition | "Default", stage: Stage) {
        this.progress.set(condition, stage);
        return true;
    }

    checkDependencies = function (eventSpace: Event | EventGroup) {
        if (eventSpace.dependencies.size == 0) { return true }
        for (const d of eventSpace.dependencies) {
            if (d instanceof Event || d instanceof EventGroup) {
                return this.eventSpaces.includes(d)
            }
        }
    }

}

export class EventGroup {
    events: Array<Event> = [];
    title: string;
    minComplete: number = 0;
    maxComplete: number = this.events.length;
    dependencies: Set<Event | EventGroup | Condition> = new Set();

    constructor(title: string, minComplete: number, maxComplete: number) {
        this.title = title;
        this.minComplete = minComplete;
        this.maxComplete = maxComplete;
    }

    addEvent = function (event: Event) {
        if (this.checkDependencies(event)) {
            this.events.push(event);
            return true;
        }
        return false;
    }

    addDependency = function (eventSpace: Event | EventGroup | Condition) {
        this.dependencies.add(eventSpace)
        return true;
    }

    checkDependencies = function (eventSpace: Event) {
        if (eventSpace.dependencies.size == 0) { return true }
        for (const d of eventSpace.dependencies) {
            if (d instanceof Event || d instanceof EventGroup) {
                return this.events.includes(d)
            }
        }
    }

}
export class Event {
    static readonly minRoll: number = 1

    title: string;
    subtitle: string;
    maxRoll: number = 10;
    tasks: Array<{ min: number, max: number, task: Task }> = []
    required: boolean = true;
    dependencies: Set<Event | EventGroup | Condition> = new Set();

    constructor(title: string, subtitle: string, maxRoll: number, required: boolean = true) {
        this.title = title;
        this.subtitle = subtitle;
        this.maxRoll = maxRoll
        this.required = required;
    }

    addDependency = function (eventSpace: Event | EventGroup | Condition) {
        this.dependencies.add(eventSpace)
        return true;
    }

    addTask = function (task: { min: number, max: number, task: Task }) {
        var valid = true
        valid = valid && task.min <= task.max;
        valid = valid && task.min >= Event.minRoll && task.max >= Event.minRoll
        valid = valid && task.min <= this.maxRoll && task.max <= this.maxRoll

        // Check that there is no overlap in decision space
        for (const o of this.tasks) {
            valid = valid && (o.min > task.min || o.min < task.min) && (o.min > task.max || o.min < task.max)
            valid = valid && (o.max > task.min || o.max < task.min) && (o.max > task.max || o.max < task.max)
        }

        if (valid) {
            this.tasks.push(task);
            return true;
        }
        return false;
    }

    roll = function (roll: number) {
        if (roll < Event.minRoll || roll > this.maxRoll) { throw "Roll out of bounds" }

        for (const o of this.tasks) {
            if (o.min <= roll && roll <= o.max) {
                return o.task
            }
        }
        throw "Roll not bound by any tasks"
    }
}


export class Task {
    static readonly PASS = true
    static readonly FAIL = false
    static readonly REROLL = "REROLL"

    title: string;
    flavor: string;
    description: string;
    passOutcome: Outcome | "REROLL";
    failOutcome: Outcome | "REROLL";

    constructor(title: string, flavor: string = "", description: string, passOutcome?: Outcome | "REROLL", failOutcome?: Outcome | "REROLL") {
        this.title = title;
        this.flavor = flavor;
        this.description = description;
        this.passOutcome = passOutcome;
        this.failOutcome = failOutcome;
    }

    getOutcome = function (status) {
        if (status == Task.PASS) {
            return this.passOutcome
        } else if (status == Task.FAIL) {
            return this.failOutcome
        }
        return false
    }
}

export class Outcome {
    static readonly SET = "set"
    static readonly ADD = "add"
    static readonly SUBTRACT = "sub"
    static readonly MULTIPLY = "mult"
    static readonly DIVIDE = "div"
    static readonly FLIP = "neg"

    static readonly opReadable = {
        [Outcome.SET]: " \u2192 ",
        [Outcome.ADD]: " + ",
        [Outcome.SUBTRACT]: " \u2212 ",
        [Outcome.MULTIPLY]: " \u00D7 ",
        [Outcome.DIVIDE]: " \u00F7 ",
        [Outcome.FLIP]: " \u00AC "
    }

    static readonly allowedOperations = {
        "boolean": [Outcome.SET, Outcome.FLIP],
        "number": [Outcome.SET, Outcome.ADD, Outcome.SUBTRACT, Outcome.MULTIPLY, Outcome.DIVIDE],
        "string": [Outcome.SET],
    }

    variable: Variable;
    operation: string;
    target;

    constructor(variable: Variable, operation: string, target) {
        this.variable = variable;

        if (!Outcome.allowedOperations[variable.type].includes(operation)) { throw "Invalid operation for given variable" }
        this.operation = operation;

        if (!variable.checkValid(target)) { throw "Invalid target value for given variable" }
        this.target = target
    }

    readOutcome = function () {
        if (this.operation == Outcome.FLIP) {
            return Outcome.opReadable[this.operation] + this.variable.name;
        }
        return this.variable.name + Outcome.opReadable[this.operation] + this.target;
    }

    process = function (variableState: VariableState) {
        if (variableState.variable != this.variable) { throw "Variable and VariableState mismatch" }

        switch (variableState.variable.type) {
            case "boolean":
                switch (this.operation) {
                    case Outcome.SET:
                        return variableState.setValue(this.target)
                    case Outcome.FLIP:
                        return variableState.setValue(!variableState.value)
                }
            case "number":
                switch (this.operation) {
                    case Outcome.SET:
                        return variableState.setValue(this.target)
                    case Outcome.ADD:
                        return variableState.setValue(variableState.value + this.target)
                    case Outcome.SUBTRACT:
                        return variableState.setValue(variableState.value - this.target)
                    case Outcome.MULTIPLY:
                        return variableState.setValue(variableState.value * this.target)
                    case Outcome.DIVIDE:
                        return variableState.setValue(variableState.value / this.target)
                }
            case "string":
                switch (this.operation) {
                    case Outcome.SET:
                        return variableState.setValue(this.target)
                }
        }
        return false;
    }
}

/**
 * Variables that change according to event and task outcomes. 
 * Values can be the following types: boolean, number, or string
 * Can specify a default value and bounds for the values.
 * 
 * For numbers, bounds are a min and max inclusive.
 * For strings, bounds are a list of valid strings.
 */
export class Variable {
    static readonly BOOL = "boolean"
    static readonly NUM = "number"
    static readonly STRING = "string"
    static readonly TYPES = ["boolean", "number", "string"]

    name: string;
    type: string;
    defaultValue;
    bounds = null;

    constructor(name: string, type: string, defaultValue) {
        this.name = name;

        if (!(Variable.TYPES.includes(type))) { throw "Type must be one of " + Variable.TYPES }
        this.type = type;

        if (typeof defaultValue != type) { throw "Default value must be same type as variable type" }
        this.defaultValue = defaultValue
    }

    addBounds = function (bounds: Array<any>) {
        if (this.type == Variable.NUM) {
            var valid = true
            valid = valid && bounds.length == 2
            valid = valid && typeof bounds[0] == "number"
            valid = valid && typeof bounds[1] == "number"
            valid = valid && bounds[0] <= bounds[1]
            valid = valid && this.bounds[0] <= this.defaultValue && this.defaultValue <= this.bounds[1]

            if (valid) {
                this.bounds = bounds
                return true
            }
        } else if (this.type == Variable.STRING) {
            var valid = true
            for (const b of bounds) {
                valid = valid && typeof b == "string"
            }
            valid = valid && bounds.includes(this.defaultValue)

            if (valid) {
                this.bounds = bounds
                return true
            }
        } else {
            return false
        }
    }

    checkValid = function (value) {
        if (typeof value != this.type) { return false }

        if (this.type == "number") {
            return this.bounds[0] <= value && value <= this.bounds[1]
        }

        if (this.type == "string") {
            return this.bounds.includes(value)
        }
    }
}

/**
 * A group of conditions that must all be fulfilled simultaneously (Logical AND)
 */
export class ConditionGroup {
    conditions: Array<Condition> = [];

    addCondition = function (condition: Condition) {
        this.conditions.push(condition);
        return true;
    }
}

/**
 * A pre-configured comparison operation between a target value and an input.
 * Used to determine task outcomes and stage progression.
 */
export class Condition {
    static readonly EQUALS = "eq"
    static readonly NOT_EQUALS = "neq"
    static readonly LESS = "lt"
    static readonly LESS_EQUALS = "le"
    static readonly GREATER = "ge"
    static readonly GREATER_THAN = "gt"
    static readonly ANY = "any"

    static readonly opReadable = {
        [Condition.EQUALS]: " = ",
        [Condition.NOT_EQUALS]: " \u2260 ",
        [Condition.LESS]: " < ",
        [Condition.LESS_EQUALS]: " \u2264 ",
        [Condition.GREATER]: " > ",
        [Condition.GREATER_THAN]: " \u2265 ",
        [Condition.ANY]: " one of: "
    }

    static readonly allowedOperations = {
        "boolean": [Condition.EQUALS],
        "number": [Condition.LESS, Condition.LESS_EQUALS, Condition.EQUALS, Condition.GREATER, Condition.GREATER_THAN, Condition.ANY, Condition.NOT_EQUALS],
        "string": [Condition.EQUALS, Condition.NOT_EQUALS, Condition.ANY]
    }

    variable: Variable;
    operation: string;
    target;

    constructor(variable: Variable, operation: string, target) {
        this.variable = variable;

        if (!Condition.allowedOperations[variable.type].includes(operation)) { throw "Invalid operation for given variable" }
        this.operation = operation;

        this.target = target;
    }

    readCondition = function () {
        return this.variable.name + Condition.opReadable[this.operation] + this.target.join(', ')
    }

    check = function (value) {
        switch (this.operation) {
            case Condition.EQUALS: return value == this.target
            case Condition.NOT_EQUALS: return value != this.target
            case Condition.LESS: return value < this.target
            case Condition.LESS_EQUALS: return value <= this.target
            case Condition.GREATER: return value >= this.target
            case Condition.GREATER_THAN: return value > this.target
            case Condition.ANY: return this.target.includes(value)
        }
    }
}

/* ----- GAME STATE -----*/
/* The following export classes and methods represent and manage the state of an IFR while it's being played */

export class IFRState {
    ifr: IFR;
    stageStates: Array<StageState> = [];
    currentStage: StageState;

    /** Maps variables to variableStates */
    variableStates = new Map<Variable, VariableState>();

    constructor(ifr: IFR) {
        this.ifr = ifr
        this.init()
    }

    init = function () {
        for (const v of this.ifr.variables) {
            this.variableStates.set(v, new VariableState(v))
        }

        for (const s of this.ifr.stages) {
            this.stageStates.push(new StageState(s, this.variableStates))
        }
        this.currentStage = this.stageStates[0]
    }

    getVariableState = function (variable: Variable) {
        return this.variableStates.get(variable)
    }

    progress = function () {
        this.currentStage = this.currentStage.progress()
    }
}

export class StageState {
    // TODO: add logic to process progression
    stage: Stage;
    eventSpaceStates: Array<EventState | EventGroupState> = [];
    progressStates: Array<ConditionState | ConditionGroupState> = []; // don't forget default state

    timesCompleted: number = 0;

    constructor(stage: Stage, variableStates) {
        this.stage = stage;
        this.init(variableStates)
    }

    init = function (variableStates) {
        for (const es of this.stage.eventSpaces) {
            if (es instanceof Event) {
                this.eventSpaceStates.push(new EventState(es, variableStates));
            } else {
                this.eventSpaceStates.push(new EventGroupState(es, variableStates));
            }
        }

        for (const c of this.stage.progress.keys()) {
            if (c instanceof Condition) {
                this.progressStates.push(new ConditionState(c, variableStates))
            } else if (c instanceof ConditionGroup) {
                this.progressStates.push(new ConditionGroupState(c, variableStates))
            }
        }

        for (const es of this.eventSpaceStates) {
            if (es instanceof EventState) {
                for (const d of es.event.dependencies) {
                    if (d instanceof Event) {
                        for (const ess of this.eventSpaceStates) {
                            if (ess instanceof EventState && ess.event == d) {
                                es.dependencyStates.add(ess)
                            }
                        }
                    } else if (d instanceof EventGroup) {
                        for (const ess of this.eventSpaceStates) {
                            if (ess instanceof EventGroupState && ess.eventGroup == d) {
                                es.dependencyStates.add(ess)
                            }
                        }
                    } else {
                        es.dependencyStates.add(new ConditionState(d, variableStates))
                    }
                }
            } else if (es instanceof EventGroupState) {
                for (const d of es.eventGroup.dependencies) {
                    if (d instanceof Event) {
                        for (const ess of this.eventSpaceStates) {
                            if (ess instanceof EventState && ess.event == d) {
                                es.dependencyStates.add(ess)
                            }
                        }
                    } else if (d instanceof EventGroup) {
                        for (const ess of this.eventSpaceStates) {
                            if (ess instanceof EventGroupState && ess.eventGroup == d) {
                                es.dependencyStates.add(ess)
                            }
                        }
                    } else {
                        es.dependencyStates.add(new ConditionState(d, variableStates))
                    }
                }
            }
        }
    }

    isComplete = function () {
        var complete = true
        for (const e of this.eventSpaceStates) {
            complete = complete && e.isComplete()
        }
        return complete
    }

    progress = function () {
        if (!this.isComplete()) { this.stage } // If stage is not complete, stay on current stage

        for (const p of this.progressStates) {
            if (p instanceof ConditionState) {
                if (p.check()) {
                    return this.stage.progress.get(p.condition)
                }
            } else if (p instanceof ConditionGroupState) {
                if (p.check()) {
                    return this.stage.progress.get(p.conditionGroup)
                }
            } else {
                return this.stage.progress.get("Default")
            }
        }
    }
}

export class EventGroupState {
    eventGroup: EventGroup;
    eventStates: Array<EventState> = [];
    dependencyStates: Set<EventState | EventGroupState | ConditionState> = new Set();
    timesCompleted: number = 0;

    constructor(eventGroup: EventGroup, variableStates) {
        this.eventGroup = eventGroup;
        this.init(variableStates)
    }

    init = function (variableStates) {
        for (const es of this.eventGroup.events) {
            this.eventStates.push(new EventState(es, variableStates))
        }

        for (const es of this.eventStates) {
            for (const d of es.event.dependencies) {
                if (d instanceof Event) {
                    for (const ess of this.eventStates) {
                        if (ess.event == d) {
                            es.dependencyStates.add(ess)
                        }
                    }
                } else {
                    this.dependencyStates.add(new ConditionState(d, variableStates))
                }
            }
        }
    }

    isAvailable = function () {
        var available = true;
        for (const d of this.dependencyStates) {
            if (d instanceof EventState || d instanceof EventGroupState) {
                available = available && d.isComplete()
            } else {
                available = available && d.check()
            }
        }
        return available;
    }

    isComplete = function () {
        var complete = true
        for (const e of this.eventStates) {
            if (e.isAvailable()) {
                complete = complete && e.isComplete()
            }
        }
        return complete;
    }
}


export class EventState {
    event: Event;
    activeTaskState: TaskState;
    taskStates: Map<Task, TaskState> = new Map();
    dependencyStates: Set<EventState | EventGroupState | ConditionState> = new Set();
    currentRoll: number = null;
    completed: boolean = false;
    timesRolled: number = 0;

    constructor(event: Event, variableStates) {
        this.event = event;
        this.init(variableStates);
    }

    init = function (variableStates) {
        for (const t of this.event.tasks) {
            this.taskStates.set(t.task, new TaskState(t.task, variableStates));
        }

        for (const d of this.event.dependencies) {
            if (d instanceof Condition) {
                this.dependencyStates.add(new ConditionState(d, variableStates))
            }
        }
    }

    isAvailable = function () {
        var available = true;
        for (const d of this.dependencyStates) {
            if (d instanceof EventState || d instanceof EventGroupState) {
                available = available && d.isComplete()
            } else {
                available = available && d.check()
            }
        }
        return available;
    }

    roll = function () {
        this.currentRoll = randRange(Event.minRoll, this.event.maxRoll, true);
        this.activeTaskState = this.taskStates.get(this.event.roll(this.currentRoll));
        this.activeTaskState.currentRoll = this.currentRoll;
        this.timesRolled += 1;
    }

    isComplete = function () {
        return this.completed
    }

    complete = function (pass = true) {
        this.completed = true;
        this.activeTaskState.complete(pass)
        if (this.activeTaskState.reroll) {
            this.currentRoll = null;
            this.completed = false;
        }
    }
}

export class TaskState {
    task: Task;
    currentRoll: number = null;
    reroll: boolean = false;
    isComplete: boolean = false;
    pass: boolean;
    passVarState: VariableState;
    failVarState: VariableState;
    variableStates: Map<Variable, VariableState>

    timesCompleted: number = 0;

    constructor(task: Task, variableStates: Map<Variable, VariableState>) {
        this.task = task
        if (task.passOutcome && task.passOutcome instanceof Outcome) {
            this.passVarState = variableStates.get(task.passOutcome.variable);
        }
        if (task.failOutcome && task.failOutcome instanceof Outcome) {
            this.failVarState = variableStates.get(task.failOutcome.variable);
        }
        this.variableStates = variableStates
    }

    complete = function (pass: boolean) {
        this.reroll = false;
        this.currentRoll = null;
        this.pass = pass;
        if (this.task.getOutcome(pass) && pass == true) {
            if (this.task.getOutcome(pass) == "REROLL") {
                this.isComplete = false;
                this.reroll = true;
            } else {
                this.isComplete = true;
                this.task.getOutcome(pass).process(this.passVarState);
            }
        } else if (this.task.getOutcome(pass) && pass == false) {
            if (this.task.getOutcome(pass) == "REROLL") {
                this.isComplete = false;
                this.reroll = true;
            } else {
                this.isComplete = true;
                this.task.getOutcome(pass).process(this.failVarState);
            }
        }
        this.timesCompleted += 1;
    }

    getDescription = function () {
        var resultDescription: string = this.task.description
        var varRegex = /{{\s*(\w*)\s*}}/
        var varWOpRegex = /{{\s*(\w*)\s*([+\-*/])\s*(\d*)\s*}}/

        var varsMatch = resultDescription.match(varRegex)
        while (varsMatch) {
            var varValue = null;
            if (varsMatch[1] == "_roll") {
                if (this.currentRoll) {
                    varValue = this.currentRoll
                } else {
                    varValue = "ROLL"
                }
            } else {
                for (const variable of this.variableStates.keys()) {
                    if (variable.name == varsMatch[1]) {
                        varValue = this.variableStates.get(variable).value
                        break;
                    }
                }
            }

            resultDescription = resultDescription.replace(varsMatch[0], varValue)
            varsMatch = resultDescription.match(varRegex)
        }

        var varsOpMatch = resultDescription.match(varWOpRegex)
        while (varsOpMatch) {
            var varValue = null;
            var operator = varsOpMatch[2]
            var operand = parseFloat(varsOpMatch[3])
            if (varsOpMatch[1] == "_roll") {
                if (this.currentRoll) {
                    switch (operator) {
                        case "+": varValue = this.currentRoll + operand; break;
                        case "-": varValue = this.currentRoll - operand; break;
                        case "*": varValue = this.currentRoll * operand; break;
                        case "/": varValue = this.currentRoll / operand; break;
                    }
                } else {
                    varValue = "ROLL " + operator + " " + operand
                }
            } else {
                for (const variable of this.variableStates.keys()) {
                    if (variable.name = varsOpMatch[1] && variable.type == Variable.NUM) {
                        switch (operator) {
                            case "+": varValue = this.variableStates.get(variable).value + operand; break;
                            case "-": varValue = this.variableStates.get(variable).value - operand; break;
                            case "*": varValue = this.variableStates.get(variable).value * operand; break;
                            case "/": varValue = this.variableStates.get(variable).value / operand; break;
                        }
                        break;
                    }
                }
            }

            resultDescription = resultDescription.replace(varsOpMatch[0], varValue)
            varsOpMatch = resultDescription.match(varWOpRegex)
        }

        return resultDescription
    }
}

export class VariableState {
    variable: Variable;
    value: any;

    constructor(variable: Variable) {
        this.variable = variable;
        this.value = variable.defaultValue;
    }

    setValue = function (value) {
        var valid = true
        valid = valid && typeof value == this.variable.type
        valid = valid && this.variable.checkValid(value)

        if (valid) {
            this.value = value
            return true
        }
        return false;
    }

    checkCondition = function (condition: Condition) {
        return condition.check(this.value)
    }
}

export class ConditionGroupState {
    conditionGroup: ConditionGroup;
    conditionStates: Array<ConditionState> = []

    constructor(conditionGroup: ConditionGroup, variableStates) {
        this.conditionGroup = conditionGroup;
        this.init(variableStates);
    }

    init = function (variableStates) {
        for (const c of this.conditionGroup.conditions) {
            this.conditionStates.push(new ConditionState(c, variableStates))
        }
    }

    check = function () {
        var state = true
        for (const c of this.conditionStates) {
            state = state && c.check()
        }
        return state
    }
}

export class ConditionState {
    condition: Condition;
    variableState: VariableState;

    constructor(condition: Condition, variableStates: Map<Variable, VariableState>) {
        this.condition = condition
        this.variableState = variableStates.get(this.condition.variable)
    }

    check = function () {
        return this.condition.check(this.variableState.value)
    }
}

/* ----- UTILITIES ---- */
class biMap<T, V> {
    map: Map<T, V>;
    revMap: Map<V, T>;

    constructor(map: Map<T, V> = new Map()) {
        this.map = map
        this.revMap = new Map<V, T>()
        for (const [k, v] of map.entries()) {
            this.revMap.set(v, k)
        }
    }

    set = function (key: T, value: V) {
        this.map.set(key, value)
        this.revMap.set(value, key)
    }

    delete = function (key: T) {
        this.revMap.delete(this.map.get(key));
        this.map.delete(key);
    }

    get = function (key: T) {
        return this.map.get(key);
    }

    revGet = function (value: V) {
        return this.revMap.get(value)
    }
}

function randRange(min: number, max: number, integer: boolean) {
    if (integer) {
        return Math.floor(Math.random() * ((max - min) + 1) + min);
    } else {
        return Math.random() * ((max - min) + 1) + min;
    }
}

