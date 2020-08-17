import {List} from "//es.parts/ess/0.0.1/";
import {Str} from "//es.parts/ess/0.0.1/";

import * as JsonSchema from "../src/JsonSchema.mjs";

export {testSimpleObjectValidObject};
export {testSimpleObjectValidUndefinedObject};
export {testSimpleObjectShouldNotValidateNumber};
export {testSimpleObjectShouldNotValidateArray};
export {testSimpleObjectWithArrayShouldPass};
export {testSimpleObjectWithInvalidArrayShouldFail};

export {testObjectWithPropValidObject};
export {testObjectWithMultipleProps};
export {testObjectWithUndefinedProp};

export {testThrowOnANonObjectCheck};

export {testShouldNotValidateValidNestedObject};
export {testShouldValidateValidNestedObject};
export {testUndefButRequiredObjectShouldNotValidate};
export {testShouldPassIfThereNoAdditionalProps};
export {testShouldFailIfThereAdditionalProps};
export {testShouldPassIfCompliantAdditionalProps}
export {testShouldFailIfCompliantNotAdditionalProps};

export {testArgumentsArePure};

export {testSimpleArrayPassEmptyArray};
export {testSimpleArrayPassUndefinedArray};
export {testSimpleArrayPassStringArray};
export {testSimpleArrayFailNonStringArray};
export {testSimpleArrayFailNonArray};

export {testMinItemsWithMoreItems};
export {testMinItemsWithSameItems};
export {testMinItemsWithLessItems};

export {testMaxItemsWithMoreItems};
export {testMaxItemsWithSameItems};
export {testMaxItemsWithLessItems};

export {testUniqueNoDuplicateItems};
export {testUniqueNoDuplicateObjects};
export {testUniqueDuplicateNumbers};
export {testUniqueDuplicateObjects};
export {testUniqueNotArray};

export {testKeywordConst};
export {testKeywordConstInvalid};
export {testKeywordConstValidObject};
export {testKeywordConstInvalidObjects};

export {testNumber};
export {testStringNumber};
export {testNaNNumber};
export {testInfinityNumber};
export {testNegativeInfinityNumber};
export {testValidateRequiredUndefined};

export {testShouldValidateNull};
export {testShouldNotValidateNoNull};
export {testShouldNotValidateUndefined};
export {testShouldValidateBoolTrue};
export {testShouldValidateBoolFalse};
export {testShouldNotValidateNonBool};
export {testShouldNotValidateBoolRequiredUndef};
export {testShouldValidateTrueAsAny};
export {testShouldValidateStringTrueAsAny};
export {testShouldValidateZeroAsAny};
export {testShouldValidateDateAsAny};
export {testShouldNotValidateUndefAsAny};

export {testValidateNumberMeetsMinimum};
export {testValidateNumberNotMeetsMinimum};
export {testValidateNumberMeetsMinimumUsingExclusive};
export {testValidateNumberNorMeetsMinimumUsingExclusive};

export {testValidateNumberMeetsMaximum};
export {testValidateNumberNotMeetsMaximum};
export {testValidateNumberMeetsMaximumUsingExclusive};
export {testValidateNumberNorMeetsMaximumUsingExclusive};

export {testValidateMinMaxCombined};
export {testNotValidateMinMaxCombined};

export {testDivisibleByZeroEven};
export {testDivisibleByNegTwoEven};
export {testDivisibleByOneEven};
export {testDivisibleByWithDeximals};

export {testMultipleOfZeroEven};
export {testMultipleOfNegTwoEven};
export {testMultipleOfOneEven};
export {testMultipleOfWithDeximals};

export {testPatternString};
export {testPatternRegexp};
export {testPatternStringFail};

export {testStringMinLenValid};
export {testStringMinLenInvalid};
export {testStringMaxLenValid};
export {testStringMaxLenInvalid};

export {testEnumStringValueMatch};
export {testEnumStringNotMatch};
export {testEnumNumberValueMatch};
export {testEnumNumbergNotMatch};
export {testEnumShouldValidateDefaultIfUndef};
export {testEnumFailUndefIfDefaultIsGiven}
export {testEnumFailRequiredOmmited};
export {testEnumFailRequiredFieldIsUndefined};
export {testEnumFailRequiredFieldInListUndefined};
export {testEnumShouldValidateValueOutOfEnum};

