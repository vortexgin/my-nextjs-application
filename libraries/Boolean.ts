export function isTrue(value: any) {
    return ["true", "True", "TRUE", "1", 1, true].includes(value);
}

export function isFalse(value: any) {
    return ["false", "False", "FALSE", "0", 0, false].includes(value);
}