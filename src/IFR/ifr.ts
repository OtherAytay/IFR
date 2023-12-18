/**
 * Represents an Interactive FapRoulette game including the structure of the event space and necessary game logic.
 */
class IFR {
    title: string;
    description: string;
    variables: Array<Variable> = [];
    stages: Set<Stage> = new Set();

    constructor(title: string) {
        this.title = title;
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

        this.stages.add(stage);
        return true;
    }

}

class Stage {
    private eventSpaces: Array<Event | EventGroup> = [];
    title: string;
    subtitle: string;
    description: string;
    minComplete: number = 0;
    maxComplete: number = this.eventSpaces.length;
    progress: Map<Condition | "Default", Stage> = new Map();

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
        for (const d of eventSpace.dependencies) {
            if (d instanceof Event || d instanceof EventGroup) {
                return this.event.includes(d)
            }
        }
    }

}


class EventGroup {
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

    addDependency = function (eventSpace: Event | EventGroup) {
        this.dependencies.add(eventSpace)
        return true;
    }

    checkDependencies = function (eventSpace: Event) {
        for (const d of eventSpace.dependencies) {
            if (d instanceof Event || d instanceof EventGroup) {
                return this.events.includes(d)
            }
        }
    }

}

class Event {
    static readonly minRoll: number = 0

    title: string;
    subtitle: string;
    maxRoll: number = 10;
    tasks: Array<{ min: number, max: number, task: Task }> = []
    required = true;
    dependencies: Set<Event | EventGroup | Condition> = new Set();

    constructor(title: string, subtitle: string, maxRoll: number, tasks: Array<{ min: number, max: number, task: Task }>, required: boolean, dependencies: Set<Event | EventGroup> = new Set()) {
        this.title = title;
        this.subtitle = subtitle;
        this.maxRoll = maxRoll
        this.tasks = tasks;
        this.required = required;
        this.dependencies = dependencies;
    }

    addDependency = function (eventSpace: Event | EventGroup) {
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


class Task {
    static readonly PASS = true
    static readonly FAIL = false

    title: string;
    flavor: string;
    description: string;
    passOutcome: Outcome;
    failOutcome: Outcome;

    constructor(title: string, flavor: string, description: string, passOutcome: Outcome, failOutcome?: Outcome) {
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

class Outcome {
    static readonly SET = "set"
    static readonly ADD = "add"
    static readonly SUBTRACT = "sub"
    static readonly MULTIPLY = "mult"
    static readonly DIVIDE = "div"
    static readonly FLIP = "neg"

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
class Variable {
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
        if (this.type == "number") {
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
        } else if (this.type == "string") {
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
class ConditionGroup {
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
class Condition {
    static readonly EQUALS = "eq"
    static readonly NOT_EQUALS = "neq"
    static readonly LESS = "lt"
    static readonly LESS_EQUALS = "le"
    static readonly GREATER = "ge"
    static readonly GREATER_THAN = "gt"

    static readonly allowedOperations = {
        "boolean": [Condition.EQUALS],
        "number": [Condition.LESS, Condition.LESS_EQUALS, Condition.EQUALS, Condition.GREATER, Condition.GREATER_THAN, Condition.NOT_EQUALS],
        "string": [Condition.EQUALS, Condition.NOT_EQUALS]
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

    check = function (value) {
        switch (this.operation) {
            case Condition.EQUALS: return value == this.target
            case Condition.NOT_EQUALS: return value != this.target
            case Condition.LESS: return value < this.target
            case Condition.LESS_EQUALS: return value <= this.target
            case Condition.GREATER: return value >= this.target
            case Condition.GREATER_THAN: return value > this.target
        }
    }
}

/* ----- GAME STATE -----*/
/* The following classes and methods represent and manage the state of an IFR while it's being played */

class IFRState {
    ifr: IFR;
    stageStates: Array<StageState> = [];
    currentStage: Stage;

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
    }

    getVariableState = function (variable: Variable) {
        return this.variableStates.get(variable)
    }
}

class StageState {
    stage: Stage;
    eventSpaceStates: Array<EventState | EventGroupState> = [];
    isComplete: boolean = false;

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

        for (const es of this.eventSpaceStates) {
            if (es instanceof EventState) {
                for (const d of es.event.dependencies) {
                    if (d instanceof Event) {
                        for (const ess of this.eventSpaceStates) {
                            if (ess instanceof EventState && ess.event == d) {
                                es.dependencyStates.push(ess)
                            }
                        }
                    } else if (d instanceof EventGroup) {
                        for (const ess of this.eventSpaceStates) {
                            if (ess instanceof EventGroupState && ess.eventGroup == d) {
                                es.dependencyStates.push(ess)
                            }
                        }
                    } else {
                        es.dependencyStates.push(new ConditionState(d, variableStates))
                    }
                }
            } else if (es instanceof EventGroupState) {
                for (const d of es.eventGroup.dependencies) {
                    if (d instanceof Event) {
                        for (const ess of this.eventSpaceStates) {
                            if (ess instanceof EventState && ess.event == d) {
                                es.dependencyStates.push(ess)
                            }
                        }
                    } else if (d instanceof EventGroup) {
                        for (const ess of this.eventSpaceStates) {
                            if (ess instanceof EventGroupState && ess.eventGroup == d) {
                                es.dependencyStates.push(ess)
                            }
                        }
                    } else {
                        es.dependencyStates.push(new ConditionState(d, variableStates))
                    }
                }
            }
        }
    }
}

class EventGroupState {
    eventGroup: EventGroup;
    eventStates: Array<EventState> = [];
    dependencyStates: Array<EventState | EventGroupState | ConditionState> = [];
    isComplete: boolean = false;
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
                    for (const ess of this.eventSpaceStates) {
                        if (ess instanceof EventState && ess.event == d) {
                            es.dependencyStates.push(ess)
                        }
                    }
                } else {
                    es.dependencyStates.push(new ConditionState(d, variableStates))
                }
            }
        }
    }
}


class EventState {
    event: Event;
    taskStates: Map<Task, TaskState> = new Map();
    dependencyStates: Array<EventState | EventGroupState | ConditionState> = [];
    currentRoll: number = null;

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
                this.dependencyStates.push(new ConditionState(d, variableStates))
            }
        }
    }

    roll = function () {
        this.currentRoll = randRange(Event.minRoll, this.event.maxRoll, true)
        this.taskStates.get(this.event.roll(this.currentRoll))
    }
}

class TaskState {
    task: Task;
    isComplete: boolean = false;
    pass: boolean;

    timesCompleted: number = 0;

    constructor(task: Task, variableStates) {
        this.task = task
    }

    complete = function (pass) {
        this.complete = true;
        this.pass = pass;
        this.task.getOutcome(pass).process()
        this.timesCompleted += 1
    }
}

class VariableState {
    variable: Variable;
    value;

    constructor(variable: Variable) {
        this.variable = variable
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

class ConditionGroupState {
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

class ConditionState {
    condition: Condition;
    variableState: Variable;

    constructor(condition: Condition, variableStates) {
        this.condition = condition
        this.variableState = variableStates.get(this.condition.variable)
    }

    check = function () {
        return this.condition.check(this.variableState.value)
    }
}

/* ----- UTILITIES ---- */
function randRange(min: number, max: number, integer: boolean) {
    if (integer) {
        return Math.floor(Math.random() * ((max - min) + 1) + min);
    } else {
        return Math.random() * ((max - min) + 1) + min;
    }
}