export {testDescriptionIsIgnored};

export {testDisallowProhibitTypes};
export {testDisallowUnprohibitTypes};

export {testDepsMissingNonDepsProps};
export {testDepsMissingDeps};
export {testDepsSatifiedDeps};

export {testDateTime};
export {testDateTimeWithMilli};
export {testDateTimeWithTimezone};
export {testDateTimeWithZ};
export {testDateTimeWithSpaceInsteafOfT};
export {testDateTimeFailWhenMissingTime};
export {testDateTimeFailWhenBothTimezoneAndZ};

export {testValidDate};
export {testInvalidDate};
export {testValidTime};
export {testInvalidTime};
export {testValidUtcMilli};
export {testInvalidUtcMilli};
export {testValidRegex};
export {testInvalidRegex};

export {testNamedColor};
export {testHexColor};
export {testRgbColor};
export {testInvalidColor};
export {testValidStyle};
export {testValidComplexStyl};
export {testInvalidStyle};
export {testValidPhone};
export {testInvalidPhone};
export {testValidUri};
export {testRelativeUri};
export {testInvalidUri};

export {testValidEmail};
export {testInvalidEmail};
export {testValidIpAddress};
export {testInvalidIpAddress};
export {testValidIpv6};
export {testInvalidIpv6};
export {testValidHostname};
export {testInvalidHostname};
export {testValidAlpha};
export {testInvalidAlpha};
export {testValidAlphanum};
export {testInvalidAlphanum};

export {testValidAnyOf};
export {testInvalidAnyOf};
export {testAnyOfNotThrow};
export {testValidOneOf};
export {testInvalidOneOf};
export {testOneOfNotThrow};


function testSimpleObjectValidObject() {
    shouldPass({}, {'type': 'object'});
}

function testSimpleObjectValidUndefinedObject() {
    shouldPass(undefined, {'type': 'object'});
}

function testSimpleObjectShouldNotValidateNumber() {
    shouldFail(0, {'type': 'object'}, "instance is not of a type(s) object");
}

function testSimpleObjectShouldNotValidateArray() {
    shouldFail([0], {'type': 'object'}, "instance is not of a type(s) object");
}

function testSimpleObjectWithArrayShouldPass() {
    const data = {
        'name':'test',
        'lines': ['1']
    };

    const schema = {
        'type': 'object',
        'properties': {
            'name': {'type': 'string'},
            'lines': {
                'type': 'array',
                'items': {'type': 'string'}
            }
        }
    };

    shouldPass(data, schema);
}

function testSimpleObjectWithInvalidArrayShouldFail() {
    const data = {
        'name':'test',
        'lines': [1]
    };

    const schema = {
        'type': 'object',
        'properties': {
            'name': {'type': 'string'},
            'lines': {
                'type': 'array',
                'items': {'type': 'string'}
            }
        }
    };

    shouldFail(data, schema, "instance.lines[0] is not of a type(s) string");
}

function testObjectWithPropValidObject() {
    const schema = {
        'type': 'object',
        'properties': {
            'name': {'type': 'string'}
        }
    };

    shouldPass({'name': 'test'}, schema);
}

function testObjectWithMultipleProps() {
    const schema = {
        'type': 'object',
        'properties': {
            'name': {'type': 'string'},
            'address': {'type': 'string'}
        }
    };

    shouldPass({'name': 'test', 'address': 'someplace'}, schema);
}

function testObjectWithUndefinedProp() {
    const schema = {
        'type': 'object',
        'properties': {
          'name': {'type': 'string'},
          'address': {'type': 'string'}
        }
    };

    shouldPass({'name': 'test'}, schema);
}

function testThrowOnANonObjectCheck() {
    const schema = {
        'type': 'object',
        'properties': {
            'name': {'type': 'string'}
        }
    };

    shouldFail(null, schema, "instance is not of a type(s) object");
}

function testShouldNotValidateValidNestedObject() {
    const data = {
        "name": "test",
        "nested": "test2",
    };

    const schema = {
      'type': 'object',
      'properties': {
        'name': {'type': 'string'},
        'nested': {'type': 'object'}
      }
    };

    shouldFail(data, schema, "instance.nested is not of a type(s) object");
}

