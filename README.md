# Sharp

Experimental contract test utility package - just as `elegant` as [Connex]().

## Features

+ ContractMeta - manages contract bytecode and ABI
+ Awaiter - wait tx to be packed
+ Assertion - assert as much as you can image(event log, transfer log, method output)

## API

```
import { ContractMeta, Awaiter, Assertion } from 'sharp'
```

### Contract Meta

``` javascript
const bytecode = '0x.....'
const abiJSON = [...]

const contract = new ContractMeta(abiJSON, bytecode)

//Get the bytecode
console.log(contract.Code)

//Search the abi definition
const abi = contract.ABI('balanceOf', 'function')
const transferEvent = contract.ABI('Transfer', 'event')

//Build the deploy clause
const clause = contract
    .deploy()
    .value(100)             //100wei as endowment for contract creation
    .asClause(arg0, arg1)   //args for constructor

//Work with connex
const method = connex.thor.account(address).method(contract.ABI('balanceOf'))
const output = await method.call(accountA) //query the balance of the account

console.log(output)
```

### Awaiter

``` javascript
//Wait until transaction was packed to the chain
const receipt = await Awaiter.receipt(thor.transaction(txid), thor.ticker())
```

### Assertion

``` javascript
const accountA = '0x...'
const accountB = '0x...'
const amount = new BigNumber('1000000').times(1e18)

//Ensure transfer VET emits an transfer log
const receipt: Connex.Thor.Receipt = await connex.thor.transaction(txid).getReceipt()

Assertion
    .transfer()
    .logs(accountA, accountB, amount.toString())
    .equal(receipt.outputs[0].transfers[0])

//Ensure transfer energy emits an transfer event log
const method = connex.thor.account(address).method(contract.ABI('transfer'))
const output: Connex.Thor.VMOutput = method
    .caller(accountA)
    .call(accountB, amount.toString())

Assertion
    .event(contract.ABI('Transfer', 'event'))
    .by(address)
    .logs(accountA, accountB, amount.toString())
    .equal(ret.outputs[0].events[0])

//Ensure balanceOf method outputs the token balance
const method = connex.thor.account(address).method(contract.ABI('balanceOf'))
const output: Connex.Thor.VMOutput = method.call(accountB)

Assertion
    .method(contract.ABI('balanceOf'))
    .outputs(amount.toString())
    .equal(ret)

//Ensure contract reverted with message
const output: Connex.Thor.VMOutput = method.call()

Assertion
    .revert()
    .with('Must have set allowance for this contract')
    .equal(output)
```
