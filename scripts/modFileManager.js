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