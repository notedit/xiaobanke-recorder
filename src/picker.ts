import { desktopCapturer,ipcRenderer,DesktopCapturerSource,SourcesOptions} from 'electron'
const domify = require('domify')


document.onkeydown = (event) => {

    if(event.keyCode === 27){
        ipcRenderer.send('source-selected-esc',null)
    }
    // add more event 
}

ipcRenderer.on('get-sources', (event,options:SourcesOptions) => {
    desktopCapturer.getSources(options, (error:Error,sources:DesktopCapturerSource[]) => {
        if(error) throw error
        let sourcesList = document.querySelector('.capturer-list')
        for(let source of sources){
            let thumb = source.thumbnail.toDataURL()
            if (!thumb) continue
            let title = source.name.length > 20 ? source.name.slice(0, 20) + '...' : source.name
            let item = `<li><a href="#"><img src="${thumb}"><span>${title}</span></a></li>`
            sourcesList.appendChild(domify(item))
        }
        
        let links = sourcesList.querySelectorAll('a')
        for (let i = 0; i < links.length; ++i) {
            let closure = (i) => {
                return (e) => {
                e.preventDefault()
                ipcRenderer.send('source-id-selected', sources[i].id)
                sourcesList.innerHTML = ''
                }
            }
            links[i].onclick = closure(i)
        }
    })
})