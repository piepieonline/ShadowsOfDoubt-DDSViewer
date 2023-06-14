function addTreeElement(thisTreeCount, path, parent, editorCallbacks) {
    deleteTree(thisTreeCount);

    window.maxTreeCount = thisTreeCount;

    const div = document.createElement("div");
    div.id = "file-window-" + thisTreeCount;
    div.className = "file-window";
    parent.appendChild(div);

    const jsontreeEle = document.createElement("div");
    jsontreeEle.id = "jsontree-container_" + thisTreeCount;
    jsontreeEle.className = "jsontree-container";
    div.appendChild(jsontreeEle);

    const titleEle = document.createElement("div");
    titleEle.className = "doc-title";
    titleEle.innerText = path;
    div.appendChild(titleEle);

    const closeCross = document.createElement("div");
    closeCross.innerText = "❌";
    closeCross.className = "close-button";
    closeCross.addEventListener('click', () => {
        deleteTree(thisTreeCount);
    })
    div.appendChild(closeCross);

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
    for (var i = thisTreeCount; i <= window.maxTreeCount; i++) {
        document.getElementById("file-window-" + i)?.remove()
    }

    window.maxTreeCount = thisTreeCount - 1;
}

function getJSONPointer(node) {
    if (node.isRoot) {
        return "";
    }

    return getJSONPointer(node.parent) + "/" + node.label;
}