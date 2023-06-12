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

        newContent.name = prompt(`Name for ${type}`);

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
                newContent.startingMessage = newContent.messages[0].id;
            });
        case 'message':
            return createNewFileImpl(window.selectedMod.messages, 'message', async newContent => {
                newContent.blocks.push(cloneTemplate('messageBlock'));
                newContent.blocks[0].blockID = await createNewFile('block');
                newContent.blocks[0].instanceID = crypto.randomUUID();
            });
        case 'block':
            return createNewFileImpl(window.selectedMod.blocks, 'block', async newContent => {
                newContent.id = crypto.randomUUID();

                var d = new Date();
                var datestring = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + " " + ("0" + d.getDate()).slice(-2) + "/" + ("0"+(d.getMonth()+1)).slice(-2) + "/" + d.getFullYear();

                await writeFile(await getFile(window.selectedMod.ddsStrings, ['dds.blocks.csv'], true), `\r\n${newContent.id},,Dummy Content,,,,${datestring}`, true);
            });
    }
}