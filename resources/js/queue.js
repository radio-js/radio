export default class Queue {

    constructor(items = []) {
        this.items = items
    }

    enqueue(item) {
        this.items.push(item)
    }

    dequeue() {
        return this.items.shift()
    }

    peek() {
        return this.isEmpty() ? this.items[0] : undefined
    }

    isEmpty() {
        return this.items.length === 0
    }

    length() {
        return this.items.length
    }

    static from(items) {
        if (! Array.isArray(items)) {
            throw new Error('[Radio] `Queue.from` expects `items` to be an `Array`.')
        }

        return new Queue(items)
    }
}