// tslint:disable:max-line-length
import '@vechain/connex'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import { abi } from '@vechain/abi'
import * as V from './validator'

export interface Assertion {
    transfer(): Assertion.TransferLog
    method(abi: object): Assertion.MethodOutput
    event(abi: object): Assertion.EventLog
    revert(): Assertion.Revert
}

export namespace Assertion {
    export interface TransferLog {
        logs(sender: string, recipient: string, amount: string | number): this
        equal(actual: Connex.Thor.Transfer): void
    }

    export interface MethodOutput {
        outputs(...args: any[]): this
        equal(actual: Partial<Connex.Thor.VMOutput> & Required<Pick<Connex.Thor.VMOutput, 'data'>>): void
    }

    export interface EventLog {
        logs(...args: any[]): this
        by(addr: string): this
        equal(actual: Connex.Thor.Event): void
    }

    export interface Revert {
        with(reason: string | RegExp): this
        equal(actual: Pick<Connex.Thor.VMOutput, 'reverted'|'decoded'>): void
    }
}

export const Assertion: Assertion  = {
    transfer() {
        let data: Required<Pick<Connex.Thor.Transfer, 'sender'|'recipient'|'amount'>>
        return {
            logs(sender, recipient, amount) {
                V.validate(sender, V.Rules.Address, 'sender')
                V.validate(recipient, V.Rules.Address, 'recipient')
                V.validate(amount, V.Rules.BigInt, 'amount')

                data = {
                    sender,
                    recipient,
                    amount: '0x' + new BigNumber(amount).toString(16)
                }

                return this
            },
            equal(transfer) {
                assert.equal(transfer.sender, data.sender, `TransferLog.sender expected ${JSON.stringify(transfer.sender)}`)
                assert.equal(transfer.recipient, data.recipient, `TransferLog.recipient expected ${JSON.stringify(transfer.recipient)}`)
                assert.equal(transfer.amount, data.amount, `TransferLog.amount expected ${JSON.stringify(new BigNumber(transfer.amount).toString())} in hexadecimal`)
            }
        }
    },
    method(jsonABI: object) {
        const coder = new abi.Function(jsonABI as any)
        let params: any[]
        return {
            outputs(...args) {
                if (args.length !== coder.definition.outputs.length) {
                    throw new Error(`arguments count expected ${coder.definition.outputs.length}`)
                }
                params = args
                return this
            },
            equal(actual) {
                const decoded = coder.decode(actual.data)
                for (const [index, param] of params.entries()) {
                    assert.deepEqual(decoded[index], param, `Method(${coder.definition.name}) Output#${index}${coder.definition.outputs[index].name ? '(' + coder.definition.outputs[index].name + ')' : '' } expected ${JSON.stringify(param)}`)
                }
            }
        }

    },
    event: (jsonABI: object) => {
        const coder = new abi.Event(jsonABI as any)
        let params: any[]
        let address: string
        return {
            logs(...args) {
                if (args.length !== coder.definition.inputs.length) {
                    throw new Error(`arguments count expected ${coder.definition.inputs.length}`)
                }
                params = args
                return this
            },
            by(addr) {
                address = addr
                return this
            },
            equal(actual) {
                const decoded = coder.decode(actual.data, actual.topics)
                assert.equal(actual.address, address, `EventLog expect emitted by ${JSON.stringify(address)}`)
                for (const [index, param] of params.entries()) {
                    assert.deepEqual(decoded[index], param, `Event(${coder.definition.anonymous ? 'Anonymous' : coder.definition.name}) #${index}(${coder.definition.inputs[index].name}) expected ${JSON.stringify(param)}`)
                }
                return
            }
        }
    },
    revert: () => {
        let expect: string | RegExp
        return {
            with(reason) {
                if (!reason) {
                    throw new Error('arg#0 expected string or Regex')
                }
                expect = reason
                return this
            },
            equal(actual) {
                assert.isTrue(actual.reverted, 'VMOutput.reverted expect reverted to be true')
                if (typeof expect === 'string') {
                    assert.equal(actual.decoded!.revertReason, expect, `Decoded.revertReason expect to be ${JSON.stringify(expect)}`)
                } else {
                    assert.match(actual.decoded!.revertReason!, expect, 'Decoded.revertReason')
                }
            }
        }
    }
}
