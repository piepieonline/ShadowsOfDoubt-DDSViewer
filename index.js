async function initAndLoad(path) {
    window.stringMapping = {};
    loadI18n();
    loadFile(path, 0);
    window.maxTreeCount = 0;
}

async function loadI18n() {
    async function loadStringsFile(handle, path) {
        return (await (await getFile(handle, path)).text()).split('\n').reduce((map, val) => {
            var lineContent = val.split(',');

            var guid = lineContent[0];
            var message = lineContent[2];

            if (message?.startsWith('"')) {
                var i = 3;
                do {
                    message += "," + lineContent[i];
                    i++;
                } while (!lineContent[i - 1].endsWith('"'))
            }

            map[guid] = { text: message, source: handle === window.dirHandleStreamingAssets ? 'StreamingAssets' : 'Mod' };
            return map;
        }, {});
    }

    window.stringMapping = await loadStringsFile(window.dirHandleStreamingAssets, ['Strings', 'English', 'DDS', 'dds.blocks.csv']);

    if (window.selectedMod != null) {
        window.stringMapping = {
            ...window.stringMapping,
            ...(await loadStringsFile(window.selectedMod.ddsStrings, ['dds.blocks.csv']))
        };
    }
}

async function loadFile(path, thisTreeCount) {
    var treeEle = addTreeElement(thisTreeCount, path, document.getElementById('trees'))

    var dataFile = await tryGetFile(window.dirHandleStreamingAssets, path.split('/')) || await tryGetFile(window.selectedMod.baseFolder, path.split('/'));

    var data = JSON.parse(await dataFile.text());

    if (path.includes('Blocks')) {
        var engDummyKey = '_ENG Localisation_';
        data[engDummyKey] = window.stringMapping[data.id].text;

        for (var i = 0; i < data.replacements.length; i++) {
            data.replacements[i][engDummyKey] = window.stringMapping[data.replacements[i].replaceWithID].text;
        }
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

async function addMod(modName) {

}