function testShouldValidateValidNestedObject() {
    const data = {
        'name': 'test',
        'nested': 'test2'
    };

    const schema = {
        'type': 'object',
        'properties': {
          'name': {'type': 'string'},
          'nested': {'type': 'string'}
        }
    };

    shouldPass(data, schema);
}

function testUndefButRequiredObjectShouldNotValidate() {
    const data = {'foo': {'baz': 1}};

    const schema = {
        'type': 'object',
        'required': true,
        'properties': {
          'foo': {
            'type': 'object',
            'required': true,
            'properties': {
              'bar': {'type': 'object', 'required': true},
              'baz': {'type': 'number', 'required': true}
            }
          }
        }
    };

    shouldFail(data, schema, "instance.foo.bar is required");
}

function testShouldPassIfThereNoAdditionalProps() {
    const schema = {
        'type': 'object',
        'properties': {
          'name': {'type': 'string'},
          'nested': {'type': 'string'}
        },
        'additionalProperties': false
    };

    const data = {'name': 'test', 'nested': 'test2'};

    shouldPass(data, schema);
}

function testShouldFailIfThereAdditionalProps() {
    const data = {
        'name': 'test',
        'nested': 'test2',
        'extraProp': 1
    };

    const schema = {
        'type': 'object',
        'properties': {
          'name': {'type': 'string'},
          'nested': {'type': 'string'}
        },
        'additionalProperties': false
    };

    shouldFail(data, schema, "instance additionalProperty \"extraProp\" exists in instance when not allowed");
}

function testShouldPassIfCompliantAdditionalProps() {
    const data = {'name': 'test', 'nested': 'test2', 'extraProp': 1};

    const schema = {
        'type': 'object',
        'properties': {
          'name': {'type': 'string'},
          'nested': {'type': 'string'}
        },
        'additionalProperties': {'type': 'number'}
    };

    shouldPass(data, schema);
}

function testShouldFailIfCompliantNotAdditionalProps() {
    const data = {'name': 'test', 'nested': 'test2', 'extraProp': '1'};

    const schema = {
        'type': 'object',
        'properties': {
          'name': {'type': 'string'},
          'nested': {'type': 'string'}
        },
        'additionalProperties': {'type': 'number'}
    };

    shouldFail(data, schema, "instance.extraProp is not of a type(s) number");
}

function testArgumentsArePure() {
    const data = {
        "foo": [1,2,3],
        "bar": 2
    };

    const schema = {
        "dependencies": {
            "bar": {
                "properties": {
                    "foo": {
                      "type": "array",
                      "items": {"type":"integer"}
                    },
                    "bar": {"type": "integer"}
                },
                "required": ["foo", "bar"]
            }
        }
    };

    Object.freeze(data.foo);
    Object.freeze(data);

    shouldPass(data, schema);

}

function testSimpleArrayPassEmptyArray() {
    shouldPass([], {'type': 'array', 'items': {'type': 'string'}});
}

function testSimpleArrayPassUndefinedArray() {
    shouldPass(void(0), {'type': 'array', 'items': {'type': 'string'}});
}

function testSimpleArrayPassStringArray() {
    shouldPass(['1', '2', '3'], {'type': 'array', 'items': {'type': 'string'}});
}

function testSimpleArrayFailNonStringArray() {
    shouldFail(['1', '2', '3', 4],
               {'type': 'array', 'items': {'type': 'string'}},
               "instance[3] is not of a type(s) string");
}

function testSimpleArrayFailNonArray() {
    shouldFail(0, {'type': 'array'}, "instance is not of a type(s) array");
}

function testMinItemsWithMoreItems() {
    const schema = {
        'type': 'array',
        'items': {
            'type': 'number'
        },
        'minItems': 2
    };

    shouldPass([1, 2, 3], schema);
}

function testMinItemsWithSameItems() {
    const schema = {
        'type': 'array',
        'items': {
            'type': 'number'
        },
        'minItems': 2
    };

    shouldPass([1, 2], schema);
}

function testMinItemsWithLessItems() {
    const schema = {
        'type': 'array',
        'items': {
            'type': 'number'
        },
        'minItems': 2
    };

    shouldFail([1], schema, "instance does not meet minimum length of 2");
}

function testMaxItemsWithMoreItems() {
    const schema = {
        'type': 'array',
        'items': {
            'type': 'number'
        },
        'maxItems': 2
    };

    shouldFail([1, 2, 3], schema, "instance does not meet maximum length of 2");
}

