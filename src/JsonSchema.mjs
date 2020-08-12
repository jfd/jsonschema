import Url from "url";

import {Dict} from "//es.parts/ess/0.0.1/";
import {List} from "//es.parts/ess/0.0.1/";

export {validate};

export class ValidationError {
    constructor(message, instance, schema, propertyPath, name, argument) {
        if (propertyPath) {
            this.property = propertyPath;
        }
        if (message) {
            this.message = message;
        }
        if (schema) {
            if (schema.id) {
                this.schema = schema.id;
            } else {
                this.schema = schema;
            }
        }

        if (instance) {
            this.instance = instance;
        }

        this.name = name;
        this.argument = argument;
        this.stack = this.toString();
    }

    toString() {
        return this.property + ' ' + this.message;
    }
}

export class ValidatorResult {
    constructor(state, instance, schema, ctx) {
        this.instance = instance;
        this.schema = schema;
        this.propertyPath = ctx.propertyPath;
        this.errors = [];
        this.throwError = state.throwError;
        this.nestedErrors = false;
    }

    addError(detail) {
        var err;
        if (typeof detail == 'string') {
            err = new ValidationError(detail,
                                      this.instance,
                                      this.schema,
                                      this.propertyPath);
        } else {
            if (!detail) throw new Error('Missing error detail');
            if (!detail.message) throw new Error('Missing error message');
            if (!detail.name) throw new Error('Missing validator type');
            err = new ValidationError(detail.message,
                                      this.instance,
                                      this.schema,
                                      this.propertyPath,
                                      detail.name,
                                      detail.argument);
        }

        if (this.throwError) {
            console.log(err);
            throw err;
        }
        this.errors.push(err);
        return err;
    }

    importErrors(res) {
        if (typeof res == 'string' || (res && res.validatorType)) {
            this.addError(res);
        } else if (res && res.errors) {
            Array.prototype.push.apply(this.errors, res.errors);
        }
    }

    get valid() {
        return !this.errors.length;
    }

    toString() {
        return this.errors.map(stringizer).join('');
    }
}

export class SchemaError extends Error {
    constructor(msg, schema) {
        this.name = "SchemaError";
        this.message = msg;
        this.schema = schema;
        Error.call(this, msg);
        Error.captureStackTrace(this, SchemaError);
    }
}

export class SchemaContext {
    constructor(schema, propertyPath, base, schemas) {
        this.schema = schema;
        this.propertyPath = propertyPath;
        this.base = base;
        this.schemas = schemas;
    }

    resolve(target) {
        return Url.resolve(this.base, target);
    }

    makeChild(schema, propertyName) {
        var propertyPath = (propertyName===undefined) ? this.propertyPath : this.propertyPath+makeSuffix(propertyName);
        var base = Url.resolve(this.base, schema.id||'');
        var ctx = new SchemaContext(schema, propertyPath, base, Object.create(this.schemas));
        if(schema.id && !ctx.schemas[base]){
          ctx.schemas[base] = schema;
        }
        return ctx;
    }
}

class SchemaScanResult {
    constructor() {
        this.id = {};
        this.ref = {};
    }
}

class State {
    constructor() {
        this.schemas = {};
        this.unresolvedRefs = [];
        this.allowUnknownAttributes = true;
        this.skipAttributes = [];
        this.throwError = false;
        this.preValidateProperty = null;
    }
}

function validate(instance, schema, options={}, ctx=null) {
    const state = new State;
    const propertyName = options.propertyName || 'instance';
    const base = Url.resolve(options.base || "/", schema.id || '');

    if (!ctx) {
        ctx = new SchemaContext(schema, propertyName, base, Object.create(state.schemas));

        if (!ctx.schemas[base]) {
            ctx.schemas[base] = schema;
        }

        const result = scanSchema(base, schema);

        for (var n in result.id) {
            var sch = result.id[n];
            ctx.schemas[n] = sch;
        }
    }

    if (!schema) {
        throw new SchemaError('no schema specified', schema);
    }

    state.allowUnknownAttributes = !!options.allowUnknownAttributes;
    state.skipAttributes = options.skipAttributes || [];
    state.throwError = !!options.throwError;
    state.nestedErrors = !!options.nestedErrors;
    state.preValidateProperty = options.preValidateProperty;
    state.disableFormat = options.disableFormat;

    var result = validateSchema(state, instance, schema, ctx);

    if (!result) {
        throw new Error('Result undefined');
    }

    return result;
}


