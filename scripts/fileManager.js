async function getStreamingAssetsDir() {
    let firstPass = true;
    let haveStreamingAssets = false;
    do {
        let options = {};

        let streamingAssetsPath = await idbKeyval.get('StreamingAssetsPath');

        if (firstPass) {
            if (streamingAssetsPath)
                options.startIn = streamingAssetsPath;
        }
        else {
            alert('Please select the game\'s StreamingAssets folder');
            options.startIn = window.dirHandleStreamingAssets;
        }

        window.dirHandleStreamingAssets = await window.showDirectoryPicker(options);
        firstPass = false;

        haveStreamingAssets = window.dirHandleStreamingAssets.name === 'StreamingAssets';

        if (!haveStreamingAssets) {
            let actualStreamingFolder =
                await tryGetFolder(window.dirHandleStreamingAssets, ['Shadows of Doubt', 'Shadows of Doubt_Data', 'StreamingAssets']) ||
                await tryGetFolder(window.dirHandleStreamingAssets, ['Shadows of Doubt_Data', 'StreamingAssets']) ||
                await tryGetFolder(window.dirHandleStreamingAssets, ['StreamingAssets']);

            if (actualStreamingFolder) {
                window.dirHandleStreamingAssets = actualStreamingFolder;
                haveStreamingAssets = true;
            }
        }

    } while (!haveStreamingAssets)

    let ddsBlocksFile = await readFileContent(await tryGetFile(window.dirHandleStreamingAssets, ['Strings', 'English', 'DDS', 'dds.blocks.csv'], false));
    window.vanillaDDSStringsContent = ddsBlocksFile.split(/(?:\r)?\n/).slice(3);
    window.createRSearchList();

    await idbKeyval.set('StreamingAssetsPath', window.dirHandleStreamingAssets);
}

async function getModDir() {
    // No way to pass this from one app to the other :(
    const dbKey = 'DDSModPath';
    let modPath = await idbKeyval.get(dbKey);
    let options = modPath ? { startIn: modPath, mode: 'readwrite' } : { mode: 'readwrite' };
    window.dirHandleModDir = await window.showDirectoryPicker(options);
    await idbKeyval.set(dbKey, window.dirHandleModDir);
}

async function getFile(handle, path, create) {
    if (path.length == 1) {
        return await (await handle.getFileHandle(path[0], { create }));
    }
    else {
        var folder = path.splice(0, 1)[0];
        return getFile(await handle.getDirectoryHandle(folder), path, create);
    }
}

async function tryGetFile(handle, path, create) {
    try {
        return await getFile(handle, path, create)
    }
    catch
    {
        return null;
    }
}

async function readFileContent(handle) {
    return await (await (handle)?.getFile())?.text()
}

async function getFolder(handle, path, create) {
    if (path.length == 1) {
        return await handle.getDirectoryHandle(path[0], { create });
    }
    else {
        var folder = path.splice(0, 1)[0];
        return getFolder(await handle.getDirectoryHandle(folder, { create }), path, create);
    }
}

async function tryGetFolder(handle, path, create) {
    try {
        return await getFolder(handle, path, create)
    }
    catch
    {
        return null;
    }
}

async function writeFile(fileHandle, contents, append) {
    const writeable = await fileHandle.createWritable({ keepExistingData: append });

    if (append) {
        let offset = (await fileHandle.getFile()).size;
        writeable.seek(offset);
        if(offset === 0) {
            contents = contents.trim();
        }
    }

    await writeable.write(contents);
    await writeable.close();
}
