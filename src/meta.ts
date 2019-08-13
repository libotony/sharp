
import * as V from './validator'
import { abi as ABICoder } from '@vechain/abi'

export class ContractMeta {
    private bytecode: string
    private abiJSON: object[]

    constructor(abi: object[], bytecode: string) {
        V.validate(bytecode, V.Rules.HexBytes, 'bytecode')
        V.validate(abi, [v => {
            return typeof v === 'object' ? '' : 'expected abi definition object'
        }])
        this.bytecode = bytecode
        this.abiJSON = abi
    }

    public ABI(name: string, type = 'function'): object {
        V.validate(type, val => {
            const types = ['function', 'event', 'constructor']
            if (types.indexOf(val) === -1) {
                return 'abi type only support function/event/constructor'
            }
            return ''
        }, type)

        const def = this.abiJSON.find((current: any) => {
            if (type === 'constructor' && current.type === type) {
                return true
            } else if (current.name === name && current.type === type) {
                return true
            } else {
                return false
            }
        })

        if (!def) {
            throw new Error('No ABI found!')
        }
        return JSON.parse(JSON.stringify(def))
    }

    get Code() {
        return this.bytecode
    }

    public deploy() {
        const bytecode = this.bytecode
        let value: number | string = 0

        let abi: object
        try {
            abi = this.ABI('', 'constructor')
        } catch (e) {
            if (e.message === 'No ABI found!') {
                abi = {
                    inputs: [],
                    outputs: [],
                    constant: false,
                    payable: false,
                    stateMutability: 'nonpayable',
                    type: 'constructor'
                }
            } else {
                throw e
            }
        }
        const coder = new ABICoder.Function(abi as ABICoder.Function.Definition)

        return {
            value(val: string | number) {
                value = V.validate(val, V.Rules.BigInt, 'value')
                if (!coder.definition.payable) {
                    console.warn('Adding values to non-payable methods')
                }
                return
            },
            asClause(...args: any[]) {
                if (coder.definition.inputs.length !== args.length) {
                    throw new Error(`arguments count expected ${coder.definition.inputs.length}`)
                }

                let data = bytecode

                if (coder.definition.inputs.length) {
                    data += coder.encode(args).slice(2)
                }

                return {
                    to: null,
                    value,
                    data
                }
            }
        }
    }
}
