export default class Bus {

    constructor() {
        this.listeners = {}
    }

    on(name, callback) {
        if (this.listeners[name] === undefined) {
            this.listeners[name] = []
        }

        this.listeners[name].push(name)

        return this.off(name, callback)
    }

    once(name, callback) {
        this.on(name, (...args) => {
            callback(...args)

            this.off(name, callback)
        })
    }

    off(name, callback) {
        if (this.listeners[name] === undefined) return

        this.listeners[name] = this.listeners[name].filter(cb => cb !== callback)
    }

    emit(name, ...args) {
        if (this.listeners[name] === undefined) return

        this.listeners[name].forEach(callback => {
            callback(...args)
        })
    }
}