function testMaxItemsWithSameItems() {
    const schema = {
        'type': 'array',
        'items': {
            'type': 'number'
        },
        'maxItems': 2
    };

    shouldPass([1, 2], schema);
}

function testMaxItemsWithLessItems() {
    const schema = {
        'type': 'array',
        'items': {
            'type': 'number'
        },
        'maxItems': 2
    };

    shouldPass([1], schema);
}

function testUniqueNoDuplicateItems() {
    shouldPass([1], {'type': 'array', 'uniqueItems': true});
}

function testUniqueNoDuplicateObjects() {
    shouldPass([1, 2, "1", "2", {a:1}, {a:1, b:1}], {'type': 'array', 'uniqueItems': true});
}

function testUniqueDuplicateNumbers() {
    shouldFail([1, 2, 4, 1, 3, 5], {'type': 'array', 'uniqueItems': true}, "instance contains duplicate item");
}

function testUniqueDuplicateObjects() {
    shouldFail([{a:1}, {a:1}], {'type': 'array', 'uniqueItems': true}, "instance contains duplicate item");
}

function testUniqueNotArray() {
    shouldPass(null, {'type': 'any', 'uniqueItems': true});
}

function testKeywordConst() {
    shouldPass("value", { 'const': 'value' });
}

function testKeywordConstInvalid() {
    shouldFail([1, 2, 4, 1, 3, 5], { 'const': 'value' }, "instance does not exactly match expected constant: value");
    shouldFail([1, 2, 4, 1, 3, 5], { 'const': 'value' }, "instance does not exactly match expected constant: value");
}

function testKeywordConstValidObject() {
    const schema = {
        'const': {
            "some key": [ null, "1", 2, true ]
        }
    };

    shouldPass({"some key": [ null, "1", 2, true ]}, schema);
}

function testKeywordConstInvalidObjects() {
    const schema = {
        'const': {
            "some key": [ null, "1", 2, true ]
        }
    };

    shouldFail([null], schema, "instance does not exactly match expected constant: [object Object]");
    shouldFail({"some key": [ false, "1", 2, true ]}, schema, "instance does not exactly match expected constant: [object Object]");
    shouldFail(true, schema, "instance does not exactly match expected constant: [object Object]");
}

function testNumber() {
    shouldPass(0, {'type': 'number'});
}

function testStringNumber() {
    shouldFail("0", {'type': 'number'}, "instance is not of a type(s) number");
}

function testNaNNumber() {
    shouldFail(NaN, {'type': 'number'}, "instance is not of a type(s) number");
}

function testInfinityNumber() {
    shouldFail(Infinity, {'type': 'number'}, "instance is not of a type(s) number");
}

function testNegativeInfinityNumber() {
    shouldFail(-Infinity, {'type': 'number'}, "instance is not of a type(s) number");
}

function testValidateRequiredUndefined() {
    shouldFail(void(0), {'type': 'number', 'required': true}, "instance is required");
}

function testShouldValidateNull() {
    shouldPass(null, {'type': 'null'});
}

function testShouldNotValidateNoNull() {
    shouldFail('0', {'type': 'null'}, "instance is not of a type(s) null");
}

function testShouldNotValidateUndefined() {
    shouldFail(void(0), {'type': 'date', 'required': true}, "instance is required");
}

function testShouldValidateBoolTrue() {
    shouldPass(true, {'type': 'boolean'});
}

function testShouldValidateBoolFalse() {
    shouldPass(false, {'type': 'boolean'});
}

function testShouldNotValidateNonBool() {
    shouldFail('true', {'type': 'boolean'}, "instance is not of a type(s) boolean");
}

function testShouldNotValidateBoolRequiredUndef() {
    shouldFail(void(0), {'type': 'boolean', 'required': true}, "instance is required");
}

function testShouldValidateTrueAsAny() {
    shouldPass(true, {'type': 'any'});
}

function testShouldValidateStringTrueAsAny() {
    shouldPass('true', {'type': 'any'});
}

function testShouldValidateZeroAsAny() {
    shouldPass(0, {'type': 'any'});
}

function testShouldValidateDateAsAny() {
    shouldPass(new Date(), {'type': 'any'});
}

