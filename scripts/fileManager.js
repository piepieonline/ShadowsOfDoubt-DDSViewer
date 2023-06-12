async function getStreamingAssetsDir() {
    let firstPass = true;
    do 
    {
        let options = {};

        let streamingAssetsPath = await idbKeyval.get('StreamingAssetsPath');

        if(firstPass)
        {
            if(streamingAssetsPath)
                options.startIn = streamingAssetsPath;
        }
        else
        {
            alert('Please select the game\'s StreamingAssets folder');
            options.startIn = window.dirHandleStreamingAssets;
        }
        
        window.dirHandleStreamingAssets = await window.showDirectoryPicker();
        firstPass = false;
    } while (window.dirHandleStreamingAssets.name != 'StreamingAssets')

    await idbKeyval.set('StreamingAssetsPath', window.dirHandleStreamingAssets);
}

async function getModDir() {
    let modPath = await idbKeyval.get('ModPath');
    let options = modPath ? { startIn: modPath, mode: 'readwrite' } : {mode: 'readwrite'};
    window.dirHandleModDir = await window.showDirectoryPicker(options);
    await idbKeyval.set('ModPath', window.dirHandleModDir);
}

async function getFile(handle, path, create) {
    if(path.length == 1)
    {
        return await (await handle.getFileHandle(path[0])).getFile({ options: { create } });
    }
    else
    {
        var folder = path.splice(0, 1)[0];
        return getFile(await handle.getDirectoryHandle(folder), path, create);
    }
}

async function tryGetFile(handle, path, create) {
    try
    {
        return await getFile(handle, path, create)
    }
    catch
    {
        return null;
    }
}

async function getFolder(handle, path, create) {
    if(path.length == 1)
    {
        return await handle.getDirectoryHandle(path[0], { options: { create }});
    }
    else
    {
        var folder = path.splice(0, 1)[0];
        return getFolder(await handle.getDirectoryHandle(folder), path, create);
    }
}

async function tryGetFolder(handle, path, create)
{
    try
    {
        return await getFolder(handle, path, create)
    }
    catch
    {
        return null;
    }
}