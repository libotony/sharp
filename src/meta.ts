
import * as V from './validator'

export class ContractMeta {
    private bytecode: string
    private abi: object[]

    constructor(bytecode: string, abi: object[]) {
        V.validate(bytecode, V.Rules.HexBytes, 'bytecode')
        V.validate(abi, [v => {
            return typeof v === 'object' ? '' : 'expected abi definition object'
        }])
        this.bytecode = bytecode
        this.abi = abi
    }

    public ABI(name: string, type = 'function') {
        V.validate(type, val => {
            const types = ['function', 'event', 'constructor']
            if (types.indexOf(val) === -1) {
                return 'abi type only support function/event/constructor'
            }
            return ''
        }, type)

        const def = this.abi.find((current: any) => {
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

    public Code() {
        return this.bytecode
    }
}