function testShouldNotValidateUndefAsAny() {
    shouldFail(void(0), {'type': 'any', 'required': true}, "instance is required");
}

function testValidateNumberMeetsMinimum() {
    shouldPass(1, {'type': 'number', 'minimum': '1'});
}

function testValidateNumberNotMeetsMinimum() {
    shouldFail(0, {'type': 'number', 'minimum': '1'}, "instance must have a minimum value of 1");
}

function testValidateNumberMeetsMinimumUsingExclusive() {
    shouldPass(2, {'type': 'number', 'minimum': '1', 'exclusiveMinimum': true});
}

function testValidateNumberNorMeetsMinimumUsingExclusive() {
    shouldFail(1, {'type': 'number', 'minimum': '1', 'exclusiveMinimum': true}, "instance must have a minimum value of 1");
}

function testValidateNumberMeetsMaximum() {
    shouldPass(1, {'type': 'number', 'maximum': '2'});
}

function testValidateNumberNotMeetsMaximum() {
    shouldFail(3, {'type': 'number', 'maximum': '2'}, "instance must have a maximum value of 2");
}

function testValidateNumberMeetsMaximumUsingExclusive() {
    shouldPass(1, {'type': 'number', 'maximum': '2', 'exclusiveMaximum': true});
}

function testValidateNumberNorMeetsMaximumUsingExclusive() {
    shouldFail(2, {'type': 'number', 'maximum': '2', 'exclusiveMaximum': true}, "instance must have a maximum value of 2");
}

function testValidateMinMaxCombined() {
    shouldPass(1, {'type': 'number', 'minimum': '1', 'maximum': '2'});
}

function testNotValidateMinMaxCombined() {
    shouldFail(3, {'type': 'number', 'minimum': '1', 'maximum': '2'}, "instance must have a maximum value of 2");
}

function testDivisibleByZeroEven() {
    shouldPass(2, {'type': 'number', 'divisibleBy': 2});
}

function testDivisibleByNegTwoEven() {
    shouldPass(-2, {'type': 'number', 'divisibleBy': 2});
}

function testDivisibleByOneEven() {
    shouldFail(1, {'type': 'number', 'divisibleBy': 2}, "instance is not divisible by (multiple of) 2");
}

function testDivisibleByWithDeximals() {
    shouldPass(2.4, {'type': 'number', 'divisibleBy': 0.1});
}

function testMultipleOfZeroEven() {
    shouldPass(2, {'type': 'number', 'multipleOf': 2});
}

function testMultipleOfNegTwoEven() {
    shouldPass(-2, {'type': 'number', 'multipleOf': 2});
}

function testMultipleOfOneEven() {
    shouldFail(1, {'type': 'number', 'multipleOf': 2}, "instance is not a multiple of (divisible by) 2");
}

function testMultipleOfWithDeximals() {
    shouldPass(2.4, {'type': 'number', 'multipleOf': 0.1});
}

function testPatternString() {
    shouldPass('abbbc', {'type': 'string', 'pattern': 'ab+c'});
}

function testPatternRegexp() {
    shouldPass('abbbc', {'type': 'string', 'pattern': /ab+c/});
}

function testPatternStringFail() {
    shouldFail('abac', {'type': 'string', 'pattern': 'ab+c'}, "instance does not match pattern \"ab+c\"");
}

function testStringMinLenValid() {
    shouldPass('abcde', {'type': 'string', 'minLength': 5});
}

function testStringMinLenInvalid() {
    shouldFail('abcde', {'type': 'string', 'minLength': 6}, "instance does not meet minimum length of 6");
}

function testStringMaxLenValid() {
    shouldPass('abcde', {'type': 'string', 'maxLength': 5});
}

function testStringMaxLenInvalid() {
    shouldFail('abcde', {'type': 'string', 'maxLength': 4}, "instance does not meet maximum length of 4");
}

function testEnumStringValueMatch() {
    shouldPass('abcde', {'type': 'string', 'enum': ['abcdf', 'abcde']});
}

function testEnumStringNotMatch() {
    shouldFail('abcde', {'type': 'string', 'enum': ['abcdf', 'abcdd']}, "instance is not one of enum values: abcdf,abcdd");
}

function testEnumNumberValueMatch() {
    shouldPass(1, {'type': 'number', 'enum': [1, 2]});
}

