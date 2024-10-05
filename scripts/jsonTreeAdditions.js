function addTreeElement(thisTreeCount, path, parent, editorCallbacks) {
    deleteTree(thisTreeCount);

    const div = document.createElement("div");
    div.id = "file-window-" + thisTreeCount;
    div.className = "file-window";
    parent.appendChild(div);

    const controlsEle = document.createElement("div");
    controlsEle.className = "jsontree-container-controls";
    div.appendChild(controlsEle);

    const jsontreeEle = document.createElement("div");
    jsontreeEle.id = "jsontree-container_" + thisTreeCount;
    jsontreeEle.className = "jsontree-container";
    div.appendChild(jsontreeEle);

    const titleEle = document.createElement("div");
    titleEle.className = "doc-title";
    titleEle.innerText = path;
    controlsEle.appendChild(titleEle);

    const closeCross = document.createElement("div");
    closeCross.innerText = "❌";
    closeCross.className = "close-button";
    closeCross.addEventListener('click', () => {
        deleteTree(thisTreeCount);
    })
    controlsEle.appendChild(closeCross);

    // Editor bar
    const editorBar = document.createElement("div");
    editorBar.className = "editor-bar";
    jsontreeEle.appendChild(editorBar);

    const saveChanges = document.createElement("button");
    saveChanges.innerText = "Save";
    saveChanges.addEventListener('click', () => editorCallbacks.save(true))
    editorBar.appendChild(saveChanges);

    const copySource = document.createElement("button");
    copySource.innerText = "Copy Source";
    copySource.addEventListener('click',editorCallbacks.copySource)
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