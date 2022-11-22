const DEFAULT_TTL_MS = 30000

export type CachedDataOptions = {
    ttlMs?: number
}

type Resolver = { resolve: () => void; reject: (error: Error) => void }

export abstract class CachedData<T> {
    private readonly ttlMs: number
    protected data: T | undefined = undefined
    private nextRefreshTime = 0
    private refreshing = false
    private refreshResolvers: Resolver[] | undefined = undefined

    protected constructor(options?: CachedDataOptions) {
        this.ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS
    }

    abstract loadActual(): Promise<T>

    async get(): Promise<T> {
        if (this.data === undefined) {
            await this.initialRefreshData()
        } else if (Date.now() > this.nextRefreshTime) {
            this.startRefreshData()
        }
        if (!this.data) {
            throw Error("Invalid cached data state: data is undefined")
        }
        return this.data
    }

    update(data: T) {
        this.data = data
        this.nextRefreshTime = Date.now() + this.ttlMs
        this.completeRefresh(x => x.resolve())
    }

    private initialRefreshData(): Promise<void> {
        const promise = new Promise<void>((resolve, reject) => {
            const resolver = { resolve, reject }
            if (this.refreshResolvers !== undefined) {
                this.refreshResolvers.push(resolver)
            } else {
                this.refreshResolvers = [resolver]
            }
        })
        this.startRefreshData()
        return promise
    }

    private startRefreshData() {
        if (this.refreshing) {
            return
        }
        this.refreshing = true
        void (async () => {
            try {
                this.update(await this.loadActual())
            } catch (err) {
                this.completeRefresh(x => x.reject(err))
            }
        })()
    }

    private completeRefresh(resolve: (resolver: Resolver) => void) {
        const resolvers = this.refreshResolvers
        this.refreshResolvers = undefined
        this.refreshing = false
        if (resolvers) {
            resolvers.forEach(resolve)
        }
    }
}
