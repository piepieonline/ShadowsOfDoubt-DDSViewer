const LOCALISATION_DUMMY_KEY = '_ENG Localisation_';

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
    var treeEle = addTreeElement(thisTreeCount, path, document.getElementById('trees'), { copySource, save })

    var data = null;

    var vanillaDataFile = await (await (await tryGetFile(window.dirHandleStreamingAssets, path.split('/')))?.getFile())?.text();
    var patchDataFile = window.selectedMod != null ? (await (await (await tryGetFile(window.selectedMod.baseFolder, (path + '_patch').split('/')))?.getFile())?.text()) : null;

    if (vanillaDataFile != null) {
        data = JSON.parse(vanillaDataFile);
        if (patchDataFile != null) {
            data = jsonpatch.applyPatch(data, JSON.parse(patchDataFile)).newDocument;
        }
    } else {
        data = JSON.parse(await (await (await tryGetFile(window.selectedMod.baseFolder, path.split('/')))?.getFile())?.text());
    }
    
    // Show actual text
    if (path.includes('Blocks')) {
        data[LOCALISATION_DUMMY_KEY] = window.stringMapping[data.id]?.text || "MISSING GUID IN dds.csv";

        for (var i = 0; i < data.replacements.length; i++) {
            data.replacements[i][LOCALISATION_DUMMY_KEY] = window.stringMapping[data.replacements[i].replaceWithID].text;
        }
    }

    // Create json-tree
    var tree = jsonTree.create(data, treeEle);
    runTreeSetup();

    async function runTreeSetup() {
        // Auto-expand the useful keys
        let expandedNodes = ['messages', 'blocks', 'replacements']
        tree.expand(function (node) {
            if (expandedNodes.includes(node.label)) {
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

        // Editing operations

        // Simple types
        tree.findAndHandle(item => {
            return !item.isComplex && item.label != LOCALISATION_DUMMY_KEY;
        }, item => {
            var ele = item.el.querySelector('.jsontree_value');
            ele.addEventListener('contextmenu', (e) => {
                e.preventDefault();

                if(!window.selectedMod) {
                    alert('Please select a mod to save in first');
                    throw 'Please select a mod to save in first';
                }

                let currentValue = item.el.querySelector('.jsontree_value').innerText;

                if (item.type == 'string') {
                    currentValue = currentValue.substring(1, currentValue.length - 1);
                }

                let res = prompt('Enter new value', currentValue);

                if ((item.type == 'string' && res != 'null' && res !== null)) {
                    res = '"' + res + '"';
                }

                let parsed = JSON.parse(res);
                if (parsed || parsed === false || res === 'null') {
                    data = jsonpatch.applyPatch(data, [
                        {
                            op: 'replace',
                            path: getJSONPointer(item),
                            value: parsed
                        }
                    ]).newDocument;
                    tree.loadData(data);
                    runTreeSetup();
                }
            });
        });

        // Removing element
        tree.findAndHandle(item => {
            return item.parent.type === 'array';
        }, item => {
            var ele = item.el.querySelector('.jsontree_label');
            ele.addEventListener('contextmenu', (e) => {
                e.preventDefault();

                if(!window.selectedMod) {
                    alert('Please select a mod to save in first');
                    throw 'Please select a mod to save in first';
                }

                if(confirm('Remove Element?')) {
                    data = jsonpatch.applyPatch(data, [
                        {
                            op: 'remove',
                            path: getJSONPointer(item)
                        }
                    ]).newDocument;
                    tree.loadData(data);
                    runTreeSetup();
                }
            });
        });

        // Adding element
        tree.findAndHandle(item => {
            return item.type === 'array';
        }, item => {
            var ele = item.el.querySelector('.jsontree_label');
            ele.addEventListener('contextmenu', async (e) => {
                e.preventDefault();

                if(!window.selectedMod) {
                    alert('Please select a mod to save in first');
                    throw 'Please select a mod to save in first';
                }

                if(confirm('Add Element?')) {                   
                    let newContent = await getTemplateForLabel(item.label, prompt(`Existing GUID (Or cancel to create a new file)`));

                    if(!newContent) return;

                    data = jsonpatch.applyPatch(data, [
                        {
                            op: 'add',
                            path: getJSONPointer(item) + '/-',
                            value: newContent
                        }
                    ]).newDocument;
                    tree.loadData(data);
                    runTreeSetup();
                }
            });
        });
    }

    async function copySource() {
        navigator.clipboard.writeText(getSaveSafeJSON());
    }

    async function save() {
        if(!window.selectedMod) {
            alert('Please select a mod to save in first');
            throw 'Please select a mod to save in first';
        }

        if(vanillaDataFile) {
            // Save patches of vanilla files
            writeFile(await tryGetFile(window.selectedMod.baseFolder, (path + '_patch').split('/'), true), JSON.stringify(jsonpatch.compare(JSON.parse(vanillaDataFile), JSON.parse(getSaveSafeJSON()))), false);
            
        } else {
            // Save entire custom files
            writeFile(await tryGetFile(window.selectedMod.baseFolder, path.split('/'), true), getSaveSafeJSON(), false);
        }
    }

    function getSaveSafeJSON() {
        return JSON.stringify(data, (key, value) => (key === '_ENG Localisation_' ? undefined : value), 2);
    }
}

async function getTemplateForLabel(itemType, guid) {
    switch(itemType) {
        case 'messages': 
            let message = cloneTemplate('treeMessage');
            message.msgID = guid || await createNewFile('message');
            message.instanceID = crypto.randomUUID();
            return message;
        case 'blocks': 
            let block = cloneTemplate('messageBlock');
            block.blockID = guid || await createNewFile('block');
            block.instanceID = crypto.randomUUID();
            return block;
        case 'replacements': 
            let replacement = cloneTemplate('blockReplacement');
            if(guid) {
                replacement.replaceWithID = guid;
            } else {
                replacement.replaceWithID = crypto.randomUUID();
                await addToStrings(replacement.replaceWithID, prompt(`English Line`));
            }

            return replacement;
    }
}