function testEnumNumbergNotMatch() {
    shouldFail(3, {'type': 'string', 'enum': [1, 2]}, "instance is not of a type(s) string");
}

function testEnumShouldValidateDefaultIfUndef() {
    shouldPass(void(0), {'enum': ['foo', 'bar', 'baz'], 'default': 'baz'});
}

function testEnumFailUndefIfDefaultIsGiven() {
    shouldFail(void(0), {'enum': ['foo', 'bar', 'baz'], 'required': true, 'default': 'baz'}, "instance is required");
}

function testEnumFailRequiredOmmited() {
    shouldFail({}, {'type': 'object', 'properties':{'the_field': {'enum': ['foo', 'bar', 'baz'], 'required': true}}}, "instance.the_field is required");
}

function testEnumFailRequiredFieldIsUndefined() {
    shouldFail({'the_field':undefined}, {'type': 'object', 'properties':{'the_field': {'enum': ['foo', 'bar', 'baz'], 'required': true}}}, "instance.the_field is required");
}

function testEnumFailRequiredFieldInListUndefined() {
    shouldFail({'the_field':undefined}, {'type': 'object', 'properties':{'the_field': {'enum': ['foo', 'bar', 'baz'] }}, required: ['the_field']}, "instance requires property \"the_field\"");
}

function testEnumShouldValidateValueOutOfEnum() {
    shouldPass({'the_field':'bar'}, {'type': 'object', 'properties':{'the_field': {'enum': ['foo', 'bar', 'baz'], 'required': true}}});
}

function testDescriptionIsIgnored() {
    shouldPass(1, {'description': 'some text'});
}

function testDisallowProhibitTypes() {
    shouldPass(1, {'type': 'any', 'disallow':'array'});
}

function testDisallowUnprohibitTypes() {
    shouldPass(1, {'type':'any', 'disallow':'array'});
}

function testDepsMissingNonDepsProps() {
    shouldPass({foo: 1}, {'dependencies': {'quux': ['foo', 'bar']}});
}

function testDepsMissingDeps() {
    shouldFail({quux: 1, foo: 1}, {'dependencies': {'quux': ['foo', 'bar']}}, "instance property bar not found, required by instance.quux");
}

function testDepsSatifiedDeps() {
    shouldPass({quux: 1, foo: 1, bar: 1}, {'dependencies': {'quux': ['foo', 'bar']}});
}

function testDateTime() {
    shouldPass("2012-07-08T16:41:41.532Z", {'type': 'string', 'format': 'date-time'});
}

function testDateTimeWithMilli() {
    shouldPass("2012-07-08T16:41:41Z", {'type': 'string', 'format': 'date-time'});
}

function testDateTimeWithTimezone() {
    shouldPass("2012-07-08T16:41:41.532+00:00", {'type': 'string', 'format': 'date-time'});
    shouldPass("2012-07-08T16:41:41.532+05:30", {'type': 'string', 'format': 'date-time'});
    shouldPass("2012-07-08T16:41:41.532+04:00", {'type': 'string', 'format': 'date-time'});
}

function testDateTimeWithZ() {
    shouldPass("2012-07-08T16:41:41.532z", {'type': 'string', 'format': 'date-time'});
    shouldPass("2012-07-08t16:41:41.532Z", {'type': 'string', 'format': 'date-time'});
}

function testDateTimeWithSpaceInsteafOfT() {
    shouldPass("2012-07-08 16:41:41.532Z", {'type': 'string', 'format': 'date-time'});
}

function testDateTimeFailWhenMissingTime() {
    shouldFail("2012-07-08", {'type': 'string', 'format': 'date-time'}, "instance does not conform to the \"date-time\" format");
}

function testDateTimeFailWhenBothTimezoneAndZ() {
    shouldFail("2012-07-08T16:41:41.532+00:00Z", {'type': 'string', 'format': 'date-time'}, "instance does not conform to the \"date-time\" format");
    shouldFail("2012-07-08T16:41:41.532+Z00:00", {'type': 'string', 'format': 'date-time'}, "instance does not conform to the \"date-time\" format");
}

function testValidDate() {
    shouldPass("2012-07-08", {'type': 'string', 'format': 'date'});
}

function testInvalidDate() {
    shouldFail("TEST2012-07-08", {'type': 'string', 'format': 'date'}, "instance does not conform to the \"date\" format");
}

function testValidTime() {
    shouldPass("16:41:41", {'type': 'string', 'format': 'time'});
}

function testInvalidTime() {
    shouldFail("16:41:41.532Z", {'type': 'string', 'format': 'time'}, "instance does not conform to the \"time\" format");
}

function testValidUtcMilli() {
    shouldPass("-1234567890", {'type': 'string', 'format': 'utc-millisec'});
}

function testInvalidUtcMilli() {
    shouldFail("16:41:41.532Z", {'type': 'string', 'format': 'utc-millisec'}, "instance does not conform to the \"utc-millisec\" format");
}

function testValidRegex() {
    shouldPass("/a/", {'type': 'string', 'format': 'regex'});
}

function testInvalidRegex() {
    shouldFail("/^(abc]/", {'type': 'string', 'format': 'regex'}, "instance does not conform to the \"regex\" format");
}

function testNamedColor() {
    shouldPass("red", {'type': 'string', 'format': 'color'});
}

function testHexColor() {
    shouldPass("#f00", {'type': 'string', 'format': 'color'});
}

function testRgbColor() {
    shouldPass("rgb(255,0,0)", {'type': 'string', 'format': 'color'});
}

function testInvalidColor() {
    shouldFail("json", {'type': 'string', 'format': 'color'}, "instance does not conform to the \"color\" format");
}

function testValidStyle() {
    shouldPass("color: red;", {'type': 'string', 'format': 'style'});
}

function testValidComplexStyl() {
    shouldPass("color: red; position: absolute; background-color: rgb(204, 204, 204); max-width: 150px;", {'type': 'string', 'format': 'style'});
    shouldPass("color:red;position:absolute; background-color:     rgb(204, 204, 204); max-width: 150px;", {'type': 'string', 'format': 'style'});
}

function testInvalidStyle() {
    shouldFail("0", {'type': 'string', 'format': 'style'}, "instance does not conform to the \"style\" format");
}

function testValidPhone() {
    shouldPass("+31 42 123 4567", {'type': 'string', 'format': 'phone'});
}

function testInvalidPhone() {
    shouldFail("31 42 123 4567", {'type': 'string', 'format': 'phone'}, "instance does not conform to the \"phone\" format");
}

function testValidUri() {
    shouldPass("http://www.google.com/", {'type': 'string', 'format': 'uri'});
    shouldPass("http://www.google.com/search", {'type': 'string', 'format': 'uri'});
}

function testRelativeUri() {
    shouldFail("tdegrunt", {'type': 'string', 'format': 'uri'}, "instance does not conform to the \"uri\" format");
}

function testInvalidUri() {
    shouldFail("The dog jumped", {'type': 'string', 'format': 'uri'}, "instance does not conform to the \"uri\" format");
}

function testValidEmail() {
    shouldPass("obama@whitehouse.gov", {'type': 'string', 'format': 'email'});
    shouldPass("barack+obama@whitehouse.gov", {'type': 'string', 'format': 'email'});
}

function testInvalidEmail() {
    shouldFail("obama@", {'type': 'string', 'format': 'email'}, "instance does not conform to the \"email\" format");
}

function testValidIpAddress() {
    shouldPass("192.168.0.1", {'type': 'string', 'format': 'ip-address'});
}

function testInvalidIpAddress() {
    shouldFail("192.168.0", {'type': 'string', 'format': 'ip-address'}, "instance does not conform to the \"ip-address\" format");
    shouldFail("256.168.0", {'type': 'string', 'format': 'ip-address'}, "instance does not conform to the \"ip-address\" format");
}

function testValidIpv6() {
    shouldPass("fe80::1%lo0", {'type': 'string', 'format': 'ipv6'});
    shouldPass("::1", {'type': 'string', 'format': 'ipv6'});
}

function testInvalidIpv6() {
    shouldFail("127.0.0.1", {'type': 'string', 'format': 'ipv6'}, "instance does not conform to the \"ipv6\" format");
    shouldFail("localhost", {'type': 'string', 'format': 'ipv6'}, "instance does not conform to the \"ipv6\" format");
}

function testValidHostname() {
    shouldPass("localhost", {'type': 'string', 'format': 'host-name'});
    shouldPass("www.google.com", {'type': 'string', 'format': 'host-name'});
}

