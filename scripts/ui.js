async function init() {
    await getStreamingAssetsDir();
}

async function loadFromGUI() {
    if (window.dirHandleStreamingAssets == null) {
        await init();
    }

    if (window.dirHandleModDir == null) {
        try {
            await getModDir();
            window.loadedMods = await refreshModList();
            window.selectedMod = null;

            updateSelect('select-loaded-mod', ['None', ...window.loadedMods.map(mod => mod.modName)]);
            if(window?.queryParams?.selectedMod && window.queryParams.selectedMod != "") {
                document.getElementById('select-loaded-mod').value = window.queryParams.selectedMod;
                updateSelectedMod();
            }
        }
        catch { }
    }

    let fileID = document.getElementById('path-to-read').value;

    if(!GUID_PATTERN.test(fileID)) {
        alert('Invalid GUID format, please check and try loading again');
        return;
    }

    let fileType = '';
    if(window.ddsMap.trees.indexOf(fileID) != -1) fileType = 'tree';
    else if(window.ddsMap.messages.indexOf(fileID) != -1) fileType = 'message';
    else if(window.ddsMap.blocks.indexOf(fileID) != -1) fileType = 'block';
    else fileType = document.getElementById('select-guid-type').value;

    document.getElementById('select-guid-type').value = fileType;

    var prefix = '', postfix = '';
    switch (fileType) {
        case 'tree': prefix = "DDS/Trees/"; postfix = ".tree"; break;
        case 'message': prefix = "DDS/Messages/"; postfix = ".msg"; break;
        case 'block': prefix = "DDS/Blocks/"; postfix = ".block"; break;
    }

    await initAndLoad(prefix + fileID + postfix);
}

async function updateSelectedMod() {
    window.selectedMod = window.loadedMods.find(mod => mod.modName == document.getElementById('select-loaded-mod').value);

    if(window.savingEnabled) {
        await openModFolder(window.selectedMod.modName, true);
    }

    loadI18n();
}

async function newMod() {
    if (window.dirHandleStreamingAssets == null || window.dirHandleModDir == null) {
        alert('Please load StreamingAssets and a parent mod folder first');
        throw 'Please load StreamingAssets and a parent mod folder first';
    }

    let modName = prompt('Enter a new mod name');

    if (modName == null)
        return;

    await openModFolder(modName, true);

    window.loadedMods = await refreshModList();
    updateSelect('select-loaded-mod', ['None', ...window.loadedMods.map(mod => mod.modName)]);
    window.selectedMod = window.loadedMods.filter(mod => mod.modName == modName)[0];
    document.getElementById('select-loaded-mod').value = modName;
    updateSelectedMod();
}

async function newFile() {
    if (window.selectedMod == null) {
        alert('Please select a mod to edit first');
        throw 'Please select a mod to edit first';
    }

    let newGUID = await createNewFile(document.getElementById('select-guid-type').value)

    document.getElementById('path-to-read').value = newGUID;

    await loadFromGUI();
}

function setSaving(saving) {
    window.savingEnabled = saving;

    let ele = document.getElementById('saving-enabled-button');
    ele.classList.toggle('saving-disabled');
    ele.innerText = saving ? 'Disable Saving' : 'Enable Saving';
}

function showBrowse() {
    updateBrowse();
    updateBrowseTypeahead();
    document.getElementById('fav-modal').classList.toggle('hidden')
}

function updateBrowse() {
    const browseTypeSelector = document.querySelector('#browse-type-select');
    const browseList = document.querySelector('#fav-list');

    browseList.replaceChildren();

    let listToShow; 

    if(browseTypeSelector.value === 'fav') {
        listToShow = JSON.parse(localStorage.getItem('favs'));
    } else {
        listToShow = window.ddsMap[browseTypeSelector.value].sort((a, b) => window.ddsMap.idNameMap[a].localeCompare(window.ddsMap.idNameMap[b])).map(id => ({
            guid: id,
            name: window.ddsMap.idNameMap[id]
        }));
    }

    document.getElementById('fav-list').innerHTML = listToShow.map(fav =>
        `<li><span class="link-element" onclick="document.getElementById('path-to-read').value = '${fav.guid}'; loadFromGUI(); showFavs();">${fav.guid}</span>: ${fav.name}</li>`
    ).join('');
}

function updateBrowseTypeahead() {
    const browseTypeAheadSelector = document.querySelector('#browse-typeahead');
    const browseList = document.querySelector('#fav-list');
    
    browseList.querySelectorAll('li').forEach(element => {
        let visible = false;
        if(browseTypeAheadSelector.value === "")
            visible = true;
        else if(element.innerText.toLocaleLowerCase().indexOf(browseTypeAheadSelector.value.toLocaleLowerCase()) !== -1)
            visible = true;

        if(visible)
            element.classList.remove('fav-typeahead-hidden')
        else
            element.classList.add('fav-typeahead-hidden')
    })
}

window.toggleFav = (guid, type) => {
    let favs = JSON.parse(localStorage.getItem('favs'));

    let currentFav = favs.find(ele => ele.guid === guid);

    if (currentFav) {
        favs.splice(favs.indexOf(currentFav), 1);
    } else {
        let name = prompt('Name this favourite:', window.ddsMap.idNameMap[guid]);
        if (name) {
            favs.push({
                mod: window.selectedMod,
                type,
                guid,
                name
            });
        }
    }

    localStorage.setItem('favs', JSON.stringify(favs));

    return !currentFav;
}