async function getDir() {
    window.dirHandle = await window.showDirectoryPicker();
}

async function getFile(handle, path)
{
    if(path.length == 1)
    {
        return (await (await handle.getFileHandle(path[0])).getFile()).text();
    }
    else
    {
        var folder = path.splice(0, 1)[0];
        return getFile(await handle.getDirectoryHandle(folder), path);
    }
}