// Internals

function validateSchema(state, instance, schema, ctx) {
    const result = new ValidatorResult(state, instance, schema, ctx);

    // Support for the true/false schemas
    if (typeof schema === 'boolean') {
        if(schema === true) {
            // `true` is always valid
            schema = {};
        } else if (schema === false) {
            // `false` is always invalid
            schema = {type: []};
        }
    } else if (!schema) {
        // This might be a string
        throw new Error("schema is undefined");
    }

    if (schema['extends']) {
        if (Array.isArray(schema['extends'])) {
            const schemaobj = {schema: schema, ctx: ctx};
            List.each(schema['extends'], o => schemaTraverser(schemaobj, o));
            schema = schemaobj.schema;
            schemaobj.schema = null;
            schemaobj.ctx = null;
            schemaobj = null;
        } else {
            schema = deepMerge(superResolve(schema['extends'], ctx), schema);
        }
    }

    // If passed a string argument, load that schema URI
    const switchSchemaRef = shouldResolve(schema);

    if (switchSchemaRef) {
      var resolved = resolveSchema(schema, switchSchemaRef, ctx);
      var subctx = new SchemaContext(resolved.subschema, ctx.propertyPath, resolved.switchSchema, ctx.schemas);
      return validateSchema(state, instance, resolved.subschema, subctx);
    }

    // Validate each schema attribute against the instance
    for (const key in schema) {
        if (isReservedKey(key) === false &&
            List.find(state.skipAttributes, a => a === key)) {
            continue;
        }

        const validatorErr = validateAttribute(state, instance, schema, ctx, key);

        if (validatorErr) {
            result.importErrors(validatorErr);
        }
    }

    return result;
}

function isReservedKey(name) {
    switch (name) {
    default:
        return false;

     // informative properties
    case 'id':
    case 'default':
    case 'description':
    case 'title':
    // arguments to other properties
    case 'exclusiveMinimum':
    case 'exclusiveMaximum':
    case 'additionalItems':
    // special-handled properties
    case '$schema':
    case '$ref':
    case 'extends':
        return true;

    }
}

function validateAttribute(state, instance, schema, ctx, type) {
    switch (type) {
    default:
        if (state.allowUnknownAttributes !== false) {
            throw new SchemaError(`Unsupported attribute: ${type}`, schema);
        }
        return;

    case "type":
        return validateType(state, instance, schema, ctx);

    case "anyOf":
        return validateAnyOf(state, instance, schema, ctx);

    case "allOf":
        return validateAllOf(state, instance, schema, ctx);

    case "oneOf":
        return validateOneOf(state, instance, schema, ctx);

    case "properties":
        return validateProperties(state, instance, schema, ctx);

    case "patternProperties":
        return validatePatternProperties(state, instance, schema, ctx);

    case "additionalProperties":
        return validateAdditionalProperties(state, instance, schema, ctx);

    case "minProperties":
        return validateMinProperties(state, instance, schema, ctx);

    case "maxProperties":
        return validateMaxProperties(state, instance, schema, ctx);

    case "items":
        return validateItems(state, instance, schema, ctx);

    case "minimum":
        return validateMinimum(state, instance, schema, ctx);

    case "maximum":
        return validateMaximum(state, instance, schema, ctx);

    case "multipleOf":
        return validateMultipleOf(state, instance, schema, ctx);

    case "divisibleBy":
        return validateDivisibleBy(state, instance, schema, ctx);

    case "required":
        return validateRequired(state, instance, schema, ctx);

    case "pattern":
        return validatePattern(state, instance, schema, ctx);

    case "format":
        return validateFormat(state, instance, schema, ctx);

    case "minLength":
        return validateMinLength(state, instance, schema, ctx);

    case "maxLength":
        return validateMaxLength(state, instance, schema, ctx);

    case "minItems":
        return validateMinItems(state, instance, schema, ctx);

    case "maxItems":
        return validateMaxItems(state, instance, schema, ctx);

    case "uniqueItems":
        return validateUniqueItems(state, instance, schema, ctx);

    case "dependencies":
        return validateDependencies(state, instance, schema, ctx);

    case "enum":
        return validateEnum(state, instance, schema, ctx);

    case "const":
        return validateConst(state, instance, schema, ctx);

    case "not":
    case "disallow":
        return validateDisallow(state, instance, schema, ctx);
    }
}

