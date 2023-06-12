function addTreeElement(thisTreeCount, path, parent) {
    deleteTree(thisTreeCount);

    window.maxTreeCount = thisTreeCount;

    const div = document.createElement("div");
    div.id = "jsontree-container_" + thisTreeCount;
    div.className = "jsontree-container";
    parent.appendChild(div);

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

    return div;
}

function deleteTree(thisTreeCount) {
    for (var i = thisTreeCount; i <= window.maxTreeCount; i++) {
        document.getElementById("jsontree-container_" + i)?.remove()
    }

    window.maxTreeCount = thisTreeCount - 1;
}

function getJSONPointer(node) {
    if (node.isRoot) {
        return "";
    }

    return getJSONPointer(node.parent) + "/" + node.label;
}