import { desktopCapturer,ipcRenderer,DesktopCapturerSource,SourcesOptions} from 'electron';
const domify = require('domify');
import  Logger from './logger'

const log = new Logger()

document.onkeydown = (event) => {

    log.debug('keydown ', event.keyCode);
    if(event.keyCode === 27) {
        ipcRenderer.send("source-selected-esc", null);
    }
    // add more event
};

ipcRenderer.on("get-sources", (event, options: SourcesOptions) => {
    desktopCapturer.getSources(options, (error: Error, sources: DesktopCapturerSource[]) => {
        if (error) { throw error; }
        const sourcesList = document.querySelector(".screen-main");
        for (const source of sources) {
            const thumb = source.thumbnail.toDataURL();
            if (!thumb) { continue; }
            const title = source.name.length > 20 ? source.name.slice(0, 20) + "..." : source.name;
            const item = `
                <li class="screen-item">
                    <div class="screen">
                        <a href="#"><img src="${thumb}"></a>
                        <div class="select"></div>
                    </div>
                    <p class="screen-name">${title}</p>
                </li>`;

            // let item = `<li><a href="#"><img src="${thumb}"><span>${title}</span></a></li>`
            sourcesList.appendChild(domify(item));
        }

        const links = sourcesList.querySelectorAll("a");
        for (let i = 0; i < links.length; ++i) {
            const closure = (i) => {
                return (e) => {
                    e.preventDefault();
                    ipcRenderer.send("source-id-selected", sources[i].id);
                    log.debug("selected ", sources[i].id);
                    sourcesList.innerHTML = "";
                };
            };
            links[i].onclick = closure(i);
        }
    });
});
