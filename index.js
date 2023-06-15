const LOCALISATION_DUMMY_KEY = '_ENG Localisation_';
const LOCALISATION_MISSING_STRING = 'MISSING GUID IN dds.csv';

async function initAndLoad(path) {
    window.stringMapping = {};
    await loadI18n();
    await loadFile(path, 0);
    window.maxTreeCount = 0;
}

async function loadI18n() {
    async function loadStringsFile(handle, path) {
        return (await (await (await getFile(handle, path)).getFile()).text()).split('\n').reduce((map, val) => {
            var lineContent = val.split(',');

            // Sanity Check each line
            if (lineContent.length < 7) return map;

            var guid = lineContent[0];
            var message = lineContent[2];

            if (message?.startsWith('"') && !message.endsWith('"')) {
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
    createDummyKeys(data);

    // Create json-tree
    var tree = jsonTree.create(data, treeEle);
    runTreeSetup();

    if(path.split('/').at(-1).split('.')[0] != data.id) {
        alert('Filename doesn\'t match id! File will not work in game!');
    }

    function createDummyKeys(data) {
        if (path.includes('Blocks')) {
            data[LOCALISATION_DUMMY_KEY] = window.stringMapping[data.id]?.text || LOCALISATION_MISSING_STRING;

            for (var i = 0; i < data.replacements.length; i++) {
                data.replacements[i][LOCALISATION_DUMMY_KEY] = window.stringMapping[data.replacements[i].replaceWithID]?.text || LOCALISATION_MISSING_STRING;
            }
        }
        return data;
    }

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
            return !item.isComplex;
        }, item => {
            var ele = item.el.querySelector('.jsontree_value');
            ele.addEventListener('contextmenu', async (e) => {
                e.preventDefault();

                if (!window.selectedMod) {
                    alert('Please select a mod to save in first');
                    throw 'Please select a mod to save in first';
                }

                let previousValue = item.el.querySelector('.jsontree_value').innerText;

                // If it's a string, auto-handle quotes
                if (item.type == 'string') {
                    previousValue = previousValue.substring(1, previousValue.length - 1);
                }

                let res = prompt('Enter new value', previousValue);

                if(res === null) {
                    return;
                }

                if ((item.type == 'string' && res != 'null' && res !== null)) {
                    // Allow double quoted for included commas etc
                    if (res.startsWith("\"")) {
                        res = '\\"' + res.substring(1, res.length - 1) + '\\"';
                    }

                    // Auto-handle quotes again
                    res = '"' + res + '"';

                    res = res.replace(/\\/g, '\\\\');
                }

                let parsed = JSON.parse(res);
                if (item.label != LOCALISATION_DUMMY_KEY) {
                    if (parsed || parsed === false || parsed === 0 || parsed === '' || res === 'null') {
                        data = jsonpatch.applyPatch(data, [
                            {
                                op: 'replace',
                                path: getJSONPointer(item),
                                value: parsed
                            }
                        ]).newDocument;
                        data = createDummyKeys(data);
                        tree.loadData(data);
                        runTreeSetup();
                        await save();
                    }
                } else {
                    item.parent.findChildren(node => ['id', 'replaceWithID'].includes(node.label), async node => {
                        let guidString = node.el.querySelector('.jsontree_value').innerText;
                        guidString = guidString.substring(1, guidString.length - 1);

                        if (window.stringMapping[guidString].source == 'StreamingAssets') {
                            alert('Modifying vanilla content is unsupported');
                            throw 'Modifying vanilla content is unsupported';
                        }

                        if (previousValue == LOCALISATION_MISSING_STRING) {
                            await addToStrings(guidString, parsed);
                        } else {
                            await modifyExistingString(guidString, parsed);
                        }

                        // Visually update the value, since we aren't changing the tree
                        item.el.querySelector('.jsontree_value').innerText = parsed;

                        await loadI18n();
                    });
                }
            });
        });

        // Removing element
        tree.findAndHandle(item => {
            return item.parent.type === 'array';
        }, item => {
            var ele = item.el.querySelector('.jsontree_label');
            ele.addEventListener('contextmenu', async (e) => {
                e.preventDefault();

                if (!window.selectedMod) {
                    alert('Please select a mod to save in first');
                    throw 'Please select a mod to save in first';
                }

                if (confirm('Remove Element?')) {
                    data = jsonpatch.applyPatch(data, [
                        {
                            op: 'remove',
                            path: getJSONPointer(item)
                        }
                    ]).newDocument;
                    data = createDummyKeys(data);
                    tree.loadData(data);
                    runTreeSetup();
                    await save();
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

                if (!window.selectedMod) {
                    alert('Please select a mod to save in first');
                    throw 'Please select a mod to save in first';
                }

                if (confirm('Add Element?')) {
                    let newContent = await getTemplateForItem(item);

                    if (newContent === null) return;

                    data = jsonpatch.applyPatch(data, [
                        {
                            op: 'add',
                            path: getJSONPointer(item) + '/-',
                            value: newContent
                        }
                    ]).newDocument;
                    data = createDummyKeys(data);
                    tree.loadData(data);
                    runTreeSetup();
                    await save();
                }
            });
        });
    }

    async function copySource() {
        navigator.clipboard.writeText(getSaveSafeJSON());
    }

    async function save(force) {
        if (!window.selectedMod) {
            alert('Please select a mod to save in first');
            throw 'Please select a mod to save in first';
        }

        if(!window.savingEnabled && !force) return;

        if (vanillaDataFile) {
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

async function getTemplateForItem(item) {
    switch (item.label) {
        case 'messages':
            let message = cloneTemplate('treeMessage');
            message.msgID = prompt(`Existing GUID (Or cancel to create a new file)`) || await createNewFile('message');
            message.instanceID = crypto.randomUUID();
            return message;
        case 'links':
            let treeMessageLinks = cloneTemplate('treeMessageLinks');
            treeMessageLinks.to = prompt(`Existing instanceID`) || '';
            treeMessageLinks.from = item.parent.childNodes.find(node => node.label == 'instanceID').el.querySelector('.jsontree_value').innerText.replaceAll('"', '');
            return treeMessageLinks;
        case 'traits':
            return prompt(`Trait name`) || null;
        case 'blocks':
            let block = cloneTemplate('messageBlock');
            block.blockID = prompt(`Existing GUID (Or cancel to create a new file)`) || await createNewFile('block');
            block.instanceID = crypto.randomUUID();
            return block;
        case 'replacements':
            let replacement = cloneTemplate('blockReplacement');
            let guid = prompt(`Existing GUID (Or cancel to create a new file)`);
            if (guid) {
                replacement.replaceWithID = guid;
            } else {
                replacement.replaceWithID = crypto.randomUUID();
                await addToStrings(replacement.replaceWithID, prompt(`English Line`));
            }
            return replacement;
        case 'jobs':
            return prompt(`Job name`) || null;
        case 'triggers':
            return prompt(`Trigger index`) || null;
        default:
            return null;
    }
}