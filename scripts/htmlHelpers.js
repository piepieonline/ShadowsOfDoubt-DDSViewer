function updateSelect(id, options) {
    select = document.getElementById(id);
    select.innerHTML = '';

    options.forEach(option => {
        var opt = document.createElement('option');
        opt.value = option;
        opt.innerHTML = option;
        select.appendChild(opt);
    });
}