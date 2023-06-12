async function initAndLoad(path) {
    window.stringMapping = {};
    loadI18n();
    loadFile(path, 0);
    window.maxTreeCount = 0;
}

async function loadI18n() {
    async function loadStringsFile(handle, path) {
        return (await (await (await getFile(handle, path)).getFile()).text()).split('\n').reduce((map, val) => {
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

    var data = null;

    var vanillaDataFile = await (await (await tryGetFile(window.dirHandleStreamingAssets, path.split('/')))?.getFile())?.text();
    var patchDataFile = window.selectedMod != null ? (await (await (await tryGetFile(window.selectedMod.baseFolder, (path + '_patch').split('/')))?.getFile())?.text()) : null;

    if(vanillaDataFile != null) {
        data = JSON.parse(vanillaDataFile);
        if(patchDataFile != null) {
            data = jsonpatch.applyPatch(data, JSON.parse(patchDataFile)).newDocument;
        }
    } else {
        data = JSON.parse(await (await (await tryGetFile(window.selectedMod.baseFolder, path.split('/')))?.getFile())?.text());
    }

    if (path.includes('Blocks')) {
        var engDummyKey = '_ENG Localisation_';
        data[engDummyKey] = window.stringMapping[data.id]?.text || "MISSING GUID IN dds.csv";

        for (var i = 0; i < data.replacements.length; i++) {
            data.replacements[i][engDummyKey] = window.stringMapping[data.replacements[i].replaceWithID].text;
        }
    }

    // Create json-tree
    var tree = jsonTree.create(data, treeEle);

    let expandedNodes = [ 'messages', 'blocks' ]
    tree.expand(function (node) {
        if(expandedNodes.includes(node.label))
        {
            node.childNodes.forEach(child => child.expand());
            return true;
        }
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
