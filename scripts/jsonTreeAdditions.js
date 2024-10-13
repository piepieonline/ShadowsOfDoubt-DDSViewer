function addTreeElement(thisTreeCount, parentElement, fileData, editorCallbacks) {
    deleteTree(thisTreeCount);

    const div = document.createElement("div");
    div.id = "file-window-" + thisTreeCount;
    div.className = "file-window";
    parentElement.appendChild(div);

    const jsontreeEle = document.createElement("div");
    jsontreeEle.id = "jsontree-container_" + thisTreeCount;
    jsontreeEle.className = "jsontree-container";
    div.appendChild(jsontreeEle);

    // Controls sit outside the tree element
    const controlsEle = document.createElement("div");
    controlsEle.className = "jsontree-container-controls";
    // div.appendChild(controlsEle);

    // Editor bar sits inside the tree
    const editorBar = document.createElement("div");
    editorBar.className = "editor-bar";
    jsontreeEle.appendChild(editorBar);

    const titleEle = document.createElement("div");
    titleEle.className = "doc-title";
    const fileNameData = fileData.path.match(/.*\/(.*)\.(\w+)/);
    const fileId = fileNameData[1];
    
    let fileType;

    switch(fileNameData[2])
    {
        case 'tree':
            fileType = 'tree';
            break;
        case 'msg':
            fileType = 'message';
            break;
        case 'block':
            fileType = 'block';
            break;
    }

    // TODO: Can we get name from the caller rather than this mapping
    // This mapping won't work for custom
    titleEle.innerHTML = `<h2>${capitalizeFirstLetter(fileType)}: ${fileData.name}</h2><h3>${fileId} <span class="copy-icon" title="Copy GUID">📄<span>📄</span></span><span class="fav-icon" title="Save to favourites"></span></h3>`;
    editorBar.appendChild(titleEle);

    // Copy GUID function
    titleEle.querySelector('.copy-icon').addEventListener('click', () => {
        navigator.clipboard.writeText(fileId);
    });
    
    // Favourite function and icon
    titleEle.querySelector('.fav-icon').innerText = JSON.parse(localStorage.getItem('favs')).find(ele => ele.guid === fileId) ? '❤' : '♡';
    titleEle.querySelector('.fav-icon').addEventListener('click', () => {
        const isNowFav = window.toggleFav(fileId, fileType);
        titleEle.querySelector('.fav-icon').innerText = isNowFav ? '❤' : '♡';
    });


    const closeCross = document.createElement("div");
    closeCross.innerText = "❌";
    closeCross.className = "close-button";
    closeCross.addEventListener('click', () => {
        deleteTree(thisTreeCount);
    })
    controlsEle.appendChild(closeCross);

    const saveChanges = document.createElement("button");
    saveChanges.innerText = "Save";
    saveChanges.addEventListener('click', () => editorCallbacks.save(true))
    editorBar.appendChild(saveChanges);

    const useAsTemplate = document.createElement("button");
    useAsTemplate.innerText = "Use As Template";
    useAsTemplate.addEventListener('click', editorCallbacks.useAsTemplate)
    editorBar.appendChild(useAsTemplate);

    const copySource = document.createElement("button");
    copySource.innerText = "Copy Source";
    copySource.addEventListener('click', editorCallbacks.copySource)
    editorBar.appendChild(copySource);

    return jsontreeEle;
}

function deleteTree(thisTreeCount) {
    var i = thisTreeCount;
    while(i < 3)
    {
        if(document.getElementById("file-window-" + i) != null)
            document.getElementById("file-window-" + i)?.remove();
        i++;
    }
}

function getJSONPointer(node) {
    if (node.isRoot) {
        return "";
    }

    return getJSONPointer(node.parent) + "/" + node.label;
}

function createEnumSelectElement(domNode, options, selectedIndex) {
    //Create and append select list
    var selectList = document.createElement("select");
    domNode.replaceChildren(selectList);

    //Create and append the options
    for (var i = 0; i < options.length; i++) {
        var option = document.createElement("option");
        
        option.value = i;
        option.text = options[i];
        option.selected = i == selectedIndex;

        selectList.appendChild(option);
    }

    return selectList;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}