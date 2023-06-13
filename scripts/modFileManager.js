async function refreshModList() {
    let mods = [];
    for await (const entry of window.dirHandleModDir.values()) {
        if (entry.kind === "directory") {
            mods.push(await openModFolder(entry.name, false));
        }
    }
    return mods;
}

async function openModFolder(modName, create) {
    let modFolders = { modName };

    modFolders.baseFolder = await tryGetFolder(window.dirHandleModDir, [modName, "DDSContent"], create)
    modFolders.trees = await tryGetFolder(window.dirHandleModDir, [modName, "DDSContent", "DDS", "Trees"], create)
    modFolders.messages = await tryGetFolder(window.dirHandleModDir, [modName, "DDSContent", "DDS", "Messages"], create)
    modFolders.blocks = await tryGetFolder(window.dirHandleModDir, [modName, "DDSContent", "DDS", "Blocks"], create)
    modFolders.ddsStrings = await tryGetFolder(window.dirHandleModDir, [modName, "DDSContent", "Strings", "English", "DDS"], create)

    return modFolders;
}

function cloneTemplate(template) {
    return JSON.parse(JSON.stringify(window.templates[template]))
}

async function createNewFile(type) {
    async function createNewFileImpl(folderHandle, type, callback) {
        let guid = crypto.randomUUID();
        let newHandle = await getFile(folderHandle, [guid + "." + (type == 'message' ? 'msg' : type)], true);

        let newContent = cloneTemplate(type);

        newContent.id = guid;

        await callback(newContent);

        await writeFile(newHandle, JSON.stringify(newContent));

        return guid;
    }

    switch (type) {
        case 'tree':
            return createNewFileImpl(window.selectedMod.trees, 'tree', async newContent => {
                newContent.messages.push(cloneTemplate('treeMessage'));
                newContent.messages[0].msgID = await createNewFile('message');
                newContent.messages[0].instanceID = crypto.randomUUID();
                newContent.name = newContent.messages[0].name;
                newContent.startingMessage = newContent.messages[0].id;
            });
        case 'message':
            return createNewFileImpl(window.selectedMod.messages, 'message', async newContent => {
                newContent.blocks.push(cloneTemplate('messageBlock'));
                newContent.blocks[0].blockID = await createNewFile('block');
                newContent.blocks[0].instanceID = crypto.randomUUID();
                newContent.name = newContent.blocks[0].name;
            });
        case 'block':
            return createNewFileImpl(window.selectedMod.blocks, 'block', async newContent => {
                newContent.id = crypto.randomUUID();
                newContent.name = prompt(`English Line`)

                await addToStrings(newContent.id, newContent.name);
            });
    }
}

async function addToStrings(id, content) {
    let d = new Date();
    let datestring = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + " " + ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear();
    await writeFile(await getFile(window.selectedMod.ddsStrings, ['dds.blocks.csv'], true), `\n${id},,${content},,,,${datestring}`, true);
    await loadI18n();
}

async function modifyExistingString(id, content) {
    let d = new Date();
    let datestring = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + " " + ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear();

    let stringsFileHandle = await getFile(window.selectedMod.ddsStrings, ['dds.blocks.csv'], true);
    let stringsFileContent = (await (await stringsFileHandle.getFile()).text())
        // Split the file by line, find and replace the given GUID, recombine the file
        .split('\n').map(val => (val.startsWith(id) ? `${id},,${content},,,,${datestring}` : val)).join('\n');

    await writeFile(stringsFileHandle, stringsFileContent, false);
    await loadI18n();
}