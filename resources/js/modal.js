export default class Modal {

    show(html) {
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
    
        modal.addEventListener('click', () => this.hide(modal))
        modal.setAttribute('tabindex', 0)
        modal.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.hide(modal)
        })
        modal.focus()
    }

    hide() {
        modal.outerHTML = ''
        document.body.style.overflow = 'visible'
    }

}