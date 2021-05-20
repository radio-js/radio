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

            if (json.result && json.result.type === 'redirect') {
                window.location.assign(json.result.target)
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

Radio.showModal = function (html) {
    let page = document.createElement('html')
    page.innerHTML = html
    page.querySelectorAll('a').forEach(a =>
        a.setAttribute('target', '_top')
    )

    let modal = document.getElementById('radio-error')

    if (typeof modal != 'undefined' && modal != null) {
        modal.innerHTML = ''
    } else {
        modal = document.createElement('div')
        modal.id = 'radio-error'
        modal.style.position = 'fixed'
        modal.style.padding = '50px'
        modal.style.top = 0
        modal.style.left = 0
        modal.style.right = 0
        modal.style.bottom = 0
        modal.style.backgroundColor = 'rgba(0, 0, 0, .6)'
        modal.style.zIndex = 200000
    }

    let iframe = document.createElement('iframe')
    iframe.style.backgroundColor = '#17161A'
    iframe.style.borderRadius = '5px'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    modal.appendChild(iframe)

    document.body.prepend(modal)
    document.body.style.overflow = 'hidden'
    iframe.contentWindow.document.open()
    iframe.contentWindow.document.write(page.outerHTML)
    iframe.contentWindow.document.close()

    modal.addEventListener('click', () => Radio.hideModal(modal))
    modal.setAttribute('tabindex', 0)
    modal.addEventListener('keydown', e => {
        if (e.key === 'Escape') Radio.hideModal(modal)
    })
    modal.focus()
}

Radio.hideModal = function (modal) {
    modal.outerHTML = ''
    document.body.style.overflow = 'visible'
}
