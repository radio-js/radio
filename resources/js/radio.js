window.Radio = {
    token: document.currentScript.dataset.token,
}

Radio.mount = function ($el, args) {
    if (args.events) {
        args.events.forEach((event) => {
            $el.dispatchEvent(
                new CustomEvent(event.name, {
                    bubbles: true,
                    detail: event.data ?? {},
                })
            )
        })
    }

    return {
        ...args.state,
        ...args.methods.reduce(function (methods, method) {
            methods[method] = Radio.call({
                method: method,
                url: args.url,
            })

            return methods
        }, {}),
        $radio: {
            $el,
            errors: {
                store: {},
                any() {
                    return Object.values(this.store).length > 0
                },
                all() {
                    return this.store
                },
                get(key) {
                    return this.store[key]
                },
                has(key) {
                    return this.store[key] !== undefined
                },
                reset() {
                    this.store = {}
                },
            },
            processing: false,
        }
    }
}

Radio.call = function (options) {
    return async function (...args) {
        this.$radio.errors.reset()

        this.$radio.processing = true

        const state = Object.fromEntries(Object.entries(this).filter(entry => {
            const [name, value] = entry

            return ! name.startsWith('$') && typeof value !== 'function'
        }))

        const body = {
            method: options.method,
            state,
            args,
        }

        return fetch(options.url, {
            method: 'POST',
            body: JSON.stringify(body),
            credentials: 'same-origin',
            headers: {
                'Accepts': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-Token': window.Radio.token,
                'X-Requested-With': 'XMLHttpRequest',
            },
        }).then(async res => {
            this.$radio.processing = false

            const response = await res.text()

            let json

            try {
                json = JSON.parse(response)
            } catch (error) {
                Radio.showModal(response)

                return
            }

            if (! res.ok && json.errors) {
                this.$radio.errors.store = json.errors

                return res
            }

            Object.entries(json.state).forEach(entry => {
                const [key, value] = entry

                if (this[key] !== value) {
                    this[key] = value
                }
            })

            if (json.events) {
                json.events.forEach((event) => {
                    this.$radio.$el.dispatchEvent(
                        new CustomEvent(event.name, {
                            bubbles: true,
                            detail: event.data ?? {},
                        })
                    )
                })
            }

            return json.result
        }).catch(error => {
            console.log(error)
        })
    }
}
