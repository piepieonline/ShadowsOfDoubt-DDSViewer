async function initAndLoad(path) {
    loadI18n();
    loadFile(path, 0);
    window.maxTreeCount = 0;
}

async function loadI18n() {
    // window.stringMapping = (await (await fetch("./StreamingAssets/Strings/English/DDS/dds.blocks.csv")).text()).split('\n').reduce((map, val) => {
    window.stringMapping = (await getFile(window.dirHandle, ['Strings', 'English', 'DDS', 'dds.blocks.csv'])).split('\n').reduce((map, val) => {
        var lineContent = val.split(',');

        var guid = lineContent[0];
        var message = lineContent[2];

        if(message.startsWith('"')) {
            var i = 3;
            do
            {
                message += "," + lineContent[i];
                i++;
            } while(!lineContent[i - 1].endsWith('"'))
        }

        map[guid] = message;
        return map;
    }, {});
}

async function loadFile(path, thisTreeCount) {
    var treeEle = addTreeElement(thisTreeCount, path, document.getElementById('trees'))

    // or from a string by JSON.parse(str) method
    // var data = await (await fetch("./StreamingAssets/DDS/" + path)).json();
    var data = JSON.parse(await getFile(window.dirHandle, path.split('/'))); 

    if(path.includes('Blocks')) {
        data['_ENG Localisation_'] = window.stringMapping[data.id];
    }

    // Create json-tree
    var tree = jsonTree.create(data, treeEle);

    tree.expand(function (node) {
        return node.label === 'messages' || node.label === 'blocks';
    });

    // Links for trees and blocks
    tree.findAndHandle(item => {
        return ['msgID', 'blockID'].includes(item.label);
    }, item => {
        var ele = item.el.querySelector('.jsontree_value_string');
        ele.classList.add('link-element')
        ele.addEventListener('click', () => {
            const guid = item.el.querySelector('.jsontree_value_string').innerText.replace(/"/g, "");
            switch (item.label) {
                case 'msgID':
                    loadFile(`DDS/Messages/${guid}.msg`, thisTreeCount + 1);
                    break;
                case 'blockID':
                    loadFile(`DDS/Blocks/${guid}.block`, thisTreeCount + 1);
                    break;
            }
        });
    });
}

function addTreeElement(thisTreeCount, path, parent) {
    deleteTree(thisTreeCount);

    window.maxTreeCount = thisTreeCount;

    const div = document.createElement("div");
    div.id = "jsontree-container_" + thisTreeCount;
    div.className = "jsontree-container";
    parent.appendChild(div);

    const titleEle = document.createElement("div");
    titleEle.className = "doc-title";
    titleEle.innerText = path;
    div.appendChild(titleEle);

    const closeCross = document.createElement("div");
    closeCross.innerText = "❌";
    closeCross.className = "close-button";
    closeCross.addEventListener('click', () => {
        deleteTree(thisTreeCount);
    })
    div.appendChild(closeCross);

    return div;
}

function deleteTree(thisTreeCount) {
    for (var i = thisTreeCount; i <= window.maxTreeCount; i++) {
        document.getElementById("jsontree-container_" + i)?.remove()
    }

    window.maxTreeCount = thisTreeCount - 1;
}