function validateType(state, instance, schema, ctx) {
    if (instance === void(0)) {
        return null;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    var types = Array.isArray(schema.type) ? schema.type : [schema.type];

    const some = List.some(types,
            type => testType(state, instance, ctx, type));

    if (some === false) {
        const list = List.map(types, v => v.id && ('<' + v.id + '>') || (v+''));
        result.addError({
            name: 'type',
            argument: list,
            message: "is not of a type(s) " + list,
        });
    }

    return result;
}

function validateAnyOf(state, instance, schema, ctx) {
    // Ignore undefined instances
    if (instance === undefined) {
        return null;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    var inner = new ValidatorResult(state, instance, schema, ctx);

    if (!Array.isArray(schema.anyOf)){
        throw new SchemaError("anyOf must be an array");
    }
    const some = List.some(schema.anyOf, s => {
        return testSchemaNoThrow(state,
                                 instance,
                                 s,
                                 ctx,
                                 res => inner.importErrors(res));
    });

    if (some === false) {
        var list = schema.anyOf.map(function (v, i) {
            return (v.id && ('<' + v.id + '>')) || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
        });

        if (state.nestedErrors) {
            result.importErrors(inner);
        }

        result.addError({
            name: 'anyOf',
            argument: list,
            message: "is not any of " + list.join(','),
        });
    }

    return result;
}

function validateAllOf(state, instance, schema, ctx) {
   // Ignore undefined instances
    if (instance === undefined) {
        return null;
    }
    if (!Array.isArray(schema.allOf)){
        throw new SchemaError("allOf must be an array");
    }
    var result = new ValidatorResult(state, instance, schema, ctx);

    schema.allOf.forEach(function(v, i){
        var valid = validateSchema(state, instance, v, ctx);
        if(!valid.valid){
            var msg = (v.id && ('<' + v.id + '>')) || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
            result.addError({
                name: 'allOf',
                argument: { id: msg, length: valid.errors.length, valid: valid },
                message: 'does not match allOf schema ' + msg + ' with ' + valid.errors.length + ' error[s]:',
            });
            result.importErrors(valid);
        }
    });

    return result;
}

function validateOneOf(state, instance, schema, ctx) {
   // Ignore undefined instances
    if (instance === undefined) {
        return null;
    }

    if (!Array.isArray(schema.oneOf)){
        throw new SchemaError("oneOf must be an array");
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    var inner = new ValidatorResult(state, instance, schema, ctx);
    const count = List.filter(schema.oneOf, schema => {
        const res = testSchemaNoThrow(state,
                                      instance,
                                      schema,
                                      ctx,
                                      res => inner.importErrors(res));
        return res ? true : false;
    });
    var list = schema.oneOf.map(function (v, i) {
        return (v.id && ('<' + v.id + '>')) || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
    });

    if (List.len(count) !== 1) {
        if (state.nestedErrors) {
            result.importErrors(inner);
        }
        result.addError({
            name: 'oneOf',
            argument: list,
            message: "is not exactly one from " + list.join(','),
        });
    }

    return result;
}

function validateProperties(state, instance, schema, ctx) {
    if (testObject(instance) === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    var properties = schema.properties || {};
    for (var property in properties) {
        if (state.preValidateProperty) {
            state.preValidateProperty(instance,
                                      property,
                                      properties[property],
                                      ctx);
        }

        var prop = Object.hasOwnProperty.call(instance, property) ? instance[property] : undefined;
        var res = validateSchema(state, prop, properties[property], ctx.makeChild(properties[property], property));
        if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
        result.importErrors(res);
    }

    return result;
}

function validatePatternProperties(state, instance, schema, ctx) {
    if (testObject(instance) === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    var patternProperties = schema.patternProperties || {};

    for (var property in instance) {
        var test = true;
        for (var pattern in patternProperties) {
            var expr = new RegExp(pattern);
            if (!expr.test(property)) {
                continue;
            }
            test = false;

            if (state.preValidateProperty) {
                state.preValidateProperty(instance,
                                          property,
                                          patternProperties[pattern],
                                          ctx);
            }

            const res = validateSchema(state,
                                       instance[property],
                                       patternProperties[pattern],
                                       ctx.makeChild(patternProperties[pattern],
                                       property));
            if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
            result.importErrors(res);
        }

        if (test) {
            testAdditionalProperty(state,
                                   instance,
                                   schema,
                                   ctx,
                                   property,
                                   result);
        }
    }

    return result;
}

function validateAdditionalProperties(state, instance, schema, ctx) {
    if (testObject(instance) === false) {
        return;
    }

    // if patternProperties is defined then we'll test when that one is called
    // instead
    if (schema.patternProperties) {
        return null;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);

    for (var property in instance) {
        testAdditionalProperty(state,
                               instance,
                               schema,
                               ctx,
                               property,
                               result);
    }

    return result;
}

function validateMinProperties(state, instance, schema, ctx) {
    if (testObject(instance) === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    var keys = Object.keys(instance);
    if (!(keys.length >= schema.minProperties)) {
        result.addError({
            name: 'minProperties',
            argument: schema.minProperties,
            message: "does not meet minimum property length of " + schema.minProperties,
        });
    }

    return result;
}

function validateMaxProperties(state, instance, schema, ctx) {
    if (testObject(instance) === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    var keys = Object.keys(instance);
    if (!(keys.length <= schema.maxProperties)) {
        result.addError({
            name: 'maxProperties',
            argument: schema.maxProperties,
            message: "does not meet maximum property length of " + schema.maxProperties,
        });
    }

    return result;
}

function validateItems(state, instance, schema, ctx) {
    if (Array.isArray(instance) === false) {
        return;
    }

    if (!schema.items) {
        return;
    }

    const  result = new ValidatorResult(state, instance, schema, ctx);
    instance.every(function (value, i) {
        var items = Array.isArray(schema.items) ? (schema.items[i] || schema.additionalItems) : schema.items;
        if (items === undefined) {
            return true;
        }
        if (items === false) {
            result.addError({
                name: 'items',
                message: "additionalItems not permitted",
            });
            return false;
        }
        var res = validateSchema(state, value, items, ctx.makeChild(items, i));

        if(res.instance !== result.instance[i]) {
            result.instance[i] = res.instance;
        }

        result.importErrors(res);

        return true;
    });

    return result;
}

function validateMinimum(state, instance, schema, ctx) {
    if (typeof instance !== "number" || Number.isFinite(instance) === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    var valid = true;

    if (schema.exclusiveMinimum && schema.exclusiveMinimum === true) {
        valid = instance > schema.minimum;
    } else {
        valid = instance >= schema.minimum;
    }

    if (!valid) {
        result.addError({
            name: 'minimum',
            argument: schema.minimum,
            message: "must have a minimum value of " + schema.minimum,
        });
    }

    return result;
}

function validateMaximum(state, instance, schema, ctx) {
    if (typeof instance !== "number" || Number.isFinite(instance) === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    var valid;
    if (schema.exclusiveMaximum && schema.exclusiveMaximum === true) {
        valid = instance < schema.maximum;
    } else {
        valid = instance <= schema.maximum;
    }

    if (!valid) {
        result.addError({
            name: 'maximum',
            argument: schema.maximum,
            message: "must have a maximum value of " + schema.maximum,
        });
    }

    return result;
}

function validateMultipleOf(state, instance, schema, ctx) {
    return validateMultipleOfOrDivisbleBy.call(this, state, instance, schema, ctx, "multipleOf", "is not a multiple of (divisible by) ");
}

function validateDivisibleBy(state, instance, schema, ctx) {
    return validateMultipleOfOrDivisbleBy.call(this, state, instance, schema, ctx, "divisibleBy", "is not divisible by (multiple of) ");
}

function validateRequired(state, instance, schema, ctx) {
    var result = new ValidatorResult(state, instance, schema, ctx);

    if (instance === undefined && schema.required === true) {
        // A boolean form is implemented for reverse-compatability with schemas
        // written against older drafts
        result.addError({
            name: 'required',
            message: "is required"
        });
    } else if (testObject(instance) && Array.isArray(schema.required)) {
        schema.required.forEach(function(n){
            if (instance[n]===undefined){
                result.addError({
                    name: 'required',
                    argument: n,
                    message: "requires property " + JSON.stringify(n),
                });
            }
        });
    }

    return result;
}

function validatePattern(state, instance, schema, ctx) {
    if (typeof instance === "string" === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);

    if (!instance.match(schema.pattern)) {
        result.addError({
            name: 'pattern',
            argument: schema.pattern,
            message: "does not match pattern " + JSON.stringify(schema.pattern),
        });
    }

    return result;
}

function validateFormat(state, instance, schema, ctx) {
    if (instance === void(0)) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);

    if (!state.disableFormat && isFormat(instance, schema.format) === false) {
        result.addError({
            name: 'format',
            argument: schema.format,
            message: "does not conform to the " + JSON.stringify(schema.format) + " format",
        });
    }

    return result;
}

function validateMinLength(state, instance, schema, ctx) {
    if (typeof instance === "string" === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    var hsp = instance.match(/[\uDC00-\uDFFF]/g);
    var length = instance.length - (hsp ? hsp.length : 0);

    if (!(length >= schema.minLength)) {
        result.addError({
            name: 'minLength',
            argument: schema.minLength,
            message: "does not meet minimum length of " + schema.minLength,
        });
    }

    return result;
}

function validateMaxLength(state, instance, schema, ctx) {
    if (typeof instance === "string" === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    // TODO if this was already computed in "minLength", use that value instead
    //  of re-computing

    var hsp = instance.match(/[\uDC00-\uDFFF]/g);
    var length = instance.length - (hsp ? hsp.length : 0);

    if (!(length <= schema.maxLength)) {
        result.addError({
            name: 'maxLength',
            argument: schema.maxLength,
            message: "does not meet maximum length of " + schema.maxLength,
        });
    }

    return result;
}

function validateMinItems(state, instance, schema, ctx) {
    if (Array.isArray(instance) === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    if (!(instance.length >= schema.minItems)) {
        result.addError({
            name: 'minItems',
            argument: schema.minItems,
            message: "does not meet minimum length of " + schema.minItems,
        });
    }

    return result;
}

function validateMaxItems(state, instance, schema, ctx) {
    if (Array.isArray(instance) === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    if (!(instance.length <= schema.maxItems)) {
        result.addError({
            name: 'maxItems',
            argument: schema.maxItems,
            message: "does not meet maximum length of " + schema.maxItems,
        });
    }

    return result;
}

function validateUniqueItems(state, instance, schema, ctx) {
    if (Array.isArray(instance) === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);

    if (!instance.every(testArrays)) {
        result.addError({
            name: 'uniqueItems',
            message: "contains duplicate item",
        });
    }

    return result;
}

function validateDependencies(state, instance, schema, ctx) {
    if (testObject(instance) === false) {
        return;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);

    for (var property in schema.dependencies) {
        if (instance[property] === undefined) {
            continue;
        }
        var dep = schema.dependencies[property];
        var childContext = ctx.makeChild(dep, property);
        if (typeof dep == 'string') {
            dep = [dep];
        }
        if (Array.isArray(dep)) {
            dep.forEach(function (prop) {
                if (instance[prop] === undefined) {
                    result.addError({
                        // FIXME there's two different "dependencies" errors here with slightly different outputs
                        // Can we make these the same? Or should we create different error types?
                        name: 'dependencies',
                        argument: childContext.propertyPath,
                        message: "property " + prop + " not found, required by " + childContext.propertyPath,
                    });
                }
            });
        } else {
            var res = validateSchema(state, instance, dep, childContext);
            if(result.instance !== res.instance) result.instance = res.instance;
            if (res && res.errors.length) {
                result.addError({
                    name: 'dependencies',
                    argument: childContext.propertyPath,
                    message: "does not meet dependency required by " + childContext.propertyPath,
                });
                result.importErrors(res);
            }
        }
    }

    return result;
}

function validateEnum(state, instance, schema, ctx) {
    if (instance === undefined) {
        return null;
    }

    if (!Array.isArray(schema['enum'])) {
        throw new SchemaError("enum expects an array", schema);
    }

    const result = new ValidatorResult(state, instance, schema, ctx);

    const matches = List.some(schema["enum"],
                        value => deepCompareStrict(instance, value));

    if (matches === false) {
        result.addError({
            name: "enum",
            argument: schema["enum"],
            message: "is not one of enum values: " + schema['enum'].map(String).join(','),
        });
    }

    return result;
}

function validateConst(state, instance, schema, ctx) {
    if (instance === undefined) {
        return null;
    }

    var result = new ValidatorResult(state, instance, schema, ctx);
    if (!deepCompareStrict(schema['const'], instance)) {
        result.addError({
            name: 'const',
            argument: schema['const'],
            message: "does not exactly match expected constant: " + schema['const'],
        });
    }

    return result;
}

function validateDisallow(state, instance, schema, ctx) {
    if (instance === void(0)) {
        return null;
    }

    const result = new ValidatorResult(state, instance, schema, ctx);
    let types = schema.not || schema.disallow;

    if (!types) {
        return null;
    }

    List.each(Array.isArray(types) ? types : [types], type => {
        if (testType(state, instance, ctx, type)) {
            const schemaId = type && type.id && ('<' + type.id + '>') || type;
            result.addError({
                name: 'not',
                argument: schemaId,
                message: "is of prohibited type " + schemaId,
            });
        }
    })

    return result;
}

function validateMultipleOfOrDivisbleBy(state,
                                        instance,
                                        schema,
                                        ctx,
                                        validationType,
                                        errorMessage) {
    if (typeof instance !== "number" || Number.isFinite(instance) === false) {
        return;
    }

    var validationArgument = schema[validationType];

    if (validationArgument == 0) {
        throw new SchemaError(validationType + " cannot be zero");
    }

    var result = new ValidatorResult(state, instance, schema, ctx);

    var instanceDecimals = getDecimalPlaces(instance);
    var divisorDecimals = getDecimalPlaces(validationArgument);

    var maxDecimals = Math.max(instanceDecimals , divisorDecimals);
    var multiplier = Math.pow(10, maxDecimals);

    if (Math.round(instance * multiplier) % Math.round(validationArgument * multiplier) !== 0) {
        result.addError({
            name: validationType,
            argument:  validationArgument,
            message: errorMessage + JSON.stringify(validationArgument)
        });
    }

    return result;
}

function makeSuffix(key) {
    const key2 = String(key);

    if (!key2.match(/[.\s\[\]]/) && !key2.match(/^[\d]/)) {
        return '.' + key;
    }

    if (key2.match(/^\d+$/)) {
        return '[' + key2 + ']';
    }

    return '[' + JSON.stringify(key2) + ']';
}

function stringizer(v,i) {
    return i+': '+v.toString()+'\n';
}

function testSchemaNoThrow(state, instance, schema, ctx, callback){
    const throwError = state.throwError;
    state.throwError = false;
    const res = validateSchema(state, instance, schema, ctx);
    state.throwError = throwError;

    if (!res.valid && typeof callback === "function") {
        callback(res);
    }

    return res.valid;
}

function testAdditionalProperty(state, instance, schema, ctx, property, result) {
    if (testObject(instance) === false) {
        return;
    }

    if (schema.properties && schema.properties[property] !== undefined) {
        return;
    }

    if (schema.additionalProperties === false) {
        result.addError({
            name: 'additionalProperties',
            argument: property,
            message: "additionalProperty " + JSON.stringify(property) + " exists in instance when not allowed",
        });
    } else {
        var additionalProperties = schema.additionalProperties || {};

        if (state.preValidateProperty) {
            state.preValidateProperty(instance,
                                      property,
                                      additionalProperties,
                                      ctx);
        }

        var res = validateSchema(state, instance[property], additionalProperties, ctx.makeChild(additionalProperties, property));
        if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
        result.importErrors(res);
  }
}

function testArrays(v, i, a) {
    var j, len = a.length;

    for (j = i + 1, len; j < len; j++) {
        if (deepCompareStrict(v, a[j])) {
            return false;
        }
    }

    return true;
}

function scanSchema(baseuri, schema, result=new SchemaScanResult){
    if(!schema || typeof schema!='object') return;
    // Mark all referenced schemas so we can tell later which schemas are
    // referred to, but never defined

    if(schema.$ref){
        var resolvedUri = Url.resolve(baseuri, schema.$ref);
        result.ref[resolvedUri] = result.ref[resolvedUri]
                                ? result.ref[resolvedUri] + 1 : 0;
        return;
    }

    const ourBaseUrl = schema.id ? Url.resolve(baseuri, schema.id) : baseuri;
    let ourBase = typeof ourBaseUrl === "string" ? ourBaseUrl : Url.format(ourBaseUrl);

    if (ourBase) {
        // If there's no fragment, append an empty one
        if (ourBase.indexOf('#') < 0) ourBase += '#';
        if (result.id[ourBase]) {
            if(!deepCompareStrict(result.id[ourBase], schema)) {
                throw new Error('Schema <'+schema+'> already exists with different definition');
            }

            return result.id[ourBase];
        }

        result.id[ourBase] = schema;
        // strip trailing fragment
        if(ourBase[ourBase.length-1]=='#'){
            result.id[ourBase.substring(0, ourBase.length-1)] = schema;
        }
    }

    scanArray(ourBase+'/items', ((schema.items instanceof Array)?schema.items:[schema.items]), result);
    scanArray(ourBase+'/extends', ((schema.extends instanceof Array)?schema.extends:[schema.extends]), result);
    scanSchema(ourBase+'/additionalItems', schema.additionalItems, result);
    scanObject(ourBase+'/properties', schema.properties, result);
    scanSchema(ourBase+'/additionalProperties', schema.additionalProperties, result);
    scanObject(ourBase+'/definitions', schema.definitions, result);
    scanObject(ourBase+'/patternProperties', schema.patternProperties, result);
    scanObject(ourBase+'/dependencies', schema.dependencies, result);
    scanArray(ourBase+'/disallow', schema.disallow), result;
    scanArray(ourBase+'/allOf', schema.allOf, result);
    scanArray(ourBase+'/anyOf', schema.anyOf, result);
    scanArray(ourBase+'/oneOf', schema.oneOf, result);
    scanSchema(ourBase+'/not', schema.not, result);

    return result;
}

function scanArray(baseuri, schemas, result) {
    if(!(schemas instanceof Array)) return;

    for(var i=0; i<schemas.length; i++) {
        scanSchema(baseuri+'/'+i, schemas[i], result);
    }
}

function scanObject(baseuri, schemas, result) {
    if(!schemas || typeof schemas!='object') return;

    for(var p in schemas){
        scanSchema(baseuri+'/'+p, schemas[p], result);
    }
}

function deepCompareStrict (a, b) {
    if (typeof a !== typeof b) {
        return false;
    }

    if (a instanceof Array) {
        if (!(b instanceof Array)) {
            return false;
        }

        if (a.length !== b.length) {
            return false;
        }

        return a.every((_, i) => {
            return deepCompareStrict(a[i], b[i]);
        });
    }

    if (typeof a === 'object') {
        if (!a || !b) {
            return a === b;
        }

        var aKeys = Object.keys(a);
        var bKeys = Object.keys(b);

        if (aKeys.length !== bKeys.length) {
            return false;
        }

        return aKeys.every(function (v) {
            return deepCompareStrict(a[v], b[v]);
        });
    }

    return a === b;
}

function schemaTraverser(schemaobj, s) {
    schemaobj.schema = deepMerge(superResolve(s, schemaobj.ctx), schemaobj.schema);
}


function superResolve(schema, ctx) {
    const ref = shouldResolve(schema);

    if (ref) {
        const {subschema} = resolveSchema(schema, ref, ctx);
        return subschema;
    }

    return schema;
}

function resolveSchema(schema, switchToSchema, ctx) {
    const switchSchema = ctx.resolve(switchToSchema);
    // First see if the schema exists under the provided URI

    if (ctx.schemas[switchSchema]) {
        return {subschema: ctx.schemas[switchSchema], switchSchema: switchSchema};
    }

    // Else try walking the property pointer
    var parsed = Url.parse(switchSchema);
    var fragment = parsed && parsed.hash;
    var document = fragment && fragment.length && switchSchema.substr(0, switchSchema.length - fragment.length);

    if (!document || !ctx.schemas[document]) {
        throw new SchemaError("no such schema <" + switchSchema + ">", schema);
    }

    const subschema = objectGetPath(ctx.schemas[document], fragment.substr(1));

    if (subschema === void(0)) {
        throw new SchemaError("no such schema " + fragment + " located in <" + document + ">", schema);
    }

    return {subschema, switchSchema};
}

function shouldResolve(schema) {
    const ref = (typeof schema === 'string') ? schema : schema.$ref;

    if (typeof ref=='string') {
        return ref;
    }

    return false;
}

function objectGetPath(o, s) {
    var parts = s.split('/').slice(1);
    var k;

    while (typeof (k=parts.shift()) == 'string') {
        var n = decodeURIComponent(k.replace(/~0/,'~').replace(/~1/g,'/'));
        if (!(n in o)) return;
        o = o[n];
    }

    return o;
}

function deepMerge(src, target) {
    if (Array.isArray(src)) {
        return deepMergeArray(src, target);
    }

    return deepMergeObject(target, src);
}

function deepMergeArray(src, target=[]) {
    let result = [];

    List.each(src, (item, idx) => {
        if (typeof item === "object") {
            result[idx] = deepMerge(item, target[idx]);
        } else if (target.indexOf(item) === -1) {
            result.push(item);
        }
    })

    return List.merge([target], result)
}

function deepMergeObject(src, target) {
    if (target && typeof target === "object") {
        return Dict.fromlist(Object.keys(target), k => ({[k]: target[k]}));
    }

    return Dict.fromlist(Object.keys(src), key => {
        if (typeof src[key] !== 'object' || !src[key]) {
            return {[key]: src[key]};
        } else if (!target[key]) {
            return {[key]: src[key]};
        } else {
            return deepMerge(src[key], target[key]);
        }
    });
}

function getDecimalPlaces(number) {
    let decimalPlaces = 0;

    if (isNaN(number)) {
        return decimalPlaces;
    }

    if (typeof number !== 'number') {
        number = Number(number);
    }

    const parts = number.toString().split('e');

    if (parts.length === 2) {
        if (parts[1][0] !== '-') {
            return decimalPlaces;
        } else {
            decimalPlaces = Number(parts[1].slice(1));
        }
    }

    const decimalParts = parts[0].split('.');

    if (decimalParts.length === 2) {
        decimalPlaces += decimalParts[1].length;
    }

    return decimalPlaces;
}

function testObject(value) {
    // TODO: fix this - see #15
    const result = value
        && (typeof value) === 'object'
        && !(value instanceof Array)
        && !(value instanceof Date);

    return !!result;
}

function testType(state, instance, ctx, type) {
    switch (type) {
    default:
        if( type && typeof type === "object") {
            const result = validateSchema(state, instance, type, ctx);
            return result === void(0) || !(result && result.errors.length);
        }
        return true;

    case "string":
        return typeof instance === "string";

    case "number":
        return typeof instance == 'number' && Number.isFinite(instance);

    case "integer":
        return (typeof instance == 'number') && instance % 1 === 0;

    case "boolean":
        return typeof instance == 'boolean';

    case "array":
        return Array.isArray(instance);

    case "null":
        return instance === null;

    case "date":
        return instance instanceof Date;

    case "any":
        return true;

    case "object":
        return testObject(instance);

    }
}

function isFormat(input, format) {
    switch (format) {
    default:
        return true;

    case "date-time":
        return isDateTimeFormat(input);

    case "date":
        return isDateFormat(input);

    case "time":
        return isTimeFormat(input);

    case "email":
        return isEmailFormat(input);

    case "ip-address":
        return isIpAddressFormat(input);

    case "ipv6":
        return isIPV6Format(input);

    case "uri":
        return isUriFormat(input);

    case "color":
        return isColorFormat(input);

    case "hostname":
    case "host-name":
        return isHostnameFormat(input);

    case "alpha":
        return isAlphaFormat(input);

    case "alphanumeric":
        return isAlphaNumericFormat(input);

    case "utc-millisec":
        return isUtcMillisecFormat(input);

    case "regex":
        return isRegExFormat(input);

    case 'style':
        return isStyleFormat(input);

    case "phone":
        return isPhoneFormat(input);
    }
}

function isDateTimeFormat(input) {
    return /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\.\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9]))$/.test(input);
}

function isDateFormat(input) {
    return /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])$/.test(input);
}

function isTimeFormat(input) {
    return /^(2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])$/.test(input);
}

function isEmailFormat(input) {
    return /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/.test(input);
}

function isIpAddressFormat(input) {
    return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(input);
}

function isIPV6Format(input) {
    return /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(input);
}

function isUriFormat(input) {
    return /^[a-zA-Z][a-zA-Z0-9+-.]*:[^\s]*$/.test(input);
}

function isColorFormat(input) {
    return /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/.test(input);
}

function isHostnameFormat(input) {
    return /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/.test(input);
}

function isAlphaFormat(input) {
    return /^[a-zA-Z]+$/.test(input);
}

function isAlphaNumericFormat(input) {
    return /^[a-zA-Z0-9]+$/.test(input);
}

function isUtcMillisecFormat(input) {
    return (typeof input === 'string')
        && parseFloat(input) === parseInt(input, 10)
        && !isNaN(input);
}

function isRegExFormat(input) {
    try {
        new RegExp(input);
        return true;
    } catch (e) {
        return  false;
    }
}

function isStyleFormat(input) {
    return /\s*(.+?):\s*([^;]+);?/g.test(input);
}

function isPhoneFormat(input) {
    return /^\+(?:[0-9] ?){6,14}[0-9]$/.test(input);
}