function testInvalidHostname() {
    shouldFail("www.-hi-.com", {'type': 'string', 'format': 'host-name'}, "instance does not conform to the \"host-name\" format");
}

function testValidAlpha() {
    shouldPass("alpha", {'type': 'string', 'format': 'alpha'});
    shouldPass("abracadabra", {'type': 'string', 'format': 'alpha'});
}

function testInvalidAlpha() {
    shouldFail("www.-hi-.com", {'type': 'string', 'format': 'alpha'}, "instance does not conform to the \"alpha\" format");
}

function testValidAlphanum() {
    shouldPass("alpha", {'type': 'string', 'format': 'alphanumeric'});
    shouldPass("123", {'type': 'string', 'format': 'alphanumeric'});
    shouldPass("abracadabra123", {'type': 'string', 'format': 'alphanumeric'});
}

function testInvalidAlphanum() {
    shouldFail("1test!", {'type': 'string', 'format': 'alphanumeric'}, "instance does not conform to the \"alphanumeric\" format");
}

function testValidAnyOf() {
    const schema = {
        'type': 'object',
        'anyOf': [{
            'properties': {
                'name': {'type': 'string', 'enum': ['test1'] }
            }
        }, {
            'properties': {
                'name': {'type': 'string', 'enum': ['test2'] }
            }
        }]
    };

    shouldPass({ 'name': 'test2' }, schema);
}

function testInvalidAnyOf() {
    const schema = {
        'type': 'object',
        'anyOf': [{
            'properties': {
                'name': {'type': 'string', 'enum': ['test1'] }
            }
        }, {
            'properties': {
                'name': {'type': 'string', 'enum': ['test2'] }
            }
        }]
    };

    shouldFail({ 'name': 'test3' }, schema, "instance is not any of [subschema 0],[subschema 1]");
}

function testAnyOfNotThrow() {
    const schema = {
        'type': 'object',
        'anyOf': [{
            'properties': {
                'name': {'type': 'string', 'enum': ['test1'] }
            }
        }, {
            'properties': {
                'name': {'type': 'string', 'enum': ['test2'] }
            }
        }]
    };

    shouldPass({ 'name': 'test2' }, schema, { throwError: true });
}

function testValidOneOf() {
    const schema = {
        'type': 'object',
        'oneOf': [{
            'properties': {
                'name1': {'type': 'string', 'enum': ['test1'] }
            },
            'additionalProperties': false
        }, {
            'properties': {
                'name2': {'type': 'string', 'enum': ['test2'] }
            },
            'additionalProperties': false
        }]
    };

    shouldPass({ 'name2': 'test2' }, schema);
}

function testInvalidOneOf() {
    const schema = {
        'type': 'object',
        'oneOf': [{
            'properties': {
                'name1': {'type': 'string', 'enum': ['test1'] }
            },
            'additionalProperties': false
        }, {
            'properties': {
                'name2': {'type': 'string', 'enum': ['test2'] }
            },
            'additionalProperties': false
        }]
    };

    shouldFail({ 'name1': 'test1', 'name2': 'test2' }, schema, "instance is not exactly one from [subschema 0],[subschema 1]");
}

function testOneOfNotThrow() {
    const schema = {
        'type': 'object',
        'oneOf': [{
            'properties': {
                'name1': {'type': 'string', 'enum': ['test1'] }
            },
            'additionalProperties': false
        }, {
            'properties': {
                'name2': {'type': 'string', 'enum': ['test2'] }
            },
            'additionalProperties': false
        }]
    };

    shouldPass({ 'name2': 'test2' }, schema, { throwError: true });
}

// Internals

function shouldPass(data, schema, options={}) {
    const result = JsonSchema.validate(data, schema, options);

    if (!result.valid) {
        throw new Error(Str.join(result.errors, "\n"));
    }

    return true;
}

function shouldFail(data, schema, expectedErrorMessage, options={}) {
    const result = JsonSchema.validate(data, schema, options);

    if (result.valid) {
        throw new Error("Should be invalid");
    }

    const headError = List.head(result.errors);

    if (headError.stack !== expectedErrorMessage) {
        throw new Error(`Expected error message "${expectedErrorMessage}", got "${headError.stack}"`);
    }

    return true;
}
