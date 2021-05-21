import Queue from './queue'
import Bus from './bus'
import Modal from './modal'

window.Radio = {

    token: document.currentScript.dataset.token,

    events: new Bus,

    modal: new Modal,

    macros: {},

    mount: function ($el, options) {
        
    },

    call: function () {

    },

    macro: function (name, callback) {
        if (this.macros[name] !== undefined) {
            throw new Error(`[Radio] A \`${name}\` macro is already defined.`)
        }

        this.macros[name] = callback
    },

}