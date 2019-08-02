import * as V from 'validator-ts'
export * from 'validator-ts'

const isHexBytes = (val: string, n?: number) => {
    if (typeof val !== 'string' || !/^0x[0-9a-f]*$/i.test(val)) {
        return false
    }
    return n ? val.length === n * 2 + 2 : val.length % 2 === 0
}

const isHexString = (val: string) => {
    return typeof val === 'string' && /^0x[0-9a-f]+$/i.test(val)
}

const isDecString = (val: string) => {
    return typeof val === 'string' && /^[0-9]+$/.test(val)
}

const isUInt = (val: number, bit: number) => {
    if (val < 0 || !Number.isInteger(val)) {
        return false
    }
    return bit ? val < 2 ** bit : true
}

export function isBigInt(v: number | string) {
    return typeof v === 'string' ?
        (isDecString(v) || isHexString(v)) :
        isUInt(v, 0)
}

export namespace Rules {
    export const Address: V.Rule<string> = (val) => {
        if (!isHexBytes(val, 20)) {
            return 'expected address'
        }
        return ''
    }
    export const HexBytes: V.Rule<string> = (val) => {
        if (!isHexBytes(val)) {
            return 'expected bytes in hex string'
        }
        return ''
    }
    export const BigInt: V.Rule<string | number> = (val) => {
        if (!isBigInt(val)) {
            return 'expected big int in string or number'
        }
        return ''
    }
}
