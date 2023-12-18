/**
 * Represents an Interactive FapRoulette game including the structure of the event space and necessary game logic.
 */
class IFR {
    title: string;
    description: string;
    variables: Array<Variable> = [];
    stages: Array<Stage> = [];

    constructor(title: string) {
        this.title = title
    }

    addVariable = function(variable: Variable) {
        for (const v of this.variables) {
            if (v.name == variable.name) { return false}
        }

        this.variables.push(variable)
        return true
    }

}

class Stage {
    eventSpaces = [];
    progress = new Map();
    
    

}


class EventGroup {

}

class Event {
    static minRoll: number = 0

    title: string;
    subtitle: string;
    maxRoll: number = 10;
    outcomes: Array<{min: number, max: number, task: Task}> = []
    dependencies = [];
    
    constructor(title: string, subtitle: string, maxRoll: number, outcomes: Array<{min: number, max: number, task: Task}>, dependencies: Array<Event>=[]) {
        this.title = title;
        this.subtitle = subtitle;
        this.maxRoll = maxRoll
        this.outcomes = outcomes;
        this.dependencies = dependencies;
    }

    addOutcome = function(outcome: {min: number, max: number, task: Task}) {
        var valid = true
        valid = valid && outcome.min <= outcome.max;
        valid = valid && outcome.min >= Event.minRoll && outcome.max >= Event.minRoll
        valid = valid && outcome.min <= this.maxRoll && outcome.max <= this.maxRoll

        // Check that there is no overlap in decision space
        for (const o of this.outcomes) {
            valid = valid && (o.min > outcome.min || o.min < outcome.min) && (o.min > outcome.max || o.min < outcome.max)
            valid = valid && (o.max > outcome.min || o.max < outcome.min) && (o.max > outcome.max || o.max < outcome.max)
        }

        if (valid) {
            this.outcomes.push(outcome);
            return true;
        }
        return false;
    }

    roll = function(roll: number) {
        if (roll < Event.minRoll || roll > this.maxRoll) { throw "Roll out of bounds" }

        for (const o of this.outcomes) {
            if (o.min <= roll && roll <= o.max) {
                return o.task
            }
        }
        throw "Roll not bound by any outcomes"
    }
}


class Task {
    static PASS = true
    static FAIL = false

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

    getOutcome = function(status) {
        if (status == Task.PASS) {
            return this.passOutcome
        } else if (status == Task.FAIL) {
            return this.failOutcome
        }
        return false
    }
}

class Outcome {
    static SET = "set"
    static ADD = "add"
    static SUBTRACT = "sub"
    static MULTIPLY = "mult"
    static DIVIDE = "div"
    static FLIP = "neg"

    static allowedOperations = {
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

    process = function(variableState: VariableState) {
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
                switch(this.operation) {
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
    static TYPES = ["boolean", "number", "string"]
    
    name: string;
    type: string;
    defaultValue;
    bounds = null;

    constructor(name: string, type: string, defaultValue) {
        this.name = name;

        if (!(Variable.TYPES.includes(type))) { throw "Type must be one of " + Variable.TYPES}
        this.type = type;

        if (typeof defaultValue != type) { throw "Default value must be same type as variable type"}
        this.defaultValue = defaultValue
    }

    addBounds = function(bounds: Array<any>) {
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

    checkValid = function(value) {
        if (typeof value != this.type) { return false }

        if (this.type == "number") {
            return this.bounds[0] <= value && value <= this.bounds[1]
        }

        if (this.type == "string") {
            return this.bounds.includes(value)
        }
    }
}

class ConditionGroup {
    conditions = [];

    addCondition = function(condition: Condition) {
        this.conditions.push(condition);
        return true;
    }

    //check
}

class Condition {
    static EQUALS = "eq"
    static NOT_EQUALS = "neq"
    static LESS = "lt"
    static LESS_EQUALS = "le"
    static GREATER = "ge"
    static GREATER_THAN = "gt"

    static allowedOperations = {
        "boolean": [Condition.EQUALS],
        "number": [Condition.LESS, Condition.LESS_EQUALS, Condition.EQUALS, Condition.GREATER, Condition.GREATER_THAN, Condition.NOT_EQUALS],
        "string": [Condition.EQUALS, Condition.NOT_EQUALS]
    }

    variable: Variable;
    operation: string;
    target;

    constructor(variable: Variable, operation: string, target) {
        this.variable = variable

        if (!Condition.allowedOperations[variable.type].includes(operation)) { throw "Invalid operation for given variable"}
        this.operation = operation;
       
        this.target = target;
    }

    check = function(value) {
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

    /** Maps variables to variableStates */
    variableStates = new Map<Variable, VariableState>();

    constructor(ifr: IFR) {
        this.ifr = ifr
        this.init()
    }

    init = function() {

    }

    getVariableState = function(variable: Variable) {
        return this.variableStates.get(variable)
    }
}

class ConditionGroupState {
    conditionStates: Array<ConditionState> = []

    addCondition = function(condition: Condition) {
        this.conditions.push(condition);
        return true;
    }

    check = function() {
        var state = true
        for (const c of this.conditionStates) {
            state = state && c.check()    
        }
        return state
    }
}

class ConditionState {
    condition: Condition;
    variableState: VariableState;

    constructor(condition: Condition, variableState: VariableState) {
        this.condition = condition
        this.variableState = variableState
    }

    check = function() {
        return this.condition.check(this.variableState.value)
    } 
}

class VariableState {
    variable: Variable;
    value;

    constructor(variable: Variable) {
        this.variable = variable
    }

    setValue = function(value) {
        var valid = true
        valid = valid && typeof value == this.variable.type
        valid = valid && this.variable.checkValid(value)

        if (valid) {
            this.value = value
            return true
        }
        return false;
    }

    checkCondition = function(condition: Condition) {
        return condition.check(this.value)
    }
}