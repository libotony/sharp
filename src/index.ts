import '@vechain/connex'

export * from './assertion'
export { ContractMeta } from './meta'

export interface Awaiter {
    receipt(txVisitor: Connex.Thor.TransactionVisitor, ticker: Connex.Thor.Ticker): Promise<Connex.Thor.Receipt>
}

export const Awaiter: Awaiter = {
    receipt(txVisitor, ticker) {
        return Promise.race<Promise<Connex.Thor.Receipt>>([
            (async () => {
                while (true) {
                    const receipt = await txVisitor.getReceipt()
                    if (receipt) {
                        return receipt
                    }
                    await ticker.next()
                }
            })(),
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`TX(${txVisitor.id}): no receipt for 20 blocks`))
                }, 20 * 10 * 1000)
            }),
        ])
    }
}
