async function init() {
    await getStreamingAssetsDir();
}

async function setIdAndLoad(id) {
    document.getElementById('path-to-read').value = id;
    loadFromGUI();
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
            if (window?.queryParams?.selectedMod && window.queryParams.selectedMod != "") {
                document.getElementById('select-loaded-mod').value = window.queryParams.selectedMod;
                updateSelectedMod();
            }
        }
        catch { }
    }

    let fileID = document.getElementById('path-to-read').value;

    if (!GUID_PATTERN.test(fileID)) {
        alert('Invalid GUID format, please check and try loading again');
        return;
    }

    let fileType = '';
    if (window.ddsMap.trees.indexOf(fileID) != -1) fileType = 'tree';
    else if (window.ddsMap.messages.indexOf(fileID) != -1) fileType = 'message';
    else if (window.ddsMap.blocks.indexOf(fileID) != -1) fileType = 'block';
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

    if (window.savingEnabled) {
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

    if (browseTypeSelector.value === 'fav') {
        listToShow = JSON.parse(localStorage.getItem('favs'));
    } else {
        listToShow = window.ddsMap[browseTypeSelector.value].sort((a, b) => window.ddsMap.idNameMap[a].localeCompare(window.ddsMap.idNameMap[b])).map(id => ({
            guid: id,
            name: window.ddsMap.idNameMap[id]
        }));
    }

    document.getElementById('fav-list').innerHTML = listToShow.map(fav =>
        `<li><span class="link-element" onclick="setIdAndLoad('${fav.guid}');">${fav.guid}</span>: ${fav.name}</li>`
    ).join('');
}

function updateBrowseTypeahead() {
    const browseTypeAheadSelector = document.querySelector('#browse-typeahead');
    const browseList = document.querySelector('#fav-list');

    browseList.querySelectorAll('li').forEach(element => {
        let visible = false;
        if (browseTypeAheadSelector.value === "")
            visible = true;
        else if (element.innerText.toLocaleLowerCase().indexOf(browseTypeAheadSelector.value.toLocaleLowerCase()) !== -1)
            visible = true;

        if (visible)
            element.classList.remove('hidden')
        else
            element.classList.add('hidden')
    });
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

function showReverseSearch() {
    document.getElementById('rsearch-modal').classList.toggle('hidden');
}

window.createRSearchList = () => {
    const researchList = document.querySelector('#rsearch-text-list');

    researchList.replaceChildren();

    let listToShow = window.vanillaDDSStringsContent;

    window.rSearchList = [];

    listToShow.forEach((result, i) => {
        let mapping = result.match(/"?(.{36})"?,.*?,"?(.*)"?,"?.*?"?,"?.*?"?,"?.*?"?,/);

        if (!mapping) {
            console.log(`Error with line ${i}: ${result}`)
            return;
        }

        window.rSearchList.push({ id: mapping[1], str: mapping[2].toLocaleLowerCase() });

        let newEle = document.createElement('li');
        newEle.innerText = mapping[2].replace(/",$/, '');
        newEle.setAttribute('x-guid', mapping[1]);
        newEle.classList.add('link-element');
        researchList.appendChild(newEle);

        newEle.addEventListener('click', () => {
            updateRSearchResultsTable(mapping[1]);
        });
    });
}

function updateRSearch() {
    const rsearchTypeaheadValue = document.querySelector('#rsearch-typeahead').value.toLocaleLowerCase();
    const researchList = document.querySelector('#rsearch-text-list').querySelectorAll('li');

    window.rSearchList.forEach(({ id, str }, i) => {
        let visible = false;
        if (rsearchTypeaheadValue === "")
            visible = true;
        else if (str.indexOf(rsearchTypeaheadValue) !== -1)
            visible = true;
        else if (id.indexOf(rsearchTypeaheadValue) !== -1)
            visible = true;

        if (visible)
            researchList[i].classList.remove('hidden')
        else
            researchList[i].classList.add('hidden')
    });
}

function updateRSearchResultsTable(blockId) {
    // .rsearch-result-view

    var cells = '';


    var blockCell = `<td><ul><li>${blockId}</li></ul></td>`;
    var messageId = window.ddsMap.reverseIdMap[blockId].join('</li><li>');
    var messageCell = `<td><ul><li>${messageId}</li></ul></td>`;
    var treeId = window.ddsMap.reverseIdMap[messageId].join('</li><li>');
    var treeList = `<td><ul><li>${treeId}</li></ul></td>`;

    let currentId = blockId;
    while (window.ddsMap.reverseIdMap[currentId] != null) {
        // TODO: Show trees only? How to display this
        cells = '<td><ul>' +
            window.ddsMap.reverseIdMap[currentId]
                .filter((value, index, array) => array.indexOf(value) === index)
                .map(id => ({ name: window.ddsMap.idNameMap[id], id }))
                .map(ele => `<li class="link-element" x-guid=${ele.id}>${window.ddsMap.idNameMap[ele.id] || ele.id}</li>`)
                .join('')
            + '</ul></td>'; // + cells;
        currentId = window.ddsMap.reverseIdMap[currentId];
    }


    var rows = `<tr>${cells}</tr>`;


    /*
    var treeIds = {};
    var messageIds = {};

    window.ddsMap.reverseIdMap[guid].forEach(messageId => {
        if(messageIds[messageId] == null ) messageIds[messageId] = {};
        messageIds[messageId].push(guid);
        window.ddsMap.reverseIdMap[messageId].forEach(treeId => {
            if(treeIds[treeId] == null ) treeIds[treeId] = {};
            treeIds[treeId].push(messageId);
        })
    });

    var rows = [];
    Object.keys(treeIds).forEach(treeId => {
        let messages = '<ul>';
        treeIds[treeId].forEach(messageId => {
            messages += `<li>${messageId}</li>`;
        });
        messages += '</ul>';

        var row = `<tr><td>${treeId}</td><td>${messages}</td><td>${}</td></tr>`;
    })
        */

    document.querySelector('#rsearch-result-view').innerHTML = rows; // `<tr><td>${}</td><td>${}</td></tr>`;

    document.querySelector('#rsearch-result-view').querySelectorAll('li').forEach(liEle => {
        liEle.addEventListener('click', () => {
            setIdAndLoad(liEle.getAttribute('x-guid'));
        });